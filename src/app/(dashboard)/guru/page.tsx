"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Users, Clock, Star, Building, ChevronRight, Calendar, ClipboardList, CheckCircle, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardGuruPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  
  // State Data
  const [profilGuru, setProfilGuru] = useState<any>(null);
  const [stats, setStats] = useState({ totalSiswa: 0,  perluNilai: 0, siswaPending: 0 });
  const [siswaAktif, setSiswaAktif] = useState<any[]>([]);
  const [jurnalPendingList, setJurnalPendingList] = useState<any[]>([]);

  // Format Tanggal Hari Ini
  const d = new Date();
  const todayFormatted = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });



  useEffect(() => {
    async function fetchDashboard() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Ambil Profil Guru
        const { data: guru } = await supabase.from('guru').select('*, users(nama_lengkap)').eq('user_id', user.id).single();
        if (!guru) return;
        setProfilGuru(guru);

        // 2. Ambil Semua Data Magang milik Guru ini
        const { data: magangList } = await supabase
          .from('magang')
          .select('id, status, nilai_akhir, tanggal_mulai, tanggal_selesai, siswa(users(nama_lengkap), nis), dudi(nama_perusahaan)')
          .eq('guru_id', guru.id)
          .order('created_at', { ascending: false });

        if (!magangList || magangList.length === 0) {
          setIsLoading(false);
          return;
        }

        // Hitung Statistik Magang
        const totalSiswa = magangList.filter(m => m.status === 'Aktif' || m.status === 'Selesai').length;
        const perluNilai = magangList.filter(m => m.status === 'Selesai' && (!m.nilai_akhir || m.nilai_akhir === 0)).length;
        const siswaPending = magangList.filter(m => m.status === 'Pending').length;
        
        // Ambil 5 Siswa Aktif Teratas untuk Tabel Kiri
        const aktifList = magangList.filter(m => m.status === 'Aktif').slice(0, 5);
        setSiswaAktif(aktifList);

        // 3. Ambil Data Jurnal Pending
        const magangIds = magangList.map(m => m.id);
        const { data: jurnalList } = await supabase
          .from('jurnal')
          .select('id, tanggal, status, magang_id')
          .in('magang_id', magangIds)
          .eq('status', 'Pending')
          .order('tanggal', { ascending: true }); // Yang paling lama pending di atas
        

        
        // Gabungkan data jurnal pending dengan nama siswa untuk list Kanan
        if (jurnalList) {
          const formattedPending = jurnalList.slice(0, 5).map(j => {
            const relatedMagang = magangList.find(m => m.id === j.magang_id);
            const siswaData = relatedMagang?.siswa as any; 
            return {
              ...j,
              nama_siswa: siswaData?.users.nama_lengkap || '-'
            };
          });
          setJurnalPendingList(formattedPending);
        }

        setStats({ totalSiswa,  perluNilai, siswaPending });

      } catch (error) {
        console.error("Gagal memuat dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  if (isLoading) return <div className="flex h-[70vh] items-center justify-center text-slate-500 font-bold">Memuat Dashboard...</div>;

  return (
    <div className="space-y-6 font-sans">
      
      {/* ======================= HEADER BANNER ======================= */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <ClipboardList size={250} />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-blue-100 font-medium mb-1 tracking-wide">{getGreeting()},</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{profilGuru?.users.nama_lengkap || 'Guru Pembimbing'}</h2>
            <p className="text-sm text-blue-50 font-medium">Guru Pembimbing Instansi</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 flex items-center gap-2 text-sm font-bold shadow-sm">
            <Calendar size={18} /> {todayFormatted}
          </div>
        </div>
      </div>

      {/* ======================= STATISTIK CEPAT ======================= */}
       
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Siswa Bimbingan", val: stats.totalSiswa, color: "text-slate-800", icon: <Users /> },
          { label: "Siswa Menunggu Verifikasi", val: stats.siswaPending, color: "text-amber-600", icon: <Clock /> },
          { label: "Siswa Perlu Penilaian", val: stats.perluNilai, color: "text-emerald-600", icon: <Star /> },
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${item.color}`}>
               {item.icon} {item.label}
            </div>
            <h3 className="text-3xl font-black text-slate-800">{item.val}</h3>
          </div>
        ))}
      </div>

      {/* ======================= MAIN CONTENT GRID ======================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI (Siswa Aktif Magang) */}
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Users size={20} className="text-blue-500"/> Siswa Aktif Magang
            </h3>
            <Link href="/guru/magang" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="flex-1 p-0">
            {siswaAktif.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center h-full text-slate-400">
                <Building size={40} className="opacity-30 mb-3" />
                <p className="font-bold text-slate-600">Tidak Ada Siswa Aktif</p>
                <p className="text-sm mt-1">Belum ada siswa bimbingan yang berstatus aktif saat ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Siswa</th>
                      <th className="p-4">Tempat Magang</th>
                      <th className="p-4">Periode</th>
                      <th className="p-4 text-right pr-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {siswaAktif.map(m => {

                      return (
                        <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 pl-6">
                            <p className="font-bold text-slate-800">{m.siswa?.users.nama_lengkap}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">NIS: {m.siswa?.nis}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-slate-700 flex items-center gap-1.5"><Building size={14} className="text-slate-400"/> {m.dudi?.nama_perusahaan}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-xs text-slate-600">{m.tanggal_mulai || '-'} <span className="text-slate-400">s/d</span> {m.tanggal_selesai || '-'}</p>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-md border border-blue-100">
                              Aktif
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN (Jurnal Menunggu Validasi) */}
        <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-white">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Clock size={20} className="text-amber-500"/> Jurnal Menunggu Validasi
            </h3>
            <p className="text-xs text-slate-500 mt-1">Logbook yang butuh persetujuan Anda</p>
          </div>

          <div className="flex-1 p-0 flex flex-col">
            {jurnalPendingList.length === 0 ? (
              <div className="flex-1 p-10 text-center flex flex-col items-center justify-center text-slate-400">
                <CheckCircle size={40} className="text-emerald-400 mb-3 opacity-50" />
                <p className="font-bold text-emerald-600 text-base">Semua Selesai!</p>
                <p className="text-sm mt-1">Tidak ada jurnal yang mengantri untuk divalidasi.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {jurnalPendingList.map((jurnal) => (
                  <div key={jurnal.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{jurnal.nama_siswa}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(jurnal.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <Link href="/guru/jurnal">
                        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold border-amber-200 text-amber-600 hover:bg-amber-50 px-3">
                          Periksa
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Link Lihat Semua di bagian bawah */}
            {jurnalPendingList.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto rounded-b-3xl text-center">
                <Link href="/guru/jurnal" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1">
                  Lihat Semua Jurnal Pending <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}