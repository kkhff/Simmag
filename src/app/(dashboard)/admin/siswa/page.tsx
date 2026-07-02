"use client";

import { useEffect, useState } from "react";
import { getSiswaPaginated, getSiswaStats } from "./action";
import { deleteClientUser } from "@/app/(dashboard)/admin/pengguna/action";
import UserFormModal from "@/components/modals/UserFormModal"; 
import { Plus, Edit, Trash2, Search, Users, User, Mail, Phone, GraduationCap, Building, Clock, XCircle, CheckCircle, BookOpen, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { 
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell 
} from "@/components/ui/table";
import { 
  Select, SelectTrigger, SelectValue, SelectItem, SelectContent 
} from "@/components/ui/select";

export default function SiswaPage() {
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [isLoading, setIsloading] = useState(false);
  
  // State Modal (Reuse dari Pengguna)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSiswaData, setSelectedSiswaData] = useState<any>(null);

  // State Search, Filter, & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
      totalSiswa: 0,
      siswaAktif: 0,
      totalSiswaSedang: 0,
      totalSiswaSelesai: 0
    })

    useEffect(() => {
          const fetchRealStats = async () => {
            const response = await getSiswaStats()
            if (response.success) {
              setStats(response.stats)
            }
          }
          fetchRealStats()
        }, [])


  const fetchSiswa = async () => {
    try {
      setIsloading(true);
      const responseStats = await getSiswaStats()
            if (responseStats.success) {
              setStats(responseStats.stats)
            }
      // Fetch siswa sekaligus mengecek penempatan magangnya di DUDI
      const response = await getSiswaPaginated(currentPage, entriesPerPage, debounceSearch, statusFilter);
            if (!response.success) throw new Error(response.message);
      
            setSiswaList(response.data as any[]);
            setTotalPages(response.totalPages);
            setTotalCount(response.totalCount);
    } catch (error) {
      toast.error('Gagal menarik data Siswa');
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

  useEffect(() => { fetchSiswa(); }, [currentPage, entriesPerPage, debounceSearch, statusFilter]);
  useEffect(() => { setCurrentPage(1); }, [debounceSearch, statusFilter, entriesPerPage]);

  const handleDelete = async (userId: string, nama: string) => {
    const result = await Swal.fire({
      title: 'Apakah kamu yakin?',
      text: `Akun Siswa ${nama} beserta data magang/jurnalnya akan dihapus permanen!`,
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
        const response = await deleteClientUser(userId, nama); // Hapus dari Auth
        if (!response.success) throw new Error(response.message);
        toast.success(response.message);
        fetchSiswa();
      } catch (error: any) {
        toast.error('Gagal menghapus: ' + error.message);
      } finally {
        setIsloading(false);
      }
    }
  };

  const handleAddClick = () => {
    setEditMode(false);
    setSelectedSiswaData(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (siswa: any) => {
    // Sesuaikan format data agar dikenali oleh UserFormModal
    const formattedData = {
      ...siswa,
      id: siswa.user_id, // ID Auth
      role: 'Siswa',
      email_verified: siswa.users?.email_verified || false
    };
    setSelectedSiswaData(formattedData);
    setEditMode(true);
    setIsModalOpen(true);
  };

  // ==========================================
  // LOGIKA PERHITUNGAN SUMMARY CARDS
  // ==========================================


  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER HALAMAN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Siswa</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola data peserta didik dan status magangnya</p>
        </div>
      </div>

      {/* ========================================== */}
      {/* AREA 4 SUMMARY CARDS */}
      {/* ========================================== */}
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Siswa", val: stats.totalSiswa, color: "text-slate-800", icon: <Users /> },
                { label: "Siswa Aktif", val: stats.siswaAktif, color: "text-emerald-600", icon: <CheckCircle /> },
                { label: "Sedang Magang", val: stats.totalSiswaSedang, color: "text-blue-600", icon: <Clock /> },
                { label: "Selesai Magang", val: stats.totalSiswaSelesai, color: "text-purple-600", icon: <UserCheck /> },
              ].map((item, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${item.color}`}>
                     {item.icon} {item.label}
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">{item.val}</h3>
                </div>
              ))}
            </div>

      {/* REUSE MODAL PENGGUNA */}
      <UserFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSiswa}
        editMode={editMode}
        userData={selectedSiswaData}
      />

      {/* BUNGKUSAN UTAMA TABEL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        
        {/* TOP BAR */}
<div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white">
  
  {/* Bagian Judul: Tetap presisi di kiri */}
  <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
    <span className="text-cyan-500"><GraduationCap size={20} /></span>
    Data Siswa
  </div>

  {/* Tombol Tambah Siswa: w-full di HP, sm:w-auto di laptop */}
  <Button 
    onClick={handleAddClick} 
    className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 rounded-xl sm:rounded-full font-bold px-6 shadow-md shadow-cyan-500/20 h-10 flex items-center justify-center shrink-0"
  >
    <Plus size={18} className="mr-2 shrink-0" />
    Tambah Siswa
  </Button>
</div>

        {/* TOOLBAR: SEARCH & FILTER */}
        <div className="p-4 bg-white flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Cari NIS, nama, atau jurusan..." 
              className="pl-10 rounded-full bg-white border-slate-200 focus-visible:ring-cyan-500 max-w-2xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] rounded-full border-slate-200 bg-white">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua Status">Semua Status</SelectItem>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Magang">Magang</SelectItem>
                <SelectItem value="Selesai">Selesai</SelectItem>
                <SelectItem value="Nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
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
        
        {/* AREA TABEL */}
        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-white">
              <TableRow>
                <TableHead className="font-bold text-slate-700 py-4 px-6">NIS</TableHead>
                <TableHead className="font-bold text-slate-700">Nama & Kelas</TableHead>
                <TableHead className="font-bold text-slate-700">Kontak</TableHead>
                <TableHead className="font-bold text-slate-700">Penempatan</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="text-center font-bold text-slate-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse">
        <TableCell className="px-6 py-4">
          <div className="h-4 w-20 rounded bg-slate-200" />
        </TableCell>


        <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-200 shrink-0" />
                        <div className="space-y-2">
                          <div className="h-4 w-36 rounded bg-slate-200" />
                          <div className="h-3 w-18 rounded bg-slate-200" />
                        </div>
                      </div>
                    </TableCell>

        <TableCell>
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-4 w-28 rounded bg-slate-200" />
          </div>
        </TableCell>

        <TableCell className="text-center">
          <div className="mx-auto h-4 w-26 rounded bg-slate-200" />
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
              ) : siswaList.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Tidak ada data siswa ditemukan.</TableCell></TableRow>
              ) : (
                siswaList.map((siswa) => {
                  // Cek apakah ada data magang yang terkait
                  const dudiName = siswa.magang && siswa.magang.length > 0 && siswa.magang[0].dudi 
                    ? siswa.magang[0].dudi.nama_perusahaan 
                    : '-';

                  return (
                  <TableRow key={siswa.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                    
                    {/* KOLOM 1: NIS */}
                    <TableCell className="px-6 py-4">
                      <p className="font-bold text-slate-800">{siswa.nis}</p>
                    </TableCell>

                    {/* KOLOM 2: NAMA & KELAS */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">{siswa.users.nama_lengkap}</p>
                          <p className="text-xs text-slate-500">{siswa.kelas} - {siswa.jurusan.nama_jurusan}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* KOLOM 3: KONTAK */}
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600 flex items-center gap-2">
                          <Mail size={12} className="text-slate-400" /> {siswa.users.email}
                        </p>
                        <p className="text-xs text-slate-600 flex items-center gap-2">
                          <Phone size={12} className="text-slate-400" /> {siswa.telepon || '-'}
                        </p>
                      </div>
                    </TableCell>

                    {/* KOLOM 4: PENEMPATAN DUDI */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <Building size={14} className="text-slate-400" />
                         <span className="text-sm font-medium text-slate-700">{dudiName}</span>
                      </div>
                    </TableCell>

                    {/* KOLOM 5: STATUS */}
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border
                        ${siswa.status === 'Aktif' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                          siswa.status === 'Magang' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                          siswa.status === 'Selesai' ? 'bg-purple-50 text-purple-600 border-purple-200' : 
                          'bg-red-50 text-red-600 border-red-200'}
                      `}>
                        {siswa.status}
                      </span>
                    </TableCell>

                    {/* KOLOM 6: AKSI */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50" onClick={() => handleEditClick(siswa)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(siswa.user_id, siswa.users.nama_lengkap)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>

                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>
        </div>

        {/* FOOTER: PAGINATION */}
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
    </div>
  );
}