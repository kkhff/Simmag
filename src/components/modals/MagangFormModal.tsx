"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createMagang, updateMagang } from "@/app/(dashboard)/admin/magang/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface MagangFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode: boolean;
  magangData: any;
}

export default function MagangFormModal({ isOpen, onClose, onSuccess, editMode, magangData }: MagangFormModalProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State opsi pilihan dari table lain
  const [optSiswa, setOptSiswa] = useState<any[]>([]);
  const [optGuru, setOptGuru] = useState<any[]>([]);
  const [optDudi, setOptDudi] = useState<any[]>([]);

  // State Form penempatan magang
  const [siswaId, setSiswaId] = useState('');
  const [dudiId, setDudiId] = useState('');
  const [guruId, setGuruId] = useState('');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');
  const [status, setStatus] = useState('Pending');
  const [catatan, setCatatan] = useState('');

  // Ambil opsi data relasi ketika modal terbuka
  useEffect(() => {
    async function loadOptions() {
      // 1. Ambil data siswa aktif beserta status magang mereka (Left Join)
      const { data: rawSiswa } = await supabase
        .from('siswa')
        .select('id, users(nama_lengkap), magang(status)')
        .eq('status', 'Aktif');

      const { data: guru } = await supabase.from('guru').select('id, users(nama_lengkap)').eq('status', 'Aktif');
      const { data: dudi } = await supabase.from('dudi').select('id, nama_perusahaan').eq('status', 'Aktif');

      // 2. Saring data siswa di sisi client sebelum dimasukkan ke State
      if (rawSiswa) {
        const filteredSiswa = rawSiswa.filter(s => {
          if (!s.magang || s.magang.length === 0) return true;

          const isRestricted = s.magang.some(m => 
            m.status === 'Aktif' || m.status === 'Selesai' || m.status === 'Ditolak'
          );

          return !isRestricted;
        });

        setOptSiswa(filteredSiswa);
      }

      if (guru) setOptGuru(guru);
      if (dudi) setOptDudi(dudi);
    }

    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  // Set data jika dalam mode Edit
  useEffect(() => {
    if (isOpen && editMode && magangData) {
      setSiswaId(String(magangData.siswa_id));
      setDudiId(String(magangData.dudi_id));
      setGuruId(String(magangData.guru_id));
      setTglMulai(magangData.tanggal_mulai || '');
      setTglSelesai(magangData.tanggal_selesai || '');
      setStatus(magangData.status || 'Pending');
      setCatatan(magangData.catatan || '');
    } else if (isOpen && !editMode) {
      setSiswaId(''); setDudiId(''); setGuruId('');
      setTglMulai(''); setTglSelesai(''); setStatus('Pending'); setCatatan('');
    }
  }, [isOpen, editMode, magangData]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let response;
      const payload = {
        siswa_id: Number(siswaId),
        dudi_id: Number(dudiId),
        guru_id: Number(guruId),
        tanggal_mulai: tglMulai,
        tanggal_selesai: tglSelesai,
        status: status,
        catatan: catatan,
      };

      if (editMode) {
        response = await updateMagang({ ...payload, id: magangData.id });
      } else {
        response = await createMagang(payload);
      }

      if (!response.success) throw new Error(response.message);

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
            {editMode ? "Edit Penempatan Magang" : "Tambah Penempatan Magang"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          {/* PILIH SISWA */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Siswa Magang</label>
            <Select value={siswaId} onValueChange={setSiswaId} required disabled={editMode}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Siswa..." />
              </SelectTrigger>
              <SelectContent>
                {optSiswa.map(s => (
                  // 🔥 FIX 1: Tambah Optional Chaining (?.) biar gak crash semisal data users null
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.users?.nama_lengkap || "Siswa Tanpa Nama"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PILIH DUDI */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Perusahaan Mitra (DUDI)</label>
            <Select value={dudiId} onValueChange={setDudiId} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Perusahaan..." />
              </SelectTrigger>
              <SelectContent>
                {optDudi.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nama_perusahaan}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* PILIH GURU PEMBIMBING */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Guru Pembimbing</label>
            <Select value={guruId} onValueChange={setGuruId} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Guru Pembimbing..." />
              </SelectTrigger>
              <SelectContent>
                {optGuru.map(g => (
                  // 🔥 FIX 2: Tambah Optional Chaining (?.) di data Guru juga
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.users?.nama_lengkap || "Guru Tanpa Nama"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TANGGAL PERIODE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Tanggal Mulai</label>
              <Input type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Tanggal Selesai</label>
              <Input type="date" value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)} required />
            </div>
          </div>

          {/* STATUS PENEMPATAN */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Status Magang</label>
            <Select value={status} onValueChange={setStatus} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Menunggu Konfirmasi</SelectItem>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Selesai">Selesai</SelectItem>
                <SelectItem value="Ditolak">Ditolak</SelectItem>
                <SelectItem value="Batal">Batal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CATATAN TAMBAHAN */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Catatan / Keterangan (Opsional)</label>
            <Textarea placeholder="Tambahkan catatan lokasi, divisi, dsb..." value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="font-bold">Batal</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
              {isSubmitting ? "Menyimpan..." : "Simpan Penempatan"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}