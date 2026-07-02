"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteClientUser,getUserPaginated } from "./action";
import UserFormModal from "@/components/modals/UserFormModal";
import { Plus, Edit, Trash2, Search, Filter, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
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

interface User {
  id: string;
  nama_lengkap: string;
  email: string;
  role: string;
  email_verified?: boolean; // Menyesuaikan dengan UI referensi
  created_at: string;
}

export default function PenggunaPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsloading] = useState(false);
  
  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUserFullData, setSelectedUserFullData] = useState<any>(null);

  // ==========================================
  // STATE UNTUK SEARCH, FILTER, & PAGINATION
  // ==========================================
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Semua Role");
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchUsers = async () => {
    try {
      setIsloading(true);
      const response = await getUserPaginated(currentPage, entriesPerPage, debounceSearch, roleFilter);
            if (!response.success) throw new Error(response.message);
      
            setUsers(response.data as any[]);
            setTotalPages(response.totalPages);
            setTotalCount(response.totalCount);
    } catch (error) {
      toast.error('Gagal menarik data');
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

  useEffect(() => { fetchUsers(); }, [currentPage, entriesPerPage, debounceSearch, roleFilter]);

  // Reset ke halaman 1 kalau user ngetik pencarian atau ganti filter
  useEffect(() => { setCurrentPage(1); }, [debounceSearch, entriesPerPage]);

  const handleDelete = async (id: string, nama: string) => {
    const result = await Swal.fire({
      title: 'Apakah kamu yakin?',
      text: `Akun ${nama} akan dihapus secara permanen!`,
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
        const response = await deleteClientUser(id, nama);
        if (!response.success) throw new Error(response.message);
        toast.success(response.message);
        fetchUsers();
      } catch (error: any) {
        toast.error('Gagal menghapus: ' + error.message);
      } finally {
        setIsloading(false);
      }
    }
  };

  const handleAddClick = () => {
    setEditMode(false);
    setSelectedUserFullData(null);
    setIsModalOpen(true);
  };

  const handleEditClick = async (user: User) => {
    setIsloading(true); 
    try {
      let profileData = {};
      if (user.role === 'Guru') {
        const { data } = await supabase.from('guru').select('*, users(nama_lengkap, email)').eq('user_id', user.id).single();
        if (data) profileData = data;
      } else if (user.role === 'Siswa') {
        const { data } = await supabase.from('siswa').select('*, users(nama_lengkap, email)').eq('user_id', user.id).single();
        if (data) profileData = data;
      }
      setSelectedUserFullData({ ...user, ...profileData });
      setEditMode(true);
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Gagal mengambil detail profil');
    } finally {
      setIsloading(false);
    }
  };

  // ==========================================
  // LOGIKA FILTERING & PAGINATION (MATEMATIKA)
  // ==========================================
  
  // 1. Saring data berdasarkan Search dan Filter Role
  
  // Format Tanggal
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER HALAMAN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen User</h2>
        </div>
      </div>

      <UserFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
        editMode={editMode}
        userData={selectedUserFullData}
      />

      {/* BUNGKUSAN UTAMA TABEL (Mirip screenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* TOP BAR: JUDUL TABEL & TOMBOL TAMBAH */}
<div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white">
  
  {/* Bagian Judul: Tetap presisi di kiri */}
  <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
    <span className="text-cyan-500"><Filter size={20} /></span>
    Data User
  </div>

  {/* Tombol Tambah Siswa: w-full di HP, sm:w-auto di laptop */}
  <Button 
    onClick={handleAddClick} 
    className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 rounded-xl sm:rounded-full font-bold px-6 shadow-md shadow-cyan-500/20 h-10 flex items-center justify-center shrink-0"
  >
    <Plus size={18} className="mr-2 shrink-0" />
    Tambah User
  </Button>
</div>

        {/* TOOLBAR: SEARCH & FILTER */}
        <div className="p-4 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Cari nama, email..." 
              className="pl-10 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-cyan-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] rounded-full border-slate-200 bg-slate-50">
                  <SelectValue placeholder="Semua Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua Role">Semua Role</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Guru">Guru</SelectItem>
                  <SelectItem value="Siswa">Siswa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              Tampilkan:
              <Select value={entriesPerPage.toString()} onValueChange={(val) => setEntriesPerPage(Number(val))}>
                <SelectTrigger className="w-[70px] rounded-full border-slate-200 bg-slate-50">
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
        
        {/* AREA TABEL */}
        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700 py-4 px-6">User</TableHead>
                <TableHead className="font-bold text-slate-700">Email & Verifikasi</TableHead>
                <TableHead className="font-bold text-slate-700">Role</TableHead>
                <TableHead className="font-bold text-slate-700">Terdaftar</TableHead>
                <TableHead className="text-center font-bold text-slate-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: entriesPerPage || 5 }).map((_, index) => (
                  <TableRow key={index} className="animate-pulse border-b border-slate-100">
                    
                    {/* KOLOM 1: Perusahaan (Ikon Kotak + Nama + Alamat) */}
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                        <div className="space-y-2">
                          <div className="h-4 w-24 rounded bg-slate-200" />
                          <div className="h-3 w-30 rounded bg-slate-200" />
                        </div>
                      </div>
                    </TableCell>

                    {/* KOLOM 2: Kontak (Email + Telepon) */}
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-3 w-32 rounded bg-slate-200" />
                        <div className="h-4 w-28 rounded bg-slate-200" />
                      </div>
                    </TableCell>


                    {/* KOLOM 4: Siswa Magang (WAJIB Center) */}
                    <TableCell className="text-center">
                        <div className="h-6 w-16 rounded-md bg-slate-200" />
                    </TableCell>

                    {/* KOLOM 5: Status */}
                    <TableCell>
                      <div className="h-6 w-20 rounded-full bg-slate-200" />
                    </TableCell>

                    {/* KOLOM 6: Aksi (WAJIB Center) */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="h-8 w-8 rounded-md bg-slate-200" />
                        <div className="h-8 w-8 rounded-md bg-slate-200" />
                      </div>
                    </TableCell>

                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">Tidak ada data ditemukan.</TableCell></TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                    
                    {/* KOLOM 1: Avatar & Nama */}
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg
                          ${user.role === 'Admin' ? 'bg-cyan-600' : user.role === 'Guru' ? 'bg-teal-500' : 'bg-blue-500'}
                        `}>
                          {user.nama_lengkap.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{user.nama_lengkap}</p>
                          <p className="text-xs text-slate-400 font-medium">ID: {user.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* KOLOM 2: Email & Badge Verified */}
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          {user.email}
                        </p>
                        {user.email_verified ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-100">
                            <CheckCircle2 size={12} />
                            Verified
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-bold border border-red-100">
                            <XCircle size={12} />
                            Unverified
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {/* KOLOM 3: Role Badge */}
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border
                        ${user.role === 'Admin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        user.role === 'Guru' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-cyan-50 text-cyan-600 border-cyan-100'}
                      `}>
                        {user.role}
                      </span>
                    </TableCell>

                    {/* KOLOM 4: Terdaftar */}
                    <TableCell>
                      <p className="text-sm font-semibold text-slate-700">{formatDate(user.created_at)}</p>
                    </TableCell>

                    {/* KOLOM 5: Aksi */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEditClick(user)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(user.id, user.nama_lengkap)} disabled={user.role === "Admin"}>
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