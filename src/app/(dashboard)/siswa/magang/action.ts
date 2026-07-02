"use server";

import { createClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/logger"; // 1. IMPORT HELPER LOGGER

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function daftarMagang(siswaId: number, dudiId: number, guruId: number) {
    try {
        // 1. Cek jumlah pendaftaran pending (Maksimal 3)
        const { count, error: countError } = await supabaseAdmin
            .from('magang')
            .select('*', { count: 'exact', head: true })
            .eq('siswa_id', siswaId)
            .eq('status', 'Pending');

        if (countError) throw new Error(countError.message);
        if (count !== null && count >= 3) {
            throw new Error("Batas maksimal 3 pendaftaran pending tercapai!");
        }

        const [resSiswa, resDudi] = await Promise.all([
            supabaseAdmin.from('siswa').select('users(nama_lengkap), user_id').eq('id', siswaId).single(),
            supabaseAdmin.from('dudi').select('nama_perusahaan').eq('id', dudiId).single()
        ]);

        const namaSiswa = resSiswa.data?.users?.[0]?.nama_lengkap || "Siswa";
        const namaDudi = resDudi.data?.nama_perusahaan || "Perusahaan";
        const authUserId = resSiswa.data?.user_id || null; // ID Akun Auth Siswa

        // 3. Masukkan data pendaftaran
        const today = new Date().toISOString().split('T')[0];
        const { error: insertError } = await supabaseAdmin.from('magang').insert({
            siswa_id: siswaId,
            dudi_id: dudiId,
            guru_id: guruId,
            tanggal_mulai: today,
            tanggal_selesai: today,
            status: 'Pending'
        });

        if (insertError) throw new Error(insertError.message);

        // 4. SUNTIKKAN LOGGER DI SINI SAAT BERHASIL INSERT
        await logActivity(
            authUserId,   
            'Magang',     
            'Created',    
            `Siswa bernama ${namaSiswa} mengajukan pendaftaran magang baru ke ${namaDudi}.`
        );

        return { success: true, message: "Pendaftaran magang berhasil dikirim!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}