"use server";

import { createClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/logger";
import sharp from "sharp";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function saveJurnal(data: { 
    id?: number, 
    magang_id: number, 
    tanggal: string, 
    kegiatan: string, 
    kendala?: string, 
    bukti_url?: string, 
    authUserId: string,
    imageBufferStr?: string | null,
    fileExtension?: string | null
}) {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        if (data.tanggal > today) {
            throw new Error("Anda tidak dapat mengisi jurnal untuk tanggal di masa mendatang!");
        }

        let finalBuktiUrl = data.bukti_url || null;

        // HAKIKAT SIHIR SHARP DI SINI:
        if (data.imageBufferStr) {
            
            // FITUR TAMBAHAN: Hapus foto lama di storage jika ini adalah mode edit dan foto diganti baru
            if (data.id && data.bukti_url) {
                const urlParts = data.bukti_url.split('/jurnal_bukti/');
                if (urlParts.length > 1) {
                    const oldFilePath = urlParts[1];
                    await supabaseAdmin.storage.from('jurnal_bukti').remove([oldFilePath]);
                }
            }

            // 1. Bersihkan header base64 (data:image/jpeg;base64,...)
            const base64Image = data.imageBufferStr.replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Buffer.from(base64Image, 'base64');

            // 2. Proses Konversi & Resize Menggunakan Sharp ke format WEBP
            const webpBuffer = await sharp(imageBuffer)
                .resize({ width: 1024, withoutEnlargement: true }) // Lebar maks 1024px, kalau aslinya lebih kecil jangan dipaksa gede
                .webp({ quality: 80 }) // Ubah format ke WebP dengan kualitas 80% (sangat optimal)
                .toBuffer();

            // 3. Siapkan Nama File Unik (.webp)
            const fileName = `${data.authUserId}/${Date.now()}.webp`;

            // 4. Upload Hasil WebP ke Supabase Storage via Server Admin
            const { error: uploadError } = await supabaseAdmin.storage
                .from('jurnal_bukti')
                .upload(fileName, webpBuffer, {
                    contentType: 'image/webp',
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw new Error("Server gagal memproses WebP: " + uploadError.message);

            // 5. Ambil URL Publiknya
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('jurnal_bukti')
                .getPublicUrl(fileName);

            finalBuktiUrl = publicUrl;
        }

        const payload = {
            magang_id: data.magang_id,
            tanggal: data.tanggal,
            kegiatan: data.kegiatan,
            kendala: data.kendala || null,
            bukti_url: finalBuktiUrl,
            status: 'Pending' 
        };

        // 1. Jalankan operasi DB standar tanpa memaksa .single() di awal
        if (data.id) {
            const { error } = await supabaseAdmin.from('jurnal').update(payload).eq('id', data.id);
            if (error) throw new Error(error.message);
        } else {
            const { error } = await supabaseAdmin.from('jurnal').insert(payload);
            if (error) throw new Error(error.message);
        }

        // 2. Ambil nama_siswa_cache secara aman dari tabel magang/jurnal untuk keperluan log
        const { data: jurnalTerbaru } = await supabaseAdmin
            .from('jurnal')
            .select('nama_siswa_cache')
            .eq('magang_id', data.magang_id)
            .limit(1)
            .maybeSingle();

        const namaSiswa = jurnalTerbaru?.nama_siswa_cache || "Siswa";

        // 3. Catat ke Aktivitas Log
        await logActivity(
            data.authUserId,
            'Logbook',
            data.id ? 'Updated' : 'Created',
            `${namaSiswa} ${data.id ? 'memperbarui' : 'mengisi'} jurnal harian untuk tanggal ${data.tanggal}.`
        );

        return { success: true, message: "Jurnal berhasil disimpan!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteJurnal(id: number, authUserId: string) {
    try {
        // 1. Tarik data menggunakan kolom cache denormalisasi yang super enteng
        const { data: jurnalData } = await supabaseAdmin
            .from('jurnal')
            .select('bukti_url, nama_siswa_cache')
            .eq('id', id)
            .single();

        const namaSiswa = jurnalData?.nama_siswa_cache || "Siswa";

        // 2. Jika ada file di storage bucket, bersihkan biar hemat ruang
        if (jurnalData?.bukti_url) {
            const urlParts = jurnalData.bukti_url.split('/jurnal_bukti/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                await supabaseAdmin.storage.from('jurnal_bukti').remove([filePath]);
            }
        }

        // 3. Hapus data jurnal
        const { error } = await supabaseAdmin.from('jurnal').delete().eq('id', id);
        if (error) throw new Error(error.message);

        await logActivity(
            authUserId, 
            'Logbook', 
            'Deleted', 
            `${namaSiswa} menghapus satu entri jurnal harian beserta bukti fotonya.`
        );
        
        return { success: true, message: "Jurnal dan file bukti berhasil dihapus!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}