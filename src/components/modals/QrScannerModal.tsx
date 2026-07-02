  "use client";

  import { useEffect, useState, useRef } from "react";
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Html5Qrcode } from "html5-qrcode"; // Menggunakan driver inti, bukan UI bawaan
  import { Camera, MapPin, Loader2, AlertTriangle, X } from "lucide-react";
  import { submitPresensiQR } from "@/app/(dashboard)/siswa/jurnal/presensiAction";
  import toast from "react-hot-toast";

  interface QrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccessAbsen: () => void;
    authUserId: string;
    magangId: number;
  }

  export default function QrScannerModal({ isOpen, onClose, onSuccessAbsen, authUserId, magangId }: QrScannerModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [gpsStatus, setGpsStatus] = useState<"loading" | "success" | "error">("loading");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    
    const qrInstanceRef = useRef<Html5Qrcode | null>(null);
    const scannerId = "pure-html5-qrcode-reader";

    // 1. KUNCI GPS KOORDINAT DULU
    useEffect(() => {
      if (isOpen) {
        setGpsStatus("loading");
        if (!navigator.geolocation) {
          toast.error("Browser tidak mendukung geolokasi!");
          setGpsStatus("error");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
            setGpsStatus("success");
          },
          (error) => {
            console.error(error);
            toast.error("Izin GPS diblokir browser!");
            setGpsStatus("error");
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }, [isOpen]);

    // 2. KONTROL NYALA/MATI KAMERA SECARA BERSIH
    useEffect(() => {
      let isMounted = true;

      const startCamera = async () => {
        // Tunggu DOM element scanner siap
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        const element = document.getElementById(scannerId);
        if (!element || !isMounted) return;

        try {
          const html5QrCode = new Html5Qrcode(scannerId);
          qrInstanceRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" }, // Pakai kamera belakang HP secara default
            {
              fps: 10,
              qrbox: (width, height) => {
                const size = Math.min(width, height) * 0.65;
                return { width: size, height: size };
              },
            },
            async (decodedText) => {
              // == PADA SAAT QR CODE BERHASIL TERIMBAS ==
              await stopCamera(); // Langsung matikan hardware kamera seketika!
              if (!isMounted) return;
              
              setIsLoading(true);
              try {
                const res = await submitPresensiQR({
                  qrRawValue: decodedText,
                  latitudeSiswa: coords!.lat,
                  longitudeSiswa: coords!.lng,
                  authUserId,
                  magangId,
                });

                if (res.success) {
                  toast.success(res.message);
                  onSuccessAbsen();
                } else {
                  toast.error(res.message);
                }
              } catch (err: any) {
                toast.error(err.message || "Terjadi kesalahan server");
              } finally {
                setIsLoading(false);
                onClose();
              }
            },
            () => {
              // Verbose error scanning dilewati agar tidak banjir log
            }
          );
        } catch (err) {
          console.error("Gagal menyalakan kamera:", err);
        }
      };

      const stopCamera = async () => {
        if (qrInstanceRef.current && qrInstanceRef.current.isScanning) {
          try {
            await qrInstanceRef.current.stop();
          } catch (e) {
            console.error("Gagal mematikan kamera secara aman:", e);
          } finally {
            qrInstanceRef.current = null;
          }
        }
      };

      if (isOpen && gpsStatus === "success" && coords) {
        startCamera();
      }

      // CLEANUP LIFECYCLE: Dipicu saat modal diclose/unmount, menjamin kamera mati total!
      return () => {
        isMounted = false;
        stopCamera();
      };
    }, [isOpen, gpsStatus, coords]);

    // Handler bungkus close biar tidak memotong proses loading server
    const handleCloseSafe = async () => {
      if (isLoading) return;
      onClose();
    };

    return (
      <Dialog open={isOpen} onOpenChange={handleCloseSafe}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
          
          {/* Tombol X Pojok Kanan Atas Custom */}
          <button 
            onClick={handleCloseSafe} 
            disabled={isLoading}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:cursor-not-allowed text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>

          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Camera className="text-blue-600" size={20} /> Pemindai Kehadiran DUDI
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            
            {/* 1. STATE LOCKING GPS */}
            {gpsStatus === "loading" && (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50/70 p-3 rounded-xl w-full justify-center border border-amber-100 animate-pulse">
                <Loader2 className="animate-spin" size={14} /> Mengunci Titik GPS Satelit...
              </div>
            )}

            {gpsStatus === "error" && (
              <div className="flex items-start gap-2.5 text-xs font-bold text-red-700 bg-red-50 p-3 rounded-xl w-full border border-red-100">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>Akses Lokasi Ditolak. Harap aktifkan GPS perangkat Anda dan izinkan akses lokasi pada browser untuk melanjutkan.</span>
              </div>
            )}

            {gpsStatus === "success" && coords && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl w-full justify-center shadow-sm">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <MapPin size={13} /> GPS Aktif: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </div>
            )}

            {/* 2. JENDELA VISUAL KAMERA CUSTOMIZED (CLEAN & MINIMALIS) */}
            {gpsStatus === "success" && !isLoading && (
              <div className="w-full aspect-square max-w-[320px] overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-950 relative shadow-inner flex items-center justify-center">
                
                {/* Tempat Element Video HTML5-QRCODE Menempel */}
                <div id={scannerId} className="w-full h-full object-cover [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>
                
                {/* Overlay Bingkai Pemindai (Scanner Target Frame) Estetik */}
                <div className="absolute inset-0 pointer-events-none border-[30px] border-black/40 flex items-center justify-center">
                  <div className="w-full h-full relative border-2 border-dashed border-blue-400/80 rounded-md">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-1.5 -ml-1.5 rounded-xs" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-1.5 -mr-1.5 rounded-xs" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-1.5 -ml-1.5 rounded-xs" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-1.5 -mr-1.5 rounded-xs" />
                  </div>
                </div>
              </div>
            )}

            {/* 3. LOADING ENGINE SAAT PENGIRIMAN DATA */}
            {isLoading && (
              <div className="py-14 flex flex-col items-center space-y-3 w-full">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <p className="text-xs font-black text-slate-700">Memvalidasi Koordinat & Token QR...</p>
                <p className="text-[11px] text-slate-400 text-center max-w-[240px]">Harap tunggu, server sedang memverifikasi keaslian lokasi presensi Anda.</p>
              </div>
            )}
          </div>

          {!isLoading && (
            <div className="flex justify-end border-t border-slate-100 pt-3 mt-2">
              <Button type="button" variant="ghost" onClick={handleCloseSafe} className="font-bold rounded-xl h-10 text-xs px-5">
                Batal
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }