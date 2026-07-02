"use client";

import { useEffect } from "react";
import { offlineDb } from "@/lib/db/offlineDb";
import { saveJurnal } from "@/app/(dashboard)/siswa/jurnal/action";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";

export default function OfflineSyncProvider({ children, authUserId }: { children: React.ReactNode; authUserId: string }) {
  
  useEffect(() => {
    if (typeof window === "undefined" || !authUserId) return;

    // 🚀 ENGINE UTAMA: Fungsi Penyapu Antrean Dexie ke Supabase
    const syncDraftsToServer = async () => {
      try {
        // 1. Tarik semua data draf yang mengendap di IndexedDB
        const drafts = await offlineDb.jurnalDrafts.toArray();
        if (drafts.length === 0) return;

        // Munculkan toast loading massal biar siswa tahu proses sinkronisasi sedang berjalan
        const syncToastId = toast.loading(`Mendeteksi ${drafts.length} draf offline. Mensinkronkan ke server...`, {
          icon: "🔄",
        });

        let successCount = 0;

        // 2. Iterasi tembak data satu per satu pake urutan antrean yang rapi
        for (const draft of drafts) {
          try {
            let compressedBase64 = null;
            let fileExt = "jpg"; // default fallback extension

            const rawPayload = draft as any;

            // 3. Ambil string foto Base64 mentah yang dititipkan kemarin, lalu kompres beneran!
            if (rawPayload.image_base64_temp) {
              // Ubah Base64 string kembali menjadi objek File/Blob mentah agar bisa dikompres library
              const resBlob = await fetch(rawPayload.image_base64_temp).then((res) => res.blob());
              const rawFile = new File([resBlob], rawPayload.file_name_temp || "bukti.jpg", { type: resBlob.type });

              const compressionOptions = {
                maxSizeMB: 0.8,
                maxWidthOrHeight: 1600,
                useWebWorker: true,
              };

              const compressedFile = await imageCompression(rawFile, compressionOptions);
              
              // Ubah hasil kompresi final ke Base64 untuk dikirim lewat Server Action
              compressedBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(compressedFile);
              });

              fileExt = rawPayload.file_name_temp?.split(".").pop() || "jpg";
            }

            // 4. Tembak ke Server Action Supabase kamu
            const res = await saveJurnal({
              magang_id: draft.magang_id,
              tanggal: draft.tanggal,
              kegiatan: draft.kegiatan,
              kendala: draft.kendala || "",
              bukti_url: "", // draf baru pasti kosong URL-nya
              authUserId: authUserId,
              imageBufferStr: compressedBase64,
              fileExtension: fileExt,
            });

            if (res.success) {
              // Jika server sukses menyimpan, hapus draf baris ini dari Dexie lokal agar tidak double!
              await offlineDb.jurnalDrafts.delete(draft.id!);
              successCount++;
            }
          } catch (itemError) {
            console.error("Gagal menyinkronkan 1 baris draf:", itemError);
          }
        }

        // 5. Update status toast final kesuksesan sinkronisasi
        toast.dismiss(syncToastId);
        if (successCount > 0) {
          toast.success(`Sukses! ${successCount} draf jurnal offline berhasil diunggah ke cloud cloud.`, {
            icon: "☁️",
            duration: 4000,
          });
          // Me-refresh window/router agar data tabel riwayat jurnal langsung update terisi otomatis
          window.location.reload();
        }
      } catch (globalError) {
        console.error("Gagal menjalankan background sync engine:", globalError);
      }
    };

    // 🟢 PEMANTU SINYAL: Jika internet tersambung kembali, jalankan engine!
    const handleOnlineStatus = () => {
      syncDraftsToServer();
    };
    console.log("OfflineSyncProvider mounted. Memantau status koneksi internet...");

    // Jalankan pengecekan langsung pas pertama kali masuk (jaga-jaga ada draf tertinggal dari sesi kemarin)
    if (navigator.onLine) {
      syncDraftsToServer();
    }

    window.addEventListener("online", handleOnlineStatus);
    return () => {
      window.removeEventListener("online", handleOnlineStatus);
    };
  }, [authUserId]);

  return <>{children}</>;
}