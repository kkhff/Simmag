"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react"; // Pustaka render QR super ringan
import { QrCode, Download, Calendar, MapPin, ShieldCheck } from "lucide-react";

interface QrGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dudiData: {
    id: number;
    nama_perusahaan: string;
    latitude?: number | null;
    longitude?: number | null;
    qr_secret_token: string;
  } | null;
}

export default function QrGeneratorModal({ isOpen, onClose, dudiData }: QrGeneratorModalProps) {
  const [qrValue, setQrValue] = useState("");
  const todayStr = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

  useEffect(() => {
    if (isOpen && dudiData) {
      // FORMAT TOKEN DINAMIS ANTI-FAKE: ID_DUDI # SECRET_TOKEN # TANGGAL_HARI_INI
      const dynamicToken = `${dudiData.id}#${dudiData.qr_secret_token}#${todayStr}`;
      setQrValue(dynamicToken);
    }
  }, [isOpen, dudiData, todayStr]);

  if (!dudiData) return null;

  // Fungsi download QR Code sebagai format gambar PNG
  const downloadQR = () => {
    const svg = document.getElementById("qr-download-element");
    if (!svg) return;
    
    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, 400, 400);
        context.drawImage(image, 20, 20, 360, 360);
        
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `QR_Absen_${dudiData.nama_perusahaan.replace(/\s+/g, "_")}_${todayStr}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  const hasCoordinates = dudiData.latitude && dudiData.longitude;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md font-sans rounded-3xl bg-white p-6">
        
        {/* HEADER */}
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
            <QrCode className="text-blue-600" size={22} /> QR Code Presensi
          </DialogTitle>
          <p className="text-xs text-slate-400 mt-0.5">Membentuk kode absensi terenkripsi harian</p>
        </DialogHeader>

        {/* KONTEN UTAMA */}
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          
          {/* IDENTITAS DUDI */}
          <div className="text-center w-full bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <h4 className="font-black text-slate-800 text-base">{dudiData.nama_perusahaan}</h4>
            <div className="flex justify-center gap-4 mt-2 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1"><Calendar size={12} /> Hari Ini</span>
              <span className={`flex items-center gap-1 ${hasCoordinates ? "text-emerald-600" : "text-red-500"}`}>
                <MapPin size={12} /> {hasCoordinates ? "GPS Aktif" : "GPS Belum Set"}
              </span>
            </div>
          </div>

          {/* BOX KODE QR */}
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-inner flex items-center justify-center relative group">
            {qrValue ? (
              <QRCodeSVG
                id="qr-download-element"
                value={qrValue}
                size={220}
                level={"H"} // Tingkat keamanan toleransi kerusakan tinggi
                includeMargin={false}
              />
            ) : (
              <div className="w-[220px] h-[220px] bg-slate-100 animate-pulse rounded" />
            )}
          </div>

          {/* WARNING VALIDASI STATUS KEDALUWARSA */}
          <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-xl text-[11px] text-amber-800 leading-relaxed flex items-start gap-2 w-full">
            <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Sistem Proteksi Expired Aktif:</p>
              <p className="text-slate-600 mt-0.5">Kode ini hanya sah untuk hari ini (<span className="font-bold text-slate-800">{todayStr}</span>). Besok kode akan otomatis berubah secara realtime di sistem siswa.</p>
            </div>
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex gap-2 pt-4 border-t border-slate-100 mt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 font-bold rounded-xl h-11 text-xs">
            Tutup
          </Button>
          <Button 
            type="button" 
            onClick={downloadQR}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 text-xs shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
          >
            <Download size={14} /> Cetak / Download PNG
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}