"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users, Building, GraduationCap, BookOpen,
  ChevronRight, Calendar, CircleDashed
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function DashboardAdmin() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [namaSekolah, setNamaSekolah] = useState("Sistem Magang");

  // State untuk menyimpan semua data dashboard
  const [stats, setStats] = useState({
    totalSiswa: 0,
    dudiAktif: 0,
    siswaMagang: 0,
    logbookHariIni: 0
  });
  const [latestMagang, setLatestMagang] = useState<any[]>([]);
  const [latestLogbook, setLatestLogbook] = useState<any[]>([]);
  const [topDudi, setTopDudi] = useState<any[]>([]);

  // Format Tanggal Hari Ini (ex: Minggu, 14 Juni 2026)
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];

        const { data } = await supabase.from('pengaturan').select('*').eq('id', 1).single();

        const [
          resSiswa,
          resDudi,
          resMagangCount,
          resLogbookCount,
          resLatestMagang,
          resDudiList,
          resLatestJurnal
        ] = await Promise.all([
          supabase.from('siswa').select('id', { count: 'exact', head: true }),
          supabase.from('dudi').select('id', { count: 'exact', head: true }).eq('status', 'Aktif'),
          supabase.from('magang').select('id', { count: 'exact', head: true }).eq('status', 'Aktif'), // Dikoreksi ke tabel magang
          supabase.from('jurnal').select('id', { count: 'exact', head: true }).eq('tanggal', today),

          // Narik 2 data magang terbaru
          supabase.from('magang').select('*, siswa(users(nama_lengkap)), dudi(nama_perusahaan)').order('created_at', { ascending: false }).limit(2),

          // Narik DUDI aktif beserta jumlah siswa magangnya
          supabase.from('dudi').select('id, nama_perusahaan, alamat, magang(id, status)').eq('status', 'Aktif').limit(4),

          supabase.from('jurnal').select('*, magang(siswa(users(nama_lengkap)))').order('created_at', { ascending: false }).limit(3)
        ]);

        if (data && data.nama_sekolah) setNamaSekolah(data.nama_sekolah);

        setStats({
          totalSiswa: resSiswa.count || 0,
          dudiAktif: resDudi.count || 0,
          siswaMagang: resMagangCount.count || 0,
          logbookHariIni: resLogbookCount.count || 0
        });

        setLatestMagang(resLatestMagang.data || []);
        setTopDudi(resDudiList.data || []);
        setLatestLogbook(resLatestJurnal.data || []);

      } catch (error) {
        toast.error("Gagal memuat data dashboard");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Helper pengaman relasi untuk mencegah React Child error
  const getSiswaName = (magangData: any) => {
    if (!magangData || !magangData.siswa) return "-";
    const siswa = magangData.siswa;
    if (Array.isArray(siswa)) {
      return siswa?.[0]?.users?.nama_lengkap ?? "-";
    }
    return siswa?.users?.nama_lengkap ?? "-";
  };

  if (isLoading) {
    return <div className="flex h-[70vh] items-center justify-center text-slate-500 font-bold">Memuat Dashboard...</div>;
  }

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Ringkasan aktivitas sistem magang — {namaSekolah}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 shadow-sm">
          <Calendar size={16} className="text-slate-400" />
          {todayFormatted}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Users size={20} />
          </div>
          <h3 className="text-3xl font-black text-blue-900 mb-1">{stats.totalSiswa}</h3>
          <p className="text-sm font-bold text-slate-800">Total Siswa</p>
          <p className="text-xs text-slate-400 mt-1">Seluruh siswa terdaftar</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Building size={20} />
          </div>
          <h3 className="text-3xl font-black text-blue-900 mb-1">{stats.dudiAktif}</h3>
          <p className="text-sm font-bold text-slate-800">Perusahaan Mitra</p>
          <p className="text-xs text-slate-400 mt-1">DUDI yang berstatus aktif</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <GraduationCap size={20} />
          </div>
          <h3 className="text-3xl font-black text-blue-900 mb-1">{stats.siswaMagang}</h3>
          <p className="text-sm font-bold text-slate-800">Siswa Magang Aktif</p>
          <p className="text-xs text-slate-400 mt-1">Siswa yang sedang bekerja</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <BookOpen size={20} />
          </div>
          <h3 className="text-3xl font-black text-blue-900 mb-1">{stats.logbookHariIni}</h3>
          <p className="text-sm font-bold text-slate-800">Logbook Hari Ini</p>
          <p className="text-xs text-slate-400 mt-1">Laporan yang masuk hari ini</p>
        </div>

      </div>

      {/* GRID KONTEN BAWAH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* KOLOM KIRI (LEBIH LEBAR) */}
        <div className="lg:col-span-2 space-y-6">

          {/* SECTION: MAGANG TERBARU */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><GraduationCap size={16} /></div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Magang Terbaru</h3>
                  <p className="text-[10px] text-slate-400">Penempatan magang terakhir</p>
                </div>
              </div>
              <Link href="/admin/magang" className="text-blue-600 text-xs font-bold flex items-center hover:underline">
                Lihat Semua <ChevronRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Siswa</th>
                    <th className="p-4">Perusahaan</th>
                    <th className="p-4">Periode</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {latestMagang.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-sm text-slate-400">Belum ada data penempatan.</td></tr>
                  ) : (
                    latestMagang.map((m) => {
                      // Amankan data nama untuk JSX
                      const namaSiswa = Array.isArray(m.siswa) ? m.siswa[0]?.users.nama_lengkap : m.siswa?.users.nama_lengkap;
                      const namaPerusahaan = Array.isArray(m.dudi) ? m.dudi[0]?.nama_perusahaan : m.dudi?.nama_perusahaan;

                      return (
                        <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="p-4 pl-6 font-bold text-slate-800 text-sm">{namaSiswa || '-'}</td>
                          <td className="p-4 text-slate-600 text-sm">{namaPerusahaan || '-'}</td>
                          <td className="p-4 text-xs text-slate-500"><span className="flex items-center gap-1"><Calendar size={12} /> {formatDateStr(m.tanggal_mulai)} - {formatDateStr(m.tanggal_selesai)}</span></td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${m.status === 'Aktif' ? 'bg-blue-50 text-blue-600 border-blue-100' : m.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : m.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION: LOGBOOK TERBARU */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><BookOpen size={16} /></div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Logbook Terbaru</h3>
                  <p className="text-[10px] text-slate-400">Catatan aktivitas harian siswa</p>
                </div>
              </div>
              <Link href="/admin/jurnal" className="text-blue-600 text-xs font-bold flex items-center hover:underline">
                Lihat Aktivitas <ChevronRight size={14} />
              </Link>
            </div>

            <div className="p-5 space-y-5">
              {latestLogbook.length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-4 flex flex-col items-center gap-2">
                  <CircleDashed size={24} className="text-slate-300" />
                  Belum ada laporan logbook yang tersimpan.
                </div>
              ) : (
                latestLogbook.map((log) => (
                  <div key={log.id} className="relative pl-6 border-l-2 border-slate-100 pb-2">
                    <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1 border-2 border-white shadow-sm"></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{log.kegiatan}</h4>
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5 font-medium">
                          <Calendar size={12} /> {formatDateStr(log.tanggal)} <span className="text-slate-300">•</span> <span className="text-blue-600 bg-blue-50 px-2 rounded-md">{getSiswaName(log.magang)}</span>
                        </p>
                        {log.kendala && (
                          <p className="text-xs font-medium text-amber-600 mt-2 bg-amber-50 px-3 py-1.5 rounded-lg inline-block border border-amber-100">
                            Kendala: {log.kendala}
                          </p>
                        )}
                      </div>
                      <span className={`px-2.5 py-1.5 mt-2 sm:mt-0 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border ${log.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        log.status === 'Ditolak' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                        {log.status || 'Menunggu'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* KOLOM KANAN (SIDEBAR) */}
        <div className="lg:col-span-1 space-y-6">

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Building size={16} /></div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">DUDI Aktif</h3>
                  <p className="text-[10px] text-slate-400">Mitra perusahaan aktif</p>
                </div>
              </div>
              <Link href="/admin/dudi" className="text-blue-600 text-xs font-bold flex items-center hover:underline">
                Semua <ChevronRight size={14} />
              </Link>
            </div>

            <div className="p-2">
              {topDudi.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">Belum ada DUDI berstatus aktif.</p>
              ) : (
                topDudi.map((d) => {
                  // DI SINI KOREKSINYA: m diberi tipe secara eksplisit (any)
                  const jumlahSiswaMagang = Array.isArray(d.magang)
                    ? d.magang.filter((m: any) => m.status === 'Aktif').length
                    : 0;

                  return (
                    <div key={d.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="pr-2">
                        <h4 className="font-bold text-slate-800 text-sm leading-tight truncate max-w-[160px]">{d.nama_perusahaan}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[160px]">{d.alamat}</p>
                      </div>
                      <div className="px-2.5 h-6 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 border border-blue-100" title="Jumlah Siswa Magang Aktif">
                        <Users size={12} className="mr-1" /> {jumlahSiswaMagang}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Total DUDI Aktif</span>
              <span className="text-slate-800 font-black text-sm">{stats.dudiAktif} Mitra</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}