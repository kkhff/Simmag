"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteMagang, getMagangPaginated, getMagangStats } from "./action";
import MagangFormModal from "@/components/modals/MagangFormModal";
import { ExportMagang } from "@/components/details/ExportMagang";
import { Plus, Edit, Trash2, Search, Calendar, Briefcase, UserCheck, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";

export default function MagangPage() {
  const supabase = createClient();
  const [magangList, setMagangList] = useState<any[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<any>(null); 
  const [isLoading, setIsloading] = useState(false);

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedMagangData, setSelectedMagangData] = useState<any>(null);

  // State Search, Filter, & Pagination Server-side
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // State Statistik Realtime dari Backend
  const [stats, setStats] = useState({
    totalMagang: 0,
    pending: 0,
    aktif: 0,
    selesai: 0
  });

  const fetchMagang = async () => {
    try {
      setIsloading(true);

      // 1. Ambil Data Profil Sekolah untuk Kop Surat PDF
      const { data: schoolData } = await supabase.from('pengaturan').select('*').eq('id', 1).maybeSingle();
      if (schoolData) setSchoolProfile(schoolData);

      // 2. Ambil Statistik Dashboard
      const responseStats = await getMagangStats();
      if (responseStats.success) {
        setStats(responseStats.stats);
      }

      // 3. Tarik Data Magang Terpaginasi Server Action
      const response = await getMagangPaginated(currentPage, entriesPerPage, debounceSearch, statusFilter);
      if (!response.success) throw new Error(response.message);

      setMagangList(response.data);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error: any) {
      toast.error('Gagal memuat data penempatan magang: ' + error.message);
    } finally {
      setIsloading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Efek Pemantau Parameter Ganti Rute / Ganti State
  useEffect(() => { fetchMagang(); }, [currentPage, entriesPerPage, debounceSearch, statusFilter]);
  useEffect(() => { setCurrentPage(1); }, [debounceSearch, statusFilter, entriesPerPage]);

  const handleDelete = async (id: number, namaSiswa: string) => {
    const result = await Swal.fire({
      title: 'Batalkan Penempatan?',
      text: `Data magang ${namaSiswa} akan dihapus secara permanen!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      customClass: { popup: 'font-sans' }
    });

    if (result.isConfirmed) {
      try {
        setIsloading(true);
        const response = await deleteMagang(id, namaSiswa);
        if (!response.success) throw new Error(response.message);
        toast.success(response.message);
        fetchMagang();
      } catch (error: any) {
        toast.error('Gagal menghapus: ' + error.message);
      } finally {
        setIsloading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER DIV */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Penempatan Magang</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola dan export data penempatan siswa</p>
        </div>

        <ExportMagang
          data={magangList} // Langsung lempar array aktif ter-filter
          schoolProfile={schoolProfile}
          namaGuru="Admin" 
        />
      </div>

      {/* STAT CARDS DASHBOARD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Penempatan", val: stats.totalMagang, color: "text-slate-800", icon: <Briefcase /> },
          { label: "Menunggu Konfirmasi", val: stats.pending, color: "text-amber-600", icon: <Clock /> },
          { label: "Magang Aktif", val: stats.aktif, color: "text-purple-600", icon: <CheckCircle /> },
          { label: "Selesai", val: stats.selesai, color: "text-blue-600", icon: <UserCheck /> },
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${item.color}`}>
              {item.icon} {item.label}
            </div>
            <h3 className="text-3xl font-black text-slate-800">{item.val}</h3>
          </div>
        ))}
      </div>

      <MagangFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMagang}
        editMode={editMode}
        magangData={selectedMagangData}
      />

      {/* TABEL UTAMA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

<div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white">
  
  {/* Bagian Judul: Tetap presisi di kiri */}
  <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
    <span className="text-cyan-500"><Briefcase size={20} /></span>
    Hubungan Penempatan Magang
  </div>

  {/* Tombol Tambah Siswa: w-full di HP, sm:w-auto di laptop */}
  <Button 
    onClick={() => { setEditMode(false); setSelectedMagangData(null); setIsModalOpen(true); }}
    className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 rounded-xl sm:rounded-full font-bold px-6 shadow-md shadow-cyan-500/20 h-10 flex items-center justify-center shrink-0"
  >
    <Plus size={18} className="mr-2 shrink-0" />
    Tambah Penempatan
  </Button>
</div>

        {/* SEARCH & FILTER BAR */}
        <div className="p-4 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Cari nama siswa, perusahaan, atau pembimbing..."
              className="pl-10 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] rounded-full bg-slate-50 border-slate-200">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua Status">Semua Status</SelectItem>
                <SelectItem value="Pending">Menunggu Konfirmasi</SelectItem>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Selesai">Selesai</SelectItem>
                <SelectItem value="Ditolak">Ditolak</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              Tampilkan:
              <Select value={entriesPerPage.toString()} onValueChange={(val) => setEntriesPerPage(Number(val))}>
                <SelectTrigger className="w-[70px] rounded-full bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* TABLE DATA */}
        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/60">
              <TableRow>
                <TableHead className="font-bold text-slate-700 py-4 px-6">Siswa / NIS</TableHead>
                <TableHead className="font-bold text-slate-700">Perusahaan Mitra</TableHead>
                <TableHead className="font-bold text-slate-700">Pembimbing</TableHead>
                <TableHead className="font-bold text-slate-700">Periode</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="text-center font-bold text-slate-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse">
        <TableCell className="px-6 py-4">
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-4 w-24 rounded bg-slate-200" />
          </div>
        </TableCell>

        <TableCell>
          <div className="h-4 w-36 rounded bg-slate-200" />
        </TableCell>

        <TableCell>
          <div className=" h-4 w-36 rounded bg-slate-200" />
        </TableCell>

        <TableCell>
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="h-3 w-20 rounded bg-slate-200" />
          </div>
        </TableCell>

        <TableCell>
          <div className="h-6 w-20 rounded-full bg-slate-200" />
        </TableCell>

        <TableCell>
          <div className="flex justify-center gap-2">
            <div className="h-8 w-8 rounded bg-slate-200" />
            <div className="h-8 w-8 rounded bg-slate-200" />
          </div>
        </TableCell>
      </TableRow>
    ))
              ) : magangList.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Data tidak ditemukan.</TableCell></TableRow>
              ) : (
                magangList.map((m) => (
                  <TableRow key={m.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-100">
                    <TableCell className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800">{m.nama_siswa_cache || m.siswa?.users?.nama_lengkap || 'Unknown'}</p>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                          {m.siswa?.nis ? `${m.siswa.nis} • ` : ""} 
                          {m.siswa?.kelas || ""} {m.nama_jurusan_cache || ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-slate-700">{m.nama_dudi_cache || m.dudi?.nama_perusahaan || 'N/A'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-slate-600">{m.nama_guru_cache || m.guru?.users?.nama_lengkap || 'N/A'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-slate-600 flex flex-col gap-0.5">
                        <span className="flex items-center gap-1"><Calendar size={12} className="text-slate-400" /> {formatDate(m.tanggal_mulai)}</span>
                        <span className="text-slate-400 pl-4">s/d</span>
                        <span className="flex items-center gap-1"><Calendar size={12} className="text-slate-400" /> {formatDate(m.tanggal_selesai)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        m.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        m.status === 'Selesai' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        m.status === 'Ditolak' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {m.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-600" onClick={() => { setSelectedMagangData(m); setEditMode(true); setIsModalOpen(true); }}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600" onClick={() => handleDelete(m.id, m.nama_siswa_cache || m.siswa?.users?.nama_lengkap)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{totalCount === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1}</span> sampai <span className="font-bold text-slate-800">{Math.min(currentPage * entriesPerPage, totalCount)}</span> dari <span className="font-bold text-slate-800">{totalCount}</span> entri
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 rounded-md" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>←</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className={`w-8 h-8 p-0 rounded-md ${currentPage === page ? 'bg-blue-600 hover:bg-blue-700 text-white border-0' : ''}`} onClick={() => setCurrentPage(page)}>{page}</Button>
            ))}
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 rounded-md" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>→</Button>
          </div>
        </div>

      </div>
    </div>
  );
}