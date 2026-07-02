"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExportDudi } from "@/components/details/ExportDudi";
import { deleteDudi, getDudiPaginated, getDudiStats } from "./action";
import DudiFormModal from "@/components/modals/DudiFormModal";
import QrGeneratorModal from "@/components/modals/QrGeneratorModal";
import { Plus, Edit, Trash2, Search, Filter, Building, MapPin, Phone, Building2, CheckCircle, XCircle, Users, Clock, QrCode } from "lucide-react";
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

interface Dudi {
  id: number;
  nama_perusahaan: string;
  alamat: string;
  telepon: string;
  email: string;
  penanggung_jawab: string;
  status: string;
  created_at: string;
  magang?: any[];
}

export default function DudiPage() {
  const supabase = createClient();
  const [dudiList, setDudiList] = useState<Dudi[]>([]);
  const [isLoading, setIsloading] = useState(false);
  const [schoolProfile, setSchoolProfile] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDudiData, setSelectedDudiData] = useState<any>(null);
  const [selectedDudiQR, setSelectedDudiQR] = useState<any | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Pagination & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    totalDudi: 0,
    dudiAktif: 0,
    dudiNonaktif: 0,
    totalSiswaMagang: 0
  })



  
  const fetchDudi = async () => {
    try {
      setIsloading(true);
      const responseStats = await getDudiStats()
      if (responseStats.success) {
        setStats(responseStats.stats)
      }
      const response = await getDudiPaginated(
        currentPage,
        entriesPerPage,
        debouncedSearch,
        statusFilter
      );
      
      if (!response.success) throw new Error(response.message);

      setDudiList(response.data as Dudi[]);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);

      const { data: schoolData } = await supabase.from('pengaturan').select('*').eq('id', 1).maybeSingle();
      if (schoolData) setSchoolProfile(schoolData);
    } catch (error: any) {
      toast.error('Gagal menarik data Perusahaan: ' + error.message);
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

  useEffect(() => {
    fetchDudi();
  }, [currentPage, entriesPerPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, entriesPerPage]);

  const handleDelete = async (id: number, nama: string) => {
    const result = await Swal.fire({
      title: 'Apakah kamu yakin?',
      text: `Data Perusahaan ${nama} akan dihapus!`,
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
        const response = await deleteDudi(id, nama);
        if (!response.success) throw new Error(response.message);
        toast.success(response.message);
        fetchDudi();
      } catch (error: any) {
        toast.error('Gagal menghapus: ' + error.message);
      } finally {
        setIsloading(false);
      }
    }
  };

  const handleAddClick = () => {
    setEditMode(false);
    setSelectedDudiData(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (dudi: Dudi) => {
    setSelectedDudiData(dudi);
    setEditMode(true);
    setIsModalOpen(true);
  };



  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen DUDI</h2>
        </div>
        <ExportDudi
          data={dudiList}
          schoolProfile={schoolProfile}
          namaPencetak="Admin"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total DUDI", val: stats.totalDudi, color: "text-slate-800", icon: <Building2 /> },
          { label: "DUDI Aktif", val: stats.dudiAktif, color: "text-emerald-600", icon: <CheckCircle /> },
          { label: "DUDI Tidak Aktif", val: stats.dudiNonaktif, color: "text-purple-600", icon: <XCircle /> },
          { label: "Total Siswa Magang", val: stats.totalSiswaMagang, color: "text-blue-600", icon: <Clock /> },
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${item.color}`}>
              {item.icon} {item.label}
            </div>
            <h3 className="text-3xl font-black text-slate-800">{item.val}</h3>
          </div>
        ))}
      </div>

      <DudiFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDudi}
        editMode={editMode}
        dudiData={selectedDudiData}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
<div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white">
  
  {/* Bagian Judul: Tetap presisi di kiri */}
  <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
    <span className="text-cyan-500"><Building size={20} /></span>
    Daftar DUDI
  </div>

  {/* Tombol Tambah Siswa: w-full di HP, sm:w-auto di laptop */}
  <Button 
    onClick={handleAddClick} 
    className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 rounded-xl sm:rounded-full font-bold px-6 shadow-md shadow-cyan-500/20 h-10 flex items-center justify-center shrink-0"
  >
    <Plus size={18} className="mr-2 shrink-0" />
    Tambah DUDI
  </Button>
</div>

        <div className="p-4 bg-white flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Cari perusahaan, alamat, penanggung jawab..."
              className="pl-10 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-cyan-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] rounded-full border-slate-200 bg-white">
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
        </div>

        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-700 py-4 px-6">Perusahaan</TableHead>
                <TableHead className="font-bold text-slate-700">Kontak</TableHead>
                <TableHead className="font-bold text-slate-700">Penanggung Jawab</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Siswa Magang</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
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
                          <div className="h-4 w-40 rounded bg-slate-200" />
                          <div className="h-3 w-48 rounded bg-slate-200" />
                        </div>
                      </div>
                    </TableCell>

                    {/* KOLOM 2: Kontak (Email + Telepon) */}
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-3 w-32 rounded bg-slate-200" />
                        <div className="h-3 w-28 rounded bg-slate-200" />
                      </div>
                    </TableCell>

                    {/* KOLOM 3: Penanggung Jawab (Ikon kecil + Nama) */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-slate-200 shrink-0" />
                        <div className="h-4 w-32 rounded bg-slate-200" />
                      </div>
                    </TableCell>

                    {/* KOLOM 4: Siswa Magang (WAJIB Center) */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <div className="h-6 w-16 rounded-md bg-slate-200" />
                      </div>
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
                        <div className="h-8 w-8 rounded-md bg-slate-200" />
                      </div>
                    </TableCell>

                  </TableRow>
                ))
              ) : dudiList.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Tidak ada data mitra ditemukan.</TableCell></TableRow>
              ) : (
                dudiList.map((dudi) => {
                  const jumlahSiswa = dudi.magang?.filter(m => m.status === "Aktif").length || 0;
                  return (
                    <TableRow key={dudi.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500 text-white font-bold">
                            <Building size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{dudi.nama_perusahaan}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin size={12} className="text-slate-400" />
                              <span className="line-clamp-1">{dudi.alamat}</span>
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600 flex items-center gap-2">
                            <span className="text-slate-400">✉</span> {dudi.email}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <Phone size={12} className="text-slate-400" /> {dudi.telepon}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Users size={14} className="text-slate-400" /> {dudi.penanggung_jawab}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${jumlahSiswa > 0 ? 'bg-cyan-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                          {jumlahSiswa} siswa
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${dudi.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {dudi.status === 'Aktif' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-400 hover:text-blue-600" 
                            onClick={() => { setSelectedDudiQR(dudi); setIsQrModalOpen(true); }}
                          >
                            <QrCode size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEditClick(dudi)}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(dudi.id, dudi.nama_perusahaan)}>
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
      <QrGeneratorModal 
  isOpen={isQrModalOpen} 
  onClose={() => setIsQrModalOpen(false)} 
  dudiData={selectedDudiQR} 
/>
    </div>
  );
}