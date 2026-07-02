"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { forceUpdateJurnal, deleteJurnal, getJurnalPaginated, getJurnalStats } from "./action";
import {
  Search, BookOpen, CheckCircle, XCircle, Clock,
  AlertTriangle, Eye, Edit, Calendar, User, Building, FileText,
  Trash2
} from "lucide-react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import JurnalDetailModal from "@/components/modals/JurnalDetailModal";

export default function AdminLogbookPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  // States Filter & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [monthFilter, setMonthFilter] = useState("Semua Bulan");
  const [yearFilter, setYearFilter] = useState("Semua Tahun");

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // States Modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedJurnal, setSelectedJurnal] = useState<any>(null);
  const [actionType, setActionType] = useState<"Disetujui" | "Ditolak" | "Pending">("Disetujui");
  const [formCatatan, setFormCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    totalJurnal: 0,
    disetujui: 0,
    totalJurnalPending: 0,
    totalJurnalKendala: 0
  });

  // Ambil user ID admin aktif untuk log activity
  useEffect(() => {
    const getAdminUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    getAdminUser();
  }, []);

  const fetchLogbooks = async () => {
    try {
      setIsLoading(true);
      
      // 1. Ambil data statistik card
      const responseStats = await getJurnalStats();
      if (responseStats.success) {
        setStats(responseStats.stats);
      }
      
      // 2. Ambil data tabel terpaginasi dengan filter
      const response = await getJurnalPaginated(currentPage, entriesPerPage, debounceSearch, statusFilter, monthFilter, yearFilter);
      if (!response.success) throw new Error(response.message);

      setLogs(response.data as any[]);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error: any) {
      toast.error("Gagal memuat data logbook: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
        const timer = setTimeout(() => {
          setDebouncedSearch(searchQuery);
        }, 500);
    
        return () => clearTimeout(timer);
      }, [searchQuery]);
  


  useEffect(() => { fetchLogbooks(); }, [currentPage, entriesPerPage, debounceSearch, statusFilter, monthFilter, yearFilter]);
  useEffect(() => { setCurrentPage(1); }, [debounceSearch, statusFilter, monthFilter, yearFilter, entriesPerPage]);



  const openDetailModal = (jurnal: any) => {
    setSelectedJurnal(jurnal);
    setIsDetailOpen(true);
  };

  const openActionModal = (jurnal: any) => {
    setSelectedJurnal(jurnal);
    setActionType(jurnal.status === 'Pending' ? 'Disetujui' : jurnal.status);
    setFormCatatan(jurnal.catatan || "");
    setIsActionModalOpen(true);
  };

  const handleDeleteJurnal = async (id: number) => {
    const res = await Swal.fire({ 
      title: 'Hapus Jurnal?', 
      text: "Data ini akan hilang secara permanen!", 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!'
    });
    
    if (res.isConfirmed) {
      const out = await deleteJurnal(id, userId);
      if (out.success) { 
        toast.success(out.message); 
        fetchLogbooks(); 
      } else {
        toast.error(out.message);
      }
    }
  };

  const handleProcessAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await forceUpdateJurnal(selectedJurnal.id, actionType, formCatatan, userId);

    if (res.success) {
      toast.success(res.message);
      setIsActionModalOpen(false);
      fetchLogbooks();
    } else {
      toast.error(res.message);
    }
    setIsSubmitting(false);
  };

  // Generate opsi tahun dinamis dari 2024 sampai tahun sekarang (2026)
  const availableYears = ["2024", "2025", "2026"];

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Monitoring Logbook</h2>
        <p className="text-slate-500 text-sm mt-1">Pantau seluruh aktivitas jurnal harian siswa magang</p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-slate-500"><BookOpen size={16} /> Total Jurnal</div>
          <h3 className="text-3xl font-black text-slate-800">{stats.totalJurnal}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-emerald-600"><CheckCircle size={16} /> Disetujui Guru</div>
          <h3 className="text-3xl font-black text-slate-800">{stats.disetujui}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-blue-600"><Clock size={16} /> Menunggu Verifikasi</div>
          <h3 className="text-3xl font-black text-slate-800">{stats.totalJurnalPending}</h3>
        </div>
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-red-600"><AlertTriangle size={16} /> Laporan Berkendala</div>
          <h3 className="text-3xl font-black text-red-700">{stats.totalJurnalKendala}</h3>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

        {/* TOOLBAR */}
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-4 bg-white">
          <div className="relative w-full xl:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input placeholder="Cari siswa, perusahaan, atau kegiatan..." className="pl-9 bg-slate-50 border-slate-200 rounded-full h-10 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
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
              <SelectTrigger className="w-full sm:w-[160px] bg-slate-50 border-slate-200 rounded-full h-10 text-sm">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua Status">Semua Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Disetujui">Disetujui</SelectItem>
                <SelectItem value="Ditolak">Ditolak</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm text-slate-500">

            Tampilkan:
            <Select value={entriesPerPage.toString()} onValueChange={(val) => setEntriesPerPage(Number(val))}>
                            <SelectTrigger className="w-[70px] rounded-full border-slate-200 bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                            </SelectContent>
                          </Select>
                          entri
            </div>
          </div>
        </div>

        {/* TABEL */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-bold text-slate-500 py-4 pl-6 uppercase text-[11px] tracking-wider">Tanggal & Siswa</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider">DUDI & Guru Pembimbing</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider w-[30%]">Aktivitas</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider text-center">Status</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-wider text-center pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: entriesPerPage || 5 }).map((_, index) => (
                  <TableRow key={index} className="animate-pulse border-b border-slate-100">
                    
                    {/* KOLOM 1: Perusahaan (Ikon Kotak + Nama + Alamat) */}
                    <TableCell className="px-6 py-4">
                      
                        <div className="space-y-2">
                          <div className="h-3 w-16 rounded bg-slate-200" />
                          <div className="h-4  w-10 rounded bg-slate-200" />
                        </div>
                    </TableCell>

                    {/* KOLOM 2: Kontak (Email + Telepon) */}
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-3 w-24 rounded bg-slate-200" />
                        <div className="h-3 w-28 rounded bg-slate-200" />
                      </div>
                    </TableCell>

                    {/* KOLOM 3: Penanggung Jawab (Ikon kecil + Nama) */}
                    <TableCell>
                        <div className="h-4 w-100  rounded bg-slate-200" />
                    </TableCell>

                    {/* KOLOM 5: Status */}
                    <TableCell>
                      <div className="h-6 w-20 rounded-full bg-slate-200" />
                    </TableCell>

                    {/* KOLOM 6: Aksi (WAJIB Center) */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="h-8 w-16 rounded-md bg-slate-200" />
                        <div className="h-8 w-14 rounded-md bg-slate-200" />
                        <div className="h-8 w-18 rounded-md bg-slate-200" />
                      </div>
                    </TableCell>

                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400">Tidak ada logbook yang sesuai kriteria.</TableCell></TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">

                    {/* KOLOM 1: TANGGAL & SISWA (Porting Cache Denormalisasi) */}
                    <TableCell className="py-4 pl-6">
                      <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                        <Calendar size={12} /> {new Date(log.tanggal).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </div>
                      <p className="font-bold text-slate-800 text-sm">{log.nama_siswa_cache || "-"}</p>
                    </TableCell>

                    {/* KOLOM 2: DUDI & GURU (Porting Cache Denormalisasi) */}
                    <TableCell>
                      <p className="text-xs font-semibold text-blue-600 flex items-center gap-1.5">
                        <Building size={12} /> {log.nama_dudi_cache || "-"}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                        <User size={12} /> {log.nama_guru_cache || "-"}
                      </p>
                    </TableCell>

                    {/* KOLOM 3: AKTIVITAS & KENDALA */}
                    <TableCell>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{log.kegiatan}</p>
                      {log.kendala && (
                        <div className="mt-1.5 inline-flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded border border-red-100">
                          <AlertTriangle size={10} /> Ada Kendala
                        </div>
                      )}
                    </TableCell>

                    {/* KOLOM 4: STATUS */}
                    <TableCell className="text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        log.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        log.status === 'Ditolak' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {log.status}
                      </span>
                    </TableCell>

                    {/* KOLOM 5: AKSI */}
                    <TableCell className="text-center pr-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => openDetailModal(log)} className="h-8 px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50">
                          <Eye size={14} className="mr-1" /> Detail
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openActionModal(log)} className="h-8 px-2.5 text-slate-600 border-slate-200 hover:bg-slate-50">
                          <Edit size={14} className="mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteJurnal(log.id)} className="h-8 px-2.5 text-red-600 border-red-200 hover:bg-slate-50">
                          <Trash2 size={14} className="mr-1" /> Hapus
                        </Button>
                      </div>
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{totalCount === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1}</span> sampai <span className="font-bold text-slate-800">{Math.min(currentPage * entriesPerPage, totalCount)}</span> dari <span className="font-bold text-slate-800">{totalCount}</span> entri
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0 rounded-md"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ←
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={`w-8 h-8 p-0 rounded-md ${currentPage === page ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-0' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0 rounded-md"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              →
            </Button>
          </div>
        </div>

      </div>

      {/* ================= MODAL DETAIL ================= */}
<JurnalDetailModal 
  isOpen={isDetailOpen} 
  onClose={() => setIsDetailOpen(false)} 
  jurnal={selectedJurnal} 
/>

      {/* ================= MODAL FORCE UPDATE (AKSI ADMIN) ================= */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="sm:max-w-md font-sans rounded-3xl bg-white">
          <DialogHeader><DialogTitle className="text-xl font-black text-slate-800">Intervensi Status Logbook</DialogTitle></DialogHeader>
          <form onSubmit={handleProcessAction} className="space-y-4 pt-2">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-sm text-amber-800">
              <p className="font-bold flex items-center gap-1.5 mb-1"><AlertTriangle size={16} /> Perhatian Admin</p>
              <p className="text-xs">Mengubah status di sini akan <strong>menimpa</strong> keputusan Guru Pembimbing. Gunakan hanya jika diperlukan.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Ubah Status</label>
              <Select value={actionType} onValueChange={(val: any) => setActionType(val)} required>
                <SelectTrigger className="w-full bg-white rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Disetujui">Paksa Setujui</SelectItem>
                  <SelectItem value="Pending">Kembalikan ke Pending</SelectItem>
                  <SelectItem value="Ditolak">Paksa Tolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Catatan Intervensi (Opsional)</label>
              <Textarea placeholder="Alasan perubahan oleh admin..." value={formCatatan} onChange={(e) => setFormCatatan(e.target.value)} className="rounded-xl bg-white" />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl h-11 mt-2">
              {isSubmitting ? "Menyimpan..." : "Terapkan Perubahan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}