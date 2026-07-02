"use client";

import { useEffect, useState } from "react";
import { createDudi, updateDudi } from "@/app/(dashboard)/admin/dudi/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { 
  Dialog, DialogHeader, DialogTitle, DialogContent
} from "@/components/ui/dialog";
import { 
  Select, SelectTrigger, SelectValue, SelectItem, SelectContent
} from "@/components/ui/select";

interface DudiFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode: boolean;
  dudiData: any; 
}

export default function DudiFormModal({ isOpen, onClose, onSuccess, editMode, dudiData }: DudiFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State form sesuai schema SQL
  const [namaPerusahaan, setNamaPerusahaan] = useState('');
  const [alamat, setAlamat] = useState('');
  const [telepon, setTelepon] = useState('');
  const [email, setEmail] = useState('');
  const [penanggungJawab, setPenanggungJawab] = useState('');
  const [status, setStatus] = useState('Aktif'); // Default 'Aktif' dari SQL

  const resetForm = () => {
    setNamaPerusahaan(''); setAlamat(''); setTelepon(''); 
    setEmail(''); setPenanggungJawab(''); setStatus('Aktif');
  };

  useEffect(() => {
    if (isOpen && editMode && dudiData) {
      setNamaPerusahaan(dudiData.nama_perusahaan || '');
      setAlamat(dudiData.alamat || '');
      setTelepon(dudiData.telepon || '');
      setEmail(dudiData.email || '');
      setPenanggungJawab(dudiData.penanggung_jawab || '');
      setStatus(dudiData.status || 'Aktif');
    } else if (isOpen && !editMode) {
      resetForm();
    }
  }, [isOpen, editMode, dudiData]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let response;
      const payload = {
        nama_perusahaan: namaPerusahaan,
        alamat: alamat,
        telepon: telepon,
        email: email,
        penanggung_jawab: penanggungJawab,
        status: status,
      };

      if (editMode) {
        response = await updateDudi({ ...payload, id: dudiData.id });
      } else {
        response = await createDudi(payload);
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
            {editMode ? "Edit Data Perusahaan" : "Tambah Perusahaan Baru"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Nama Perusahaan</label>
            <Input placeholder="PT Maju Mundur..." value={namaPerusahaan} onChange={(e) => setNamaPerusahaan(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Email Perusahaan / HRD</label>
            <Input type="email" placeholder="hrd@perusahaan.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Telepon / WhatsApp</label>
            <Input placeholder="08xxxxxxxx" value={telepon} onChange={(e) => setTelepon(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Penanggung Jawab (Pembimbing Lapangan)</label>
            <Input placeholder="Nama lengkap penanggung jawab..." value={penanggungJawab} onChange={(e) => setPenanggungJawab(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Alamat Lengkap</label>
            <Input placeholder="Jalan Raya No. 123..." value={alamat} onChange={(e) => setAlamat(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Status Mitra</label>
            <Select value={status} onValueChange={setStatus} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="font-bold">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-6">
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}