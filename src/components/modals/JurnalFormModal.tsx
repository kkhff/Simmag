"use client";

import { useEffect, useState, useRef } from "react";
import { saveJurnal } from "@/app/(dashboard)/siswa/jurnal/action";
import { offlineDb } from "@/lib/db/offlineDb"; // Database Dexie kita
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileImage, WifiOff, CloudLightning } from "lucide-react";
import toast from "react-hot-toast";

export default function JurnalFormModal({ isOpen, onClose, onSuccess, editMode, jurnalData, magangId, authUserId, siswaId }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tanggal, setTanggal] = useState("");
  const [kegiatan, setKegiatan] = useState("");
  const [kendala, setKendala] = useState("");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentBuktiUrl, setCurrentBuktiUrl] = useState(""); 
  const [isOnline, setIsOnline] = useState(true);

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

  // 1. Pantau Status Koneksi Pengguna secara Real-time
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const goOnline = () => setIsOnline(true);
      const goOffline = () => setIsOnline(false);

      window.addEventListener("online", goOnline);
      window.addEventListener("offline", goOffline);
      return () => {
        window.removeEventListener("online", goOnline);
        window.removeEventListener("offline", goOffline);
      };
    }
  }, []);

  useEffect(() => {
    if (isOpen && editMode && jurnalData) {
      setTanggal(jurnalData.tanggal);
      setKegiatan(jurnalData.kegiatan);
      setKendala(jurnalData.kendala || "");
      setCurrentBuktiUrl(jurnalData.bukti_url || "");
      setSelectedFile(null);
    } else if (isOpen) {
      setTanggal(today); setKegiatan(""); setKendala(""); setCurrentBuktiUrl(""); setSelectedFile(null);
    }
  }, [isOpen, editMode, jurnalData]);

  // Fungsi pembantu mengubah file mentah menjadi Base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (kegiatan.length < 50) return toast.error("Kegiatan terlalu singkat (min 50 karakter)");
    if (!selectedFile && !currentBuktiUrl) return toast.error("Harap pilih foto bukti kegiatan (PNG/JPG)");

    setIsSubmitting(true);

    try {
      // -----------------------------------------------------------------
      // 🚨 CABANG A: JIKA KONEKSI SEDANG OFFLINE (SIMPAN KE DEXIE INDEXEDDB)
      // -----------------------------------------------------------------
      if (!isOnline) {
        if (editMode) {
          throw new Error("Mode edit jurnal dinonaktifkan saat offline.");
        }

        let base64OfflineStr = "";
        if (selectedFile) {
          // Konversi langsung tanpa kompresi berat agar tidak memakan resource RAM perangkat saat mati sinyal
          base64OfflineStr = await fileToBase64(selectedFile);
        }

        // Masukkan data draf ke Dexie
        await offlineDb.jurnalDrafts.add({
          magang_id: Number(magangId),
          siswa_id: Number(siswaId),
          tanggal,
          kegiatan,
          kendala: kendala || undefined,
          created_at: new Date().toISOString(),
          // Titip sementara string gambarnya di sini
          image_base64_temp: base64OfflineStr,
          file_name_temp: selectedFile?.name
        } as any);

        toast.success("Koneksi terputus! Jurnal disimpan sebagai draf lokal (Offline).", {
          icon: "💾",
          duration: 5000
        });
        
        onSuccess(); // Memicu refresh list draf di halaman utama jika dipasang
        onClose();
        return;
      }

      // -----------------------------------------------------------------
      // 🌐 CABANG B: JIKA KONEKSI ONLINE (ALUR NORMAL SUPABASE)
      // -----------------------------------------------------------------
      let base64ImageStr = null;
      let fileExt = null;

      if (selectedFile) {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(selectedFile, options);
        base64ImageStr = await fileToBase64(compressedFile);
        fileExt = selectedFile.name.split('.').pop();
      }

      const res = await saveJurnal({ 
        id: jurnalData?.id, 
        magang_id: magangId, 
        tanggal, 
        kegiatan, 
        kendala, 
        bukti_url: currentBuktiUrl,
        authUserId,
        imageBufferStr: base64ImageStr,
        fileExtension: fileExt
      });
      
      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal memproses jurnal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isSubmitting ? undefined : onClose}>
      <DialogContent className="sm:max-w-2xl font-sans rounded-2xl bg-white">
        
        {/* BANNER INDIKATOR OFFLINE JIKA INTERNET MATI */}
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2.5 text-amber-800 text-xs font-bold mb-1 animate-pulse">
            <WifiOff size={16} className="text-amber-600 shrink-0" />
            <span>Mode Offline Aktif. Jurnal Anda akan disimpan di penyimpanan lokal browser dan otomatis disinkronkan saat sinyal kembali pulih.</span>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            {editMode ? 'Edit' : 'Tambah'} Jurnal Harian
            {!isOnline && <span className="text-[10px] bg-amber-100 text-amber-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Offline Mode</span>}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Tanggal Kegiatan</label>
            <Input type="date" value={tanggal} max={today} onChange={(e) => setTanggal(e.target.value)} required disabled={editMode && !isOnline} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Kegiatan Hari Ini</label>
            <Textarea placeholder="Apa yang Anda kerjakan hari ini?" value={kegiatan} onChange={(e) => setKegiatan(e.target.value)} rows={5} required />
            <p className="text-[10px] text-right text-slate-400">{kegiatan.length}/50 minimum</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Kendala (Opsional)</label>
            <Input placeholder="Tuliskan kendala jika ada..." value={kendala} onChange={(e) => setKendala(e.target.value)} />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Foto Bukti Kegiatan</label>
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="border-dashed border-slate-300 hover:bg-slate-50 rounded-xl h-12 px-4 flex gap-2 text-xs text-slate-600 font-bold shadow-sm shrink-0"
              >
                <Upload size={16} className="text-slate-400" /> Choose File
              </Button>
              
              <div className="text-xs text-slate-500 truncate max-w-[350px]">
                {selectedFile ? (
                  <span className="text-blue-600 font-medium flex items-center gap-1">
                    <FileImage size={14} /> {selectedFile.name}
                  </span>
                ) : currentBuktiUrl ? (
                  <span className="text-emerald-600 font-medium italic">Sudah ada foto bukti (Klik choose file untuk ganti)</span>
                ) : (
                  "Belum ada file dipilih (Format: PNG, JPG)"
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className={`font-bold px-8 rounded-full text-white ${!isOnline ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10'}`}
            >
              {isSubmitting 
                ? 'Proses Upload & Simpan...' 
                : !isOnline 
                  ? 'Simpan sebagai Draf Lokal' 
                  : 'Simpan Jurnal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}