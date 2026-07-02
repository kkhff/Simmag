"use client";

import { useEffect, useState } from "react";
import { getGuruPaginated, getGuruStats } from "./acton"; 
import { deleteClientUser } from "@/app/(dashboard)/admin/pengguna/action";
import UserFormModal from "@/components/modals/UserFormModal";
import { Plus, Edit, Trash2, Search, Users, User, Mail, Phone, BookOpen, XCircle, CheckCircle, Clock } from "lucide-react";
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

export default function GuruPage() {
  const [guruList, setGuruList] = useState<any[]>([]);
  const [isLoading, setIsloading] = useState(false);

  // State Modal (Reuse dari Pengguna)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedGuruData, setSelectedGuruData] = useState<any>(null);

  // State Search, Filter, & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    totalGuru: 0,
    guruAktif: 0,
    guruNonAktif: 0,
    totalSiswaMagang: 0
  })


  const fetchGuru = async () => {
    try {
      setIsloading(true);
      const responseStats = await getGuruStats()
        if (responseStats.success) {
          setStats(responseStats.stats)
        }
      // Fetch guru sekaligus menghitung jumlah siswa magang yang dibimbingnya
      const response = await getGuruPaginated(currentPage, entriesPerPage, debouncedSearch, statusFilter);
      if (!response.success) throw new Error(response.message);

      setGuruList(response.data as any[]);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error: any) {
      toast.error('Gagal menarik data guru: ' + error.message);
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

  useEffect(() => { fetchGuru(); }, [currentPage, entriesPerPage, debouncedSearch, statusFilter]);
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter, entriesPerPage]);

  const handleDelete = async (userId: string, nama: string) => {
    const result = await Swal.fire({
      title: 'Apakah kamu yakin?',
      text: `Akun Guru ${nama} beserta data bimbingannya akan dihapus permanen!`,
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
        const response = await deleteClientUser(userId, nama); // Hapus dari Auth Supabase
        if (!response.success) throw new Error(response.message);
        toast.success(response.message);
        fetchGuru();
      } catch (error: any) {
        toast.error('Gagal menghapus: ' + error.message);
      } finally {
        setIsloading(false);
      }
    }
  };

  const handleAddClick = () => {
    setEditMode(false);
    setSelectedGuruData(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (guru: any) => {
    // Sesuaikan format data agar dikenali oleh UserFormModal
    const formattedData = {
      ...guru,
      id: guru.user_id, // ID Auth
      role: 'Guru',
      email_verified: guru.users?.email_verified || false
    };
    setSelectedGuruData(formattedData);
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
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Guru</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola data guru pembimbing</p>
        </div>
      </div>

      {/* ========================================== */}
      {/* AREA 4 SUMMARY CARDS */}
      {/* ========================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Guru", val: stats.totalGuru, color: "text-slate-800", icon: <Users /> },
          { label: "Guru Aktif", val: stats.guruAktif, color: "text-emerald-600", icon: <CheckCircle /> },
          { label: "Guru Non-Aktif", val: stats.guruNonAktif, color: "text-purple-600", icon: <XCircle /> },
          { label: "Siswa Bimbingan", val: stats.totalSiswaMagang, color: "text-blue-600", icon: <Clock /> },
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
        onSuccess={fetchGuru}
        editMode={editMode}
        userData={selectedGuruData}
      />

      {/* BUNGKUSAN UTAMA TABEL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">

        {/* TOP BAR */}
<div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white">
  
  {/* Bagian Judul: Tetap presisi di kiri */}
  <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
    <span className="text-cyan-500"><Users size={20} /></span>
    Data Guru
  </div>

  {/* Tombol Tambah Siswa: w-full di HP, sm:w-auto di laptop */}
  <Button 
    onClick={handleAddClick} 
    className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 rounded-xl sm:rounded-full font-bold px-6 shadow-md shadow-cyan-500/20 h-10 flex items-center justify-center shrink-0"
  >
    <Plus size={18} className="mr-2 shrink-0" />
    Tambah Guru
  </Button>
</div>

        {/* TOOLBAR: SEARCH & FILTER */}
        <div className="p-4 bg-white flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Cari guru, NIP, atau mata pelajaran..."
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
                <TableHead className="font-bold text-slate-700 py-4 px-6">NIP</TableHead>
                <TableHead className="font-bold text-slate-700">Nama</TableHead>
                <TableHead className="font-bold text-slate-700">Mata Pelajaran</TableHead>
                <TableHead className="font-bold text-slate-700">Jenis Kelamin</TableHead>
                <TableHead className="font-bold text-slate-700">Kontak</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Siswa</TableHead>
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

        <TableCell>
          <div className="h-4 w-36 rounded bg-slate-200" />
        </TableCell>

        <TableCell>
          <div className="h-4 w-28 rounded bg-slate-200" />
        </TableCell>

        <TableCell>
          <div className="h-4 w-20 rounded bg-slate-200" />
        </TableCell>

        <TableCell>
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-4 w-24 rounded bg-slate-200" />
          </div>
        </TableCell>

        <TableCell className="text-center">
          <div className="mx-auto h-6 w-16 rounded bg-slate-200" />
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
              ) : guruList.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-500">Tidak ada data guru ditemukan.</TableCell></TableRow>
              ) : (
                guruList.map((guru: any) => {
                  // KOREKSI DI SINI: m diberi tipe secara eksplisit (any)
                  const jumlahSiswa = guru.magang?.filter((m: any) => m.status === 'Aktif').length || 0;

                  return (
                    <TableRow key={guru.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">

                      {/* KOLOM 1: NIP */}
                      <TableCell className="px-6 py-4">
                        <p className="font-bold text-slate-800">{guru.nip || '-'}</p>
                      </TableCell>

                      {/* KOLOM 2: NAMA */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500 shrink-0">
                            <User size={16} />
                          </div>
                          <p className="font-bold text-slate-700">{guru.users.nama_lengkap}</p>
                        </div>
                      </TableCell>

                      {/* KOLOM 3: MAPEL */}
                      <TableCell>
                        <p className="text-sm font-medium text-slate-600">{guru.mata_pelajaran || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-slate-600">{guru.jenis_kelamin || '-'}</p>
                      </TableCell>

                      {/* KOLOM 4: KONTAK */}
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-600 flex items-center gap-2">
                            <Mail size={12} className="text-slate-400" /> {guru.users.email}
                          </p>
                          <p className="text-xs text-slate-600 flex items-center gap-2">
                            <Phone size={12} className="text-slate-400" /> {guru.telepon || '-'}
                          </p>
                        </div>
                      </TableCell>

                      {/* KOLOM 5: SISWA BIMBINGAN */}
                      <TableCell className="text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold
                        ${jumlahSiswa > 0 ? 'bg-amber-500 text-white' : 'bg-amber-400 text-white'}
                      `}>
                          {jumlahSiswa} siswa
                        </span>
                      </TableCell>

                      {/* KOLOM 6: STATUS */}
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize
                        ${guru.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}
                      `}>
                          {guru.status || 'Aktif'}
                        </span>
                      </TableCell>

                      {/* KOLOM 7: AKSI */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50" onClick={() => handleEditClick(guru)}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(guru.user_id, guru.users.nama_lengkap)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>

                    </TableRow>
                  )
                })
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