"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  BookOpen, Building, CheckCircle, Clock, XCircle, 
  ChevronRight, Calendar, AlertTriangle, PenTool, Send, User, FileText, Award 
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardSiswaPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  
  // State Data
  const [profilSiswa, setProfilSiswa] = useState<any>(null);
  const [activeMagang, setActiveMagang] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [latestLogs, setLatestLogs] = useState<any[]>([]);

  // Format Tanggal Hari Ini
  const d = new Date();
  const todayFormatted = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    async function fetchDashboard() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: siswa } = await supabase.from('siswa').select('*, users(nama_lengkap), jurusan(nama_jurusan)').eq('user_id', user.id).single();
      if (siswa) setProfilSiswa(siswa);

      if (siswa) {
        // UBAH DI SINI: Tarik data magang terakhir tanpa filter 'Aktif'
        const { data: magang } = await supabase
          .from('magang')
          .select('*, dudi(nama_perusahaan, alamat, telepon), guru(users(nama_lengkap), nip)')
          .eq('siswa_id', siswa.id)
          .in('status', ['Aktif', 'Selesai']) // Hanya tarik yang statusnya Aktif atau Selesai
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (magang) {
          setActiveMagang(magang);
          
          // Hanya tarik jurnal kalau statusnya Aktif atau Selesai
          if (magang.status === 'Aktif' || magang.status === 'Selesai') {
            const { data: jurnalData } = await supabase
              .from('jurnal')
              .select('*')
              .eq('magang_id', magang.id)
              .order('tanggal', { ascending: false });
              
            setLogs(jurnalData || []);
            setLatestLogs((jurnalData || []).slice(0, 4)); 
          }
        }
      }
      setIsLoading(false);
    }
    fetchDashboard();
  }, []);

  const total = logs.length;
  const approved = logs.filter(l => l.status === 'Disetujui').length;
  const pending = logs.filter(l => l.status === 'Pending').length;
  const rejected = logs.filter(l => l.status === 'Ditolak').length;
  const hasTodayJournal = logs.some(log => log.tanggal === todayStr);

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
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <BookOpen size={250} />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-blue-100 font-medium mb-1 tracking-wide">{getGreeting()},</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">{profilSiswa?.users.nama_lengkap || 'Siswa'}</h2>
            <p className="text-sm text-blue-50 font-medium">{profilSiswa?.nis} • {profilSiswa?.kelas + " " +profilSiswa?.jurusan.nama_jurusan}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 flex items-center gap-2 text-sm font-bold shadow-sm">
            <Calendar size={18} /> {todayFormatted}
          </div>
        </div>
      </div>

      {/* STATISTIK JURNAL (MUNCUL JIKA AKTIF ATAU SELESAI) */}
      {activeMagang && (activeMagang.status === 'Aktif' || activeMagang.status === 'Selesai') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center shrink-0"><FileText size={20}/></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase">Total Jurnal</p><h3 className="text-2xl font-black text-slate-800">{total}</h3></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0"><CheckCircle size={20}/></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase">Disetujui</p><h3 className="text-2xl font-black text-slate-800">{approved}</h3></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shrink-0"><Clock size={20}/></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase">Menunggu</p><h3 className="text-2xl font-black text-slate-800">{pending}</h3></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center shrink-0"><XCircle size={20}/></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase">Ditolak</p><h3 className="text-2xl font-black text-slate-800">{rejected}</h3></div>
          </div>
        </div>
      )}

      {/* GRID KONTEN BAWAH */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <div className="xl:col-span-2 space-y-6">
          
          {/* LOGIKA KARTU AKSI CEPAT */}
          {!activeMagang ? (
            // KONDISI 1: BELUM PENEMPATAN / DITOLAK
            <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-5 shadow-sm text-center sm:text-left">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={32} />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-black text-slate-800">Belum Ada Penempatan</h4>
                <p className="text-sm text-slate-500 mt-1">Anda belum memiliki DUDI yang berstatus aktif. Silakan hubungi Admin Sekolah.</p>
              </div>
            </div>
          ) : activeMagang.status === 'Selesai' ? (
            // KONDISI 3: SELESAI MAGANG
            <div className="bg-purple-50 border border-purple-200 p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-5 shadow-sm text-center sm:text-left">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                <Award size={32} />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-black text-purple-800">Selamat! Magang Anda Selesai</h4>
                <p className="text-sm text-purple-600 mt-1">
                  Terima kasih atas partisipasinya. 
                  {activeMagang.nilai_akhir ? (
                    <span className="font-bold"> Nilai Akhir Anda: {activeMagang.nilai_akhir}</span>
                  ) : (
                    " Menunggu input nilai dari guru pembimbing."
                  )}
                </p>
              </div>
              <Link href="/siswa/jurnal">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md hidden sm:flex">
                  Lihat Rekap Jurnal
                </Button>
              </Link>
            </div>
          ) : (
            // KONDISI 4: AKTIF MAGANG (ISI JURNAL)
            hasTodayJournal ? (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl flex items-center gap-5 shadow-sm">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                  <CheckCircle size={28} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-emerald-800">Tugas Hari Ini Selesai!</h4>
                  <p className="text-sm text-emerald-600 mt-1">Anda sudah mengisi laporan logbook untuk hari ini. Selamat beristirahat.</p>
                </div>
                <Link href="/siswa/jurnal">
                  <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 bg-white font-bold rounded-xl hidden sm:flex">Lihat Riwayat</Button>
                </Link>
              </div>
            ) : (
              <div className="bg-white hover:border-cyan-400 transition-colors border border-slate-200 p-6 rounded-3xl flex items-center gap-5 shadow-sm">
                <div className="w-14 h-14 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                  <PenTool size={28} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-slate-800">Isi Jurnal Hari Ini</h4>
                  <p className="text-sm text-slate-500 mt-1">Anda belum melaporkan kegiatan magang hari ini. Yuk, isi sekarang!</p>
                </div>
                <Link href="/siswa/jurnal">
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl hidden sm:flex shadow-md shadow-cyan-500/20">
                    Mulai Tulis <ChevronRight size={16} className="ml-1"/>
                  </Button>
                </Link>
              </div>
            )
          )}

          {/* TABEL JURNAL TERBARU (MUNCUL JIKA AKTIF / SELESAI) */}
          {activeMagang && (activeMagang.status === 'Aktif' || activeMagang.status === 'Selesai') && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[350px]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Clock size={20} className="text-cyan-500"/> Riwayat Jurnal Terakhir</h3>
                <Link href="/siswa/jurnal" className="text-sm font-bold text-cyan-600 hover:underline">Lihat Semua</Link>
              </div>
              
              <div className="p-0 flex-1 flex flex-col">
                {latestLogs.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-10 text-slate-400 bg-slate-50/50">
                    <div className="w-24 h-24 bg-white border border-dashed border-slate-300 rounded-full flex items-center justify-center mb-4">
                      <BookOpen size={40} className="text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-600 text-lg">Belum Ada Catatan</p>
                    <p className="text-sm mt-1 max-w-xs text-center">Riwayat jurnalmu akan muncul di sini setelah kamu membuat laporan pertama.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="p-4 pl-6">Tanggal</th>
                          <th className="p-4">Kegiatan</th>
                          <th className="p-4 text-right pr-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {latestLogs.map(log => (
                          <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-700 whitespace-nowrap">
                              {new Date(log.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="p-4">
                              <p className="text-slate-700 leading-relaxed line-clamp-2">{log.kegiatan}</p>
                            </td>
                            <td className="p-4 pr-6 text-right whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                                log.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                log.status === 'Ditolak' ? 'bg-red-50 text-red-600 border-red-100' :
                                'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>{log.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ==================================== */}
        {/* KOLOM KANAN (INFO MAGANG & GURU) */}
        {/* ==================================== */}
        {activeMagang && (
          <div className="xl:col-span-1 space-y-6">
            
            {/* KARTU INFO DUDI */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-50 rounded-full -z-0 opacity-70"></div>
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 relative z-10"><Building size={18} className="text-cyan-600"/> Tempat Magang</h3>
              
              <div className="space-y-5 relative z-10">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Perusahaan Mitra</p>
                  <p className="text-lg font-black text-slate-800 leading-tight">{activeMagang.dudi?.nama_perusahaan}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alamat Lokasi</p>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{activeMagang.dudi?.alamat}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kontak Perusahaan</p>
                  <p className="text-sm font-bold text-slate-700">{activeMagang.dudi?.telepon}</p>
                </div>
              </div>
            </div>

            {/* KARTU INFO GURU PEMBIMBING */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2"><User size={18} className="text-blue-600"/> Guru Pembimbing</h3>
              
              <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="w-12 h-12 bg-white border border-blue-200 rounded-full flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">{activeMagang.guru?.users.nama_lengkap}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">NIP: {activeMagang.guru?.nip || '-'}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center mt-4">Hubungi guru pembimbing jika mengalami kendala berat selama di tempat magang.</p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}