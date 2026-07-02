"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { executeBatchOperation, BatchUserData } from "./action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Settings, ArrowLeft, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

export default function BatchOperationsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null)
  const [batchErrors, setBatchErrors] = useState<string[]>([]);

  // 1. STATE UNTUK MENAMPUNG BARIS TABEL MASAL
  const [rows, setRows] = useState<BatchUserData[]>([
    { nama_lengkap: "", email: "", password: "", role: "Siswa" }
  ])

  // Fungsi Tambah Baris Baru
  const handleAddRow = () => {
    setRows([...rows, { nama_lengkap: "", email: "", password: "", role: "Siswa" }])
  }

  // Fungsi Hapus Baris
  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) {
      toast.error("Minimal harus ada 1 baris data, Bos!")
      return
    }
    setRows(rows.filter((_, i) => i !== index))
  }

  // Handle Perubahan Input di Tabel Utama
  const handleInputChange = (index: number, field: keyof BatchUserData, value: string) => {
    const updatedRows = [...rows]
    updatedRows[index] = { ...updatedRows[index], [field]: value }
    
    // Reset info tambahan jika role diubah di tengah jalan agar tidak tercampur
    if (field === "role") {
      updatedRows[index] = {
        nama_lengkap: updatedRows[index].nama_lengkap,
        email: updatedRows[index].email,
        password: updatedRows[index].password,
        role: value as "Siswa" | "Guru"
      }
    }
    setRows(updatedRows)
  }

  // 2. FUNGSI MODAL PINTAR (DETAIL INFO TAMBAHAN)
  const openDetailModal = (index: number) => {
    setActiveRowIndex(index)
    setIsModalOpen(true)
  }

  const handleModalInputChange = (field: keyof BatchUserData, value: string) => {
    if (activeRowIndex === null) return
    const updatedRows = [...rows]
    updatedRows[activeRowIndex] = { ...updatedRows[activeRowIndex], [field]: value }
    setRows(updatedRows)
  }

  // 3. EKSEKUSI KIRIM KE BACKEND ACTION
  const handleSubmitBatch = async (isUpsert: boolean) => {
    setIsLoading(true)
    setBatchErrors([]);
    try {
      const result = await executeBatchOperation(rows, isUpsert)
      
      if (result.successCount > 0) {
        toast.success(`Sukses memproses ${result.successCount} akun!`)
      }
      
      if (result.failureCount > 0) {
        toast.error(`${result.failureCount} akun gagal. Cek log konsol server!`)
        setBatchErrors(result.errors);
      } else {
        // Jika sukses semua, balikkan ke manajemen pengguna utama
        router.push("/admin/pengguna")
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan sistem: " + error.message);
    setBatchErrors([error.message || "Kesalahan sistem internal"]);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* HEADER TOMBOL KEMBALI */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Batch Operations</h1>
          <p className="text-sm text-slate-500 font-medium">Modul input data massal pengguna SIMMAG.</p>
        </div>
      </div>

      {batchErrors.length > 0 && (
  <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 shadow-sm space-y-2 transition-all">
    <div className="flex items-center gap-2">
      <div className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs">!</div>
      <h3 className="font-bold text-sm text-red-900">Beberapa data gagal diproses ({batchErrors.length} masalah ditemukan):</h3>
    </div>
    <ul className="list-disc list-inside text-xs text-red-700 pl-2 space-y-1 max-h-40 overflow-y-auto">
      {batchErrors.map((err, idx) => (
        <li key={idx} className="font-medium">{err}</li>
      ))}
    </ul>
    <p className="text-[10px] text-red-500 font-bold tracking-wide uppercase pt-1">
      * Silakan periksa kembali email atau kelengkapan password pada baris antrean di bawah.
    </p>
  </div>
)}

      <Card className="border-0 shadow-md shadow-slate-200/50 rounded-2xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-700">Daftar Antrean Akun ({rows.length})</CardTitle>
            <CardDescription className="text-xs">Gunakan Email sebagai kunci unik untuk pembaruan data via Upsert.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              onClick={() => handleSubmitBatch(false)} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Batch Insert
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSubmitBatch(true)} 
              disabled={isLoading}
              className="border-blue-600 text-blue-600 hover:bg-blue-50 font-bold rounded-xl"
            >
              Batch Upsert (by Email)
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-bold bg-slate-50/50">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Nama Lengkap *</th>
                  <th className="p-3">Email Akun *</th>
                  <th className="p-3">Password *</th>
                  <th className="p-3 w-40">Role Akses</th>
                  <th className="p-3 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {rows.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-bold text-slate-400 text-center">{index + 1}</td>
                    <td className="p-2">
                      <Input 
                        placeholder="Nama Lengkap..." 
                        value={row.nama_lengkap} 
                        onChange={(e) => handleInputChange(index, "nama_lengkap", e.target.value)}
                        className="h-10 border-slate-200 rounded-lg"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        type="email" 
                        placeholder="nama@sekolah.com" 
                        value={row.email} 
                        onChange={(e) => handleInputChange(index, "email", e.target.value)}
                        className="h-10 border-slate-200 rounded-lg"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        type="text" 
                        placeholder="Min 6 Karakter" 
                        value={row.password || ""} 
                        onChange={(e) => handleInputChange(index, "password", e.target.value)}
                        className="h-10 border-slate-200 rounded-lg"
                      />
                    </td>
                    <td className="p-2">
                      <Select value={row.role} onValueChange={(val) => handleInputChange(index, "role", val)}>
                        <SelectTrigger className="h-10 border-slate-200 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Siswa">Siswa</SelectItem>
                          <SelectItem value="Guru">Guru</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 text-center flex items-center justify-center gap-1 h-14">
                      {/* Tombol Pemicu Modal Info Tambahan */}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openDetailModal(index)}
                        className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        title="Isi Info Tambahan Profil"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      {/* Tombol Hapus Baris */}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveRow(index)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button 
            type="button" 
            variant="ghost" 
            onClick={handleAddRow} 
            className="w-full mt-4 h-11 border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Tambah Baris Baru
          </Button>
        </CardContent>
      </Card>

      {/* 4. MODAL PINTAR SHAREABLE INFO TAMBAHAN DENGAN CONDITIONAL FORM */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl bg-white p-6 font-sans">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">
                Info Tambahan ({activeRowIndex !== null ? rows[activeRowIndex]?.role : ""})
              </DialogTitle>
            </DialogHeader>
                    
            {activeRowIndex !== null && (
              <div className="space-y-4 py-3">
                
                {/* STATUS AKUN (Muncul dinamis sesuai Role) */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Status Akun</Label>
                  <Select 
                    value={rows[activeRowIndex].status || "Aktif"} 
                    onValueChange={(val) => handleModalInputChange("status", val)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {rows[activeRowIndex].role === "Guru" ? (
                        <>
                          <SelectItem value="Aktif">Aktif</SelectItem>
                          <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Aktif">Aktif</SelectItem>
                          <SelectItem value="Magang">Magang</SelectItem>
                          <SelectItem value="Selesai">Selesai</SelectItem>
                          <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                  
                {/* JIKA ROLE SISWA */}
                {rows[activeRowIndex].role === "Siswa" ? (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600">NIS</Label>
                      <Input placeholder="Masukkan NIS..." value={rows[activeRowIndex].nis || ""} onChange={(e) => handleModalInputChange("nis", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600">Kelas</Label>
                        <Select value={rows[activeRowIndex].kelas || ""} onValueChange={(val) => handleModalInputChange("kelas", val)}>
                          <SelectTrigger><SelectValue placeholder="Pilih Kelas..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="X">X</SelectItem>
                            <SelectItem value="XI">XI</SelectItem>
                            <SelectItem value="XII">XII</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600">Jurusan</Label>
                        <Select value={rows[activeRowIndex].jurusan || ""} onValueChange={(val) => handleModalInputChange("jurusan", val)}>
                          <SelectTrigger><SelectValue placeholder="Pilih Jurusan..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Rekayasa Perangkat Lunak</SelectItem>
                            <SelectItem value="2">Teknik Komputer Jaringan</SelectItem>
                            <SelectItem value="3">Desain Komunikasi Visual</SelectItem>
                            <SelectItem value="4">Animasi</SelectItem>
                            <SelectItem value="5">Kuliner</SelectItem>
                            <SelectItem value="6">Perhotelan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* JIKA ROLE GURU */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600">NIP</Label>
                      <Input placeholder="Masukkan NIP..." value={rows[activeRowIndex].nip || ""} onChange={(e) => handleModalInputChange("nip", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600">Jenis Kelamin</Label>
                      <Select value={rows[activeRowIndex].kelamin || ""} onValueChange={(val) => handleModalInputChange("kelamin", val)}>
                        <SelectTrigger><SelectValue placeholder="Pilih Kelamin..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Laki">Laki Laki</SelectItem>
                          <SelectItem value="Perempuan">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600">Mata Pelajaran</Label>
                      <Input placeholder="Masukkan Mata Pelajaran..." value={rows[activeRowIndex].mapel || ""} onChange={(e) => handleModalInputChange("mapel", e.target.value)} />
                    </div>
                  </>
                )}
        
                {/* DATA UTALITAS TELEPON & ALAMAT */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">No Telepon</Label>
                  <Input placeholder="08xxxxxxxx" value={rows[activeRowIndex].telepon || ""} onChange={(e) => handleModalInputChange("telepon", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Alamat</Label>
                  <Input placeholder="Masukkan Alamat..." value={rows[activeRowIndex].alamat || ""} onChange={(e) => handleModalInputChange("alamat", e.target.value)} />
                </div>
              </div>
            )}
        
            <DialogFooter>
              <Button type="button" onClick={() => setIsModalOpen(false)} className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl">
                Simpan & Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  )
}