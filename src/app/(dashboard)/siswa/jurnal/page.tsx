"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteJurnal } from "./action";
import { checkPresensiHariIni } from "./presensiAction";
import QrScannerModal from "@/components/modals/QrScannerModal";
import JurnalFormModal from "@/components/modals/JurnalFormModal";
import { Plus, Search, Calendar, BookOpen, CheckCircle, Clock, XCircle, Edit, Trash2, AlertTriangle, Award, Eye, Lock, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import JurnalDetailModal from "@/components/modals/JurnalDetailModal";

export default function JurnalSiswaPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMagang, setActiveMagang] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedJurnal, setSelectedJurnal] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Absensi & Lock States
  const [hasAbsen, setHasAbsen] = useState(false);
  const [isCheckingAbsen, setIsCheckingAbsen] = useState(true);
  const [siswaId, setSiswaId] = useState<number | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [monthFilter, setMonthFilter] = useState("Semua Bulan");
  const [yearFilter, setYearFilter] = useState("Semua Tahun");

const fetchStatusAbsen = async (sId: number) => {
    setIsCheckingAbsen(true);
    const res = await checkPresensiHariIni(sId); // Kirim ID number siswa, bukan UUID
    setHasAbsen(res.hasAbsen);
    setIsCheckingAbsen(false);
  };

  const fetchJurnal = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: siswaData } = await supabase
      .from('siswa')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (siswaData) {
      setSiswaId(siswaData.id); // Simpan ID int8 siswa ke state
      
      // 🔥 Pemicu Cek Absen Hari Ini menggunakan ID Int8 Siswa
      fetchStatusAbsen(siswaData.id);

      const { data: magang } = await supabase
        .from('magang')
        .select('id, status, dudi(nama_perusahaan)')
        .eq('siswa_id', siswaData.id) 
        .in('status', ['Aktif', 'Selesai'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); 

      if (magang) {
        setActiveMagang(magang);
        
        if (magang.status === 'Aktif' || magang.status === 'Selesai') {
          const { data: jurnal } = await supabase
            .from('jurnal')
            .select('*')
            .eq('magang_id', magang.id)
            .order('tanggal', { ascending: false });
            
          setLogs(jurnal || []);
        }
      }
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchJurnal(); }, []);

  const openDetailModal = (jurnal: any) => {
    setSelectedJurnal(jurnal);
    setIsDetailOpen(true);
  };

  const handleDelete = async (id: number) => {
    const res = await Swal.fire({ title: 'Hapus Jurnal?', text: "Data ini akan hilang!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
    if (res.isConfirmed) {
      const out = await deleteJurnal(id, userId);
      if (out.success) { toast.success(out.message); fetchJurnal(); }
    }
  };

  // Stat Calculations
  const total = logs.length;
  const approved = logs.filter(l => l.status === 'Disetujui').length;
  const pending = logs.filter(l => l.status === 'Pending').length;
  const rejected = logs.filter(l => l.status === 'Ditolak').length;

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hasTodayJournal = logs.some(log => log.tanggal === todayStr);

  const availableYears = Array.from(new Set(logs.map(log => new Date(log.tanggal).getFullYear().toString()))).sort((a,b) => b.localeCompare(a));

  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.tanggal);
    const logMonth = (logDate.getMonth() + 1).toString();
    const logYear = logDate.getFullYear().toString();

    const matchesSearch = log.kegiatan.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (log.kendala && log.kendala.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "Semua Status" || log.status === statusFilter;
    const matchesMonth = monthFilter === "Semua Bulan" || logMonth === monthFilter;
    const matchesYear = yearFilter === "Semua Tahun" || logYear === yearFilter;
    
    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Jurnal Harian Magang</h2>
          <p className="text-sm text-slate-400 mt-1">Isi laporan kegiatan magang harian Anda di sini</p>
        </div>
        
        {/* AREA TOMBOL GUARDED FLOW */}
        {activeMagang && activeMagang.status === 'Aktif' && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
            {isCheckingAbsen ? (
              <div className="h-11 w-32 bg-slate-100 animate-pulse rounded-full" />
            ) : hasAbsen ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs h-11 px-4 rounded-full shadow-sm">
                <CheckCircle2 size={16} /> Hadir di Lokasi
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 px-5 rounded-full flex items-center gap-1.5 shadow-md shadow-blue-500/10 w-full sm:w-auto"
              >
                <QrCode size={16} /> Scan QR Hadir
              </Button>
            )}

            <Button 
              disabled={isCheckingAbsen || !hasAbsen}
              onClick={() => { setEditMode(false); setIsModalOpen(true); }} 
              className={`font-bold text-xs h-11 px-5 rounded-full flex items-center gap-1.5 shadow-sm transition-all w-full sm:w-auto ${
                hasAbsen 
                  ? "bg-slate-800 hover:bg-slate-900 text-white" 
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              {hasAbsen ? <Plus size={16} /> : <Lock size={14} />} Tambah Jurnal
            </Button>
          </div>
        )}
      </div>

      {(!activeMagang ) && !isLoading && (
        <div className="p-8 bg-white border border-slate-200 rounded-3xl text-slate-500 flex flex-col items-center gap-2 shadow-sm">
          <BookOpen size={40} className="opacity-30 mb-2" />
          <p className="font-bold text-slate-700 text-center text-lg">Belum Ada Riwayat Penempatan</p>
          <p className="text-sm text-slate-400 text-center max-w-sm">Anda belum memiliki penempatan magang aktif saat ini. Hubungi Admin untuk plotting instansi.</p>
        </div>
      )}

      {activeMagang && activeMagang.status === 'Selesai' && !isLoading && (
        <div className="bg-purple-50 border border-purple-200 p-6 rounded-2xl flex items-center gap-4 text-purple-700 shadow-sm">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600 shrink-0">
            <Award size={24} />
          </div>
          <div>
            <p className="font-bold text-base text-purple-900">Masa Magang Selesai</p>
            <p className="text-sm mt-0.5 opacity-90">Program magang Anda di <strong>{activeMagang.dudi?.nama_perusahaan}</strong> telah berakhir. Halaman ini beralih fungsi sebagai arsip riwayat jurnal Anda.</p>
          </div>
        </div>
      )}

      {!hasTodayJournal && activeMagang && activeMagang.status === 'Aktif' && !isLoading && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 text-amber-700 shadow-sm">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Pengingat</p>
              <p className="text-xs mt-0.5 opacity-90">Anda belum mengisi jurnal hari ini. Silakan isi jurnal terlebih dahulu.</p>
            </div>
          </div>
          {/* Tombol Isi Sekarang juga wajib di-lock kalau belum absen */}
          <Button 
            disabled={isCheckingAbsen || !hasAbsen}
            onClick={() => { setEditMode(false); setIsModalOpen(true); }} 
            size="sm" 
            className={`font-bold h-9 px-6 rounded-lg shadow-sm w-full sm:w-auto ${
              hasAbsen ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-amber-200 text-amber-500 cursor-not-allowed"
            }`}
          >
            {hasAbsen ? "Isi Sekarang" : <><Lock size={12} className="mr-1.5"/> Terkunci</>}
          </Button>
        </div>
      )}

      {activeMagang && (activeMagang.status === 'Aktif' || activeMagang.status === 'Selesai') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Jurnal", val: total, color: "text-slate-800", icon: <BookOpen /> },
            { label: "Disetujui", val: approved, color: "text-emerald-600", icon: <CheckCircle /> },
            { label: "Menunggu", val: pending, color: "text-blue-600", icon: <Clock /> },
            { label: "Ditolak", val: rejected, color: "text-red-600", icon: <XCircle /> },
          ].map((item, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${item.color}`}>
                 {item.icon} {item.label}
              </div>
              <h3 className="text-3xl font-black text-slate-800">{item.val}</h3>
            </div>
          ))}
        </div>
      )}

      {activeMagang && (activeMagang.status === 'Aktif' || activeMagang.status === 'Selesai') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
            <div className="font-bold flex items-center gap-2 text-slate-800 shrink-0">
              <Calendar size={20} className="text-blue-600" /> Riwayat Jurnal
            </div>
            
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-56 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="Cari kegiatan..." 
                  className="pl-9 h-9 text-sm rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-full md:w-[130px] h-9 text-sm rounded-lg bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua Bulan">Semua Bulan</SelectItem>
                  <SelectItem value="1">Januari</SelectItem>
                  <SelectItem value="2">Februari</SelectItem>
                  <SelectItem value="3">Maret</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">Mei</SelectItem>
                  <SelectItem value="6">Juni</SelectItem>
                  <SelectItem value="7">Juli</SelectItem>
                  <SelectItem value="8">Agustus</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">Oktober</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">Desember</SelectItem>
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full md:w-[110px] h-9 text-sm rounded-lg bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua Tahun">Semua Tahun</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[130px] h-9 text-sm rounded-lg bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua Status">Semua Status</SelectItem>
                  <SelectItem value="Pending">Menunggu</SelectItem>
                  <SelectItem value="Disetujui">Disetujui</SelectItem>
                  <SelectItem value="Ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4 pl-6">Tanggal</th>
                  <th className="p-4 w-[50%]">Kegiatan & Kendala</th>
                  <th className="p-4">Status</th>
                  {activeMagang.status === 'Aktif' && <th className="p-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse border-b border-slate-100">
                      <td className="p-4 pl-6"><div className="h-4 w-28 rounded bg-slate-200" /></td>
                      <td className="p-4"><div className="space-y-2"><div className="h-4 w-full rounded bg-slate-200" /><div className="h-4 w-5/6 rounded bg-slate-200" /></div></td>
                      <td className="p-4"><div className="h-6 w-20 rounded-full bg-slate-200" /></td>
                      {activeMagang.status === "Aktif" && <td className="p-4"><div className="flex justify-center gap-2"><div className="h-8 w-8 rounded bg-slate-200" /><div className="h-8 w-8 rounded bg-slate-200" /></div></td>}
                    </tr>
                  ))
                ) : (
                  filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={activeMagang.status === 'Aktif' ? 4 : 3} className="p-8 text-center text-slate-500">
                        Tidak ada jurnal yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/40">
                        <td className="p-4 pl-6 font-bold text-slate-700">{new Date(log.tanggal).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                        <td className="p-4">
                          <p className="text-slate-800 leading-relaxed line-clamp-2">{log.kegiatan}</p>
                          {log.kendala && <p className="text-[10px] text-red-500 mt-1 font-medium italic">Kendala: {log.kendala}</p>}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                            log.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            log.status === 'Ditolak' ? 'bg-red-50 text-red-600 border-red-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>{log.status}</span>
                        </td>
                        {activeMagang.status === 'Aktif' && (
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openDetailModal(log) }><Eye size={16}/></Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedJurnal(log); setEditMode(true); setIsModalOpen(true); }}><Edit size={16}/></Button>
                              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(log.id)}><Trash2 size={16}/></Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <JurnalDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        jurnal={selectedJurnal} 
      />

      <JurnalFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchJurnal} editMode={editMode} jurnalData={selectedJurnal} magangId={activeMagang?.id} authUserId={userId} />

      <QrScannerModal
  isOpen={isScannerOpen}
  onClose={() => setIsScannerOpen(false)}
  onSuccessAbsen={() => siswaId && fetchStatusAbsen(siswaId)} // Ambil dari state siswaId
  authUserId={userId}
  magangId={activeMagang?.id}
/>
    </div>
  );
}