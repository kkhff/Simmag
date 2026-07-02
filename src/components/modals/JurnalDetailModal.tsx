"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, User, AlertCircle, Image as ImageIcon, CheckCircle, Clock, XCircle } from "lucide-react";
import Image from "next/image"; // 👈 Import komponen Image Next.js

interface JurnalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  jurnal: {
    tanggal: string;
    nama_siswa_cache?: string;
    kegiatan: string;
    kendala?: string | null;
    bukti_url?: string | null;
    status: "Pending" | "Disetujui" | "Ditolak" | string;
  } | null;
}

export default function JurnalDetailModal({ isOpen, onClose, jurnal }: JurnalDetailModalProps) {
  if (!jurnal) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Disetujui":
        return <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle size={14} /> Disetujui</span>;
      case "Ditolak":
        return <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-200"><XCircle size={14} /> Ditolak</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200"><Clock size={14} /> Pending</span>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl font-sans rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
        
        {/* HEADER */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <DialogTitle className="text-xl font-black text-slate-800">Detail Jurnal Harian</DialogTitle>
            <p className="text-xs text-slate-400 mt-1">Informasi lengkap pengisian logbook siswa</p>
          </div>
          <div className="shrink-0 pt-2">{getStatusBadge(jurnal.status)}</div>
        </DialogHeader>

        {/* METADATA */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 my-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white rounded-lg text-slate-500 shadow-sm border border-slate-100">
              <User size={16} />
            </div>
            <div className="truncate">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Siswa</p>
              <p className="text-sm font-bold text-slate-700 truncate">{jurnal.nama_siswa_cache || "Siswa Magang"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white rounded-lg text-slate-500 shadow-sm border border-slate-100">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal Kerja</p>
              <p className="text-sm font-bold text-slate-700">
                {new Date(jurnal.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* KONTEN UTAMA */}
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Kegiatan yang Dilakukan</h4>
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
              {jurnal.kegiatan}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Kendala Lapangan</h4>
            {jurnal.kendala ? (
              <div className="bg-red-50/30 p-4 rounded-xl border border-red-100 text-sm text-red-800 font-medium flex gap-2">
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <span>{jurnal.kendala}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic pl-1">Tidak ada kendala yang dilaporkan.</p>
            )}
          </div>

          {/* FOTO BUKTI DOKUMENTASI (MODERN RESPONSIVE UPDATE) */}
          <div className="space-y-1.5 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ImageIcon size={14} /> Lampiran Foto Bukti
            </h4>
            {jurnal.bukti_url ? (
              /* 📐 Memakai relative layout, w-full, dan aspect-video agar fleksibel di mobile */
              <div className="relative w-full aspect-video rounded-xl border border-slate-200 overflow-hidden bg-slate-900 group">
                <Image 
                  src={jurnal.bukti_url} 
                  alt={`Foto bukti kegiatan ${jurnal.nama_siswa_cache || 'siswa'}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <a 
                  href={jurnal.bukti_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all z-10"
                >
                  Buka Gambar Penuh ↗
                </a>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs font-medium bg-slate-50/30">
                Siswa tidak melampirkan foto bukti dokumentasi.
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="flex justify-end pt-4 border-t border-slate-100 mt-2">
          <Button type="button" onClick={onClose} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 rounded-full text-xs">
            Tutup Detail
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}