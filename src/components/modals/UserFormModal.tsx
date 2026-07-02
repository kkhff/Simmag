"use client";

import { useEffect, useState } from "react";
import { createClientUser, updateClientUser } from "@/app/(dashboard)/admin/pengguna/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { 
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent
} from "@/components/ui/dialog";
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent
} from "@/components/ui/select";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode: boolean;
  userData: any; 
}

export default function UserFormModal({ isOpen, onClose, onSuccess, editMode, userData }: UserFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State Form
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [nip, setNip] = useState('');
  const [mapel, setMapel] = useState('');
  const [nis, setNis] = useState('');
  const [kelas, setKelas] = useState('');
  const [jurusan, setJurusan] = useState(''); // 🔥 State ini akan menyimpan string ID Jurusan ("1", "2", dst)
  const [kelamin, setKelamin] = useState('');
  const [telepon, setTelepon] = useState('');
  const [alamat, setAlamat] = useState('');

  const resetForm = () => {
    setNamaLengkap(''); setEmail(''); setPassword(''); setConfirmPassword(''); setRole('');
    setNip(''); setMapel(''); setNis(''); setKelas(''); setJurusan('');
    setKelamin(''); setTelepon(''); setAlamat('');
  };

  useEffect(() => {
    if (isOpen && editMode && userData) {
      const userRelation = userData.users;

      setNamaLengkap(userRelation?.nama_lengkap || userData.nama_lengkap || '');
      setEmail(userRelation?.email || userData.email || '');
      setRole(userData.role || '');
      setStatus(userData.status || 'Aktif'); 
      setTelepon(userData.telepon || '');
      setAlamat(userData.alamat || '');
      setNip(userData.nip || '');
      setMapel(userData.mata_pelajaran || '');
      setNis(userData.nis || '');
      setKelamin(userData.jenis_kelamin || '');
      setKelas(userData.kelas || '');
      
      // 🔥 FIX 1: Ambil data ID jurusan dari database (pastikan query di page.tsx menarik foreign key jurusan_id)
      setJurusan(userData.jurusan_id ? String(userData.jurusan_id) : '');
      
      setPassword(''); 
      setConfirmPassword('');
    } else if (isOpen && !editMode) {
      resetForm();
    }
  }, [isOpen, editMode, userData]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!editMode || password.length > 0) {
        if (password.length < 6) {
          toast.error("Password harus minimal 6 karakter!");
          setIsSubmitting(false);
          return;
        }
      }

      if (password !== confirmPassword) {
        toast.error("Password dan Konfirmasi Password tidak cocok!");
        setIsSubmitting(false); 
        return; 
      }

      let response;

      if (editMode) {
        response = await updateClientUser({
          userId: userData.user_id,
          nama_lengkap: namaLengkap,
          password: password,
          role: role,
          status: status, 
          nip: nip,
          kelamin: kelamin,
          mapel: mapel,
          nis: nis,
          kelas: kelas,
          jurusan: jurusan, // Mengirim ID Jurusan
          telepon: telepon,
          alamat: alamat,
        });
      } else {
        response = await createClientUser({
          nama_lengkap: namaLengkap,
          email: email,
          password: password,
          role: role,
          status: status, 
          nip: nip,
          mapel: mapel,
          kelamin: kelamin,
          nis: nis,
          kelas: kelas,
          jurusan: jurusan, // Mengirim ID Jurusan
          telepon: telepon,
          alamat: alamat,
        });
      }

      if (!response.success) {
        throw new Error(response.message);
      }
      
      toast.success(response.message);
      onClose(); 
      onSuccess(); 
      
    } catch (error: any) {
      toast.error("Gagal menyimpan data: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg rounded-2xl font-sans overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-800">
            {editMode ? "Edit Akun Pengguna" : "Tambah Akun Baru"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
            <Input placeholder="Masukkan nama lengkap..." value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Email</label>
            <Input type="email" placeholder="contoh@sekolah.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={editMode} required />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Password</label>
            <Input type="password" placeholder={editMode ? "Kosongkan jika tidak ingin mengubah password" : "Minimal 6 karakter..."} value={password} onChange={(e) => setPassword(e.target.value)} required={!editMode} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Konfirmasi Password</label>
            <Input type="password" placeholder={editMode ? "Kosongkan jika tidak ingin mengubah password" : "Minimal 6 karakter..."} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required={!editMode} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Role Akses</label>
            <Select value={role} onValueChange={(value) => { setRole(value); setStatus(''); }} disabled={editMode}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Guru">Guru</SelectItem>
                <SelectItem value="Siswa">Siswa</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {role && role !== "Admin" && (
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Status Akun</label>
              <Select value={status} onValueChange={setStatus} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status..." />
                </SelectTrigger>
                <SelectContent>
                  {role === "Guru" ? (
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
          )}

          {role === "Guru" && (
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <p className="text-xs font-bold text-blue-600 tracking-wide uppercase">Informasi Tambahan Guru</p>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">NIP</label>
                <Input placeholder="Masukkan NIP..." value={nip} onChange={(e) => setNip(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Kelamin</label>
                <Select value={kelamin} onValueChange={(value) => setKelamin(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Jenis Kelamin..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki">Laki Laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Mata Pelajaran</label>
                <Input placeholder="Masukkan Mata Pelajaran..." value={mapel} onChange={(e) => setMapel(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">No Telepon</label>
                <Input placeholder="08xxxxxxxx" value={telepon} onChange={(e) => setTelepon(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Alamat</label>
                <Input placeholder="Masukkan Alamat..." value={alamat} onChange={(e) => setAlamat(e.target.value)} required />
              </div>
            </div>
          )}

          {role === "Siswa" && (
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
              <p className="text-xs font-bold text-emerald-600 tracking-wide uppercase">Informasi Tambahan Siswa</p>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">NIS</label>
                <Input placeholder="Masukkan NIS..." value={nis} onChange={(e) => setNis(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Kelas</label>
                  <Select value={kelas} onValueChange={(value) => setKelas(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Kelas..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="X">X</SelectItem>
                      <SelectItem value="XI">XI</SelectItem>
                      <SelectItem value="XII">XII</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Jurusan</label>
                  {/* 🔥 FIX 2: value langsung diarahkan ke state 'jurusan' (yang menampung ID) */}
                  <Select value={jurusan} onValueChange={(value) => setJurusan(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Jurusan..." />
                    </SelectTrigger>
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
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">No Telepon</label>
                <Input placeholder="08xxxxxxxx" value={telepon} onChange={(e) => setTelepon(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Alamat</label>
                <Input placeholder="Masukkan Alamat..." value={alamat} onChange={(e) => setAlamat(e.target.value)} required />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="font-bold">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 font-bold px-6">
              {isSubmitting ? "Menyimpan..." : "Simpan Akun"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}