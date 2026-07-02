"use client";

import { useEffect, useState } from "react";
import { getPresensiHarian } from "@/app/(dashboard)/siswa/jurnal/presensiAction";
import { Calendar, Search, MapPin, CheckCircle, Users, Clock, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function PresensiDashboardPage() {
  const todayStr = new Date().toISOString().split("T")[0]; // Format standar YYYY-MM-DD
  
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [presensiList, setPresensiList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchPresensi = async (date: string) => {
    setIsLoading(true);
    const res = await getPresensiHarian(date);
    if (res.success) {
      setPresensiList(res.data || []);
    } else {
      toast.error(res.message || "Gagal memuat data presensi");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPresensi(selectedDate);
  }, [selectedDate]);

  // Handler Filter Pencarian Nama Siswa / Perusahaan
  const filteredData = presensiList.filter((p) => 
    p.namaSiswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.perusahaan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Kalkulasi Stat Ringkas Harian
  const totalHadir = presensiList.length;
  const radiusAman = presensiList.filter(p => p.jarak <= 15).length; // Jarak sangat presisi (< 15 meter)

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Navigation className="text-blue-600 rotate-45" size={24} /> Real-time Radar Presensi
          </h2>
          <p className="text-xs text-slate-400 mt-1">Memantau kehadiran siswa magang di lokasi instansi secara akurat</p>
        </div>

        {/* DATE PICKER FILTER TUNGGAL */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input 
              type="date"
              className="pl-9 h-10 font-bold text-xs rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-blue-500 w-[160px]"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => fetchPresensi(selectedDate)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* STAT CARDS HARIAN BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Siswa Hadir Hari Ini</span>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{totalHadir} <span className="text-xs font-medium text-slate-400">Anak</span></h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Users size={20} /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Akurasi Radius Tinggi</span>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{radiusAman} <span className="text-xs font-medium text-slate-400">Anak</span></h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle size={20} /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Tanggal Monitoring</span>
            <h3 className="text-lg font-black text-slate-800 mt-2.5">
              {new Date(selectedDate).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'short' })}
            </h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Clock size={20} /></div>
        </div>
      </div>

      {/* DATA TABEL AREA */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* INNER FILTER SEARCH BAR */}
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input 
              placeholder="Cari siswa / nama instansi..."
              className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            Terfilter: {filteredData.length} baris
          </div>
        </div>

        {/* DATA GRID TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Waktu Scan</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4">Instansi Tempat Magang</th>
                <th className="p-4">Akurasi GPS Jarak</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="animate-pulse border-b border-slate-100">
                    <td className="p-4 pl-6"><div className="h-4 w-14 rounded bg-slate-200" /></td>
                    <td className="p-4"><div className="h-4 w-32 rounded bg-slate-200" /></td>
                    <td className="p-4"><div className="h-4 w-44 rounded bg-slate-200" /></td>
                    <td className="p-4"><div className="h-4 w-28 rounded bg-slate-200" /></td>
                    <td className="p-4"><div className="h-6 w-16 mx-auto rounded-full bg-slate-200" /></td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                    {presensiList.length === 0 
                      ? "Belum ada siswa yang melakukan absen masuk pada tanggal ini." 
                      : "Tidak ada siswa yang cocok dengan kata kunci pencarian."}
                  </td>
                </tr>
              ) : (
                filteredData.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-all">
                    {/* Waktu */}
                    <td className="p-4 pl-6 font-bold text-slate-700">
                      {p.waktu.substring(0, 5)} <span className="text-[10px] text-slate-400 font-normal">WIB</span>
                    </td>
                    {/* Profil */}
                    <td className="p-4">
                      <p className="font-black text-slate-800">{p.namaSiswa}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">NISN: {p.nisn}</p>
                    </td>
                    {/* Perusahaan */}
                    <td className="p-4 font-bold text-slate-700">
                      {p.perusahaan}
                    </td>
                    {/* Jarak GPS Radar */}
                    <td className="p-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`font-black flex items-center gap-1 ${p.jarak <= 15 ? "text-emerald-600" : "text-amber-600"}`}>
                          <MapPin size={12} /> {p.jarak} Meter
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold truncate max-w-[150px]">
                          {p.koordinat}
                        </span>
                      </div>
                    </td>
                    {/* Status Badge */}
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-600 border-emerald-100">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}