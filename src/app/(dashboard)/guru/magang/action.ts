"use server";

import { createClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/logger";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function tinjauMagang(id: number, siswaId: number, status: string, catatan: string, authUserId: string) {
    try {
        const { error } = await supabaseAdmin.from('magang').update({ status, catatan }).eq('id', id);
        if (error) throw new Error(error.message);

        if (status === 'Aktif') {
            await supabaseAdmin.from('magang')
                .update({ status: 'Batal', catatan: 'Dibatalkan otomatis karena telah diterima di tempat lain.' })
                .eq('siswa_id', siswaId)
                .eq('status', 'Pending')
                .neq('id', id);
            const {error:statusError} = await supabaseAdmin.from('siswa').update({status: 'Magang'}).eq('id', siswaId);
            if(statusError) console.error("Gagal memperbarui status siswa setelah menerima magang:", statusError.message);
        }


        await logActivity(authUserId, 'Magang', 'Updated', `Guru mengubah status magang menjadi: ${status}`);
        return { success: true, message: `Pengajuan berhasil di-${status.toLowerCase()}!` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function editMagangAktif(id: number, tglMulai: string, tglSelesai: string, status: string, authUserId: string) {
    try {
        const { data: magangData, error } = await supabaseAdmin
            .from('magang')
            .update({
                tanggal_mulai: tglMulai,
                tanggal_selesai: tglSelesai,
                status: status
            })
            .eq('id', id)
            .select('siswa_id')
            .single();

        if (error) throw new Error(error.message);

        // 2. Jika status berubah jadi 'Selesai', tembak update juga ke tabel siswa
        if (status === 'Selesai' && magangData?.siswa_id) {
            const { error: siswaError } = await supabaseAdmin
                .from('siswa')
                .update({ status: 'Selesai' })
                .eq('id', magangData.siswa_id);

            if (siswaError) {
                throw new Error(`Gagal memperbarui status siswa: ${siswaError.message}`);
            }
        }

        await logActivity(authUserId, 'Magang', 'Updated', `Guru memperbarui data magang aktif (Status: ${status})`);
        return { success: true, message: "Data magang berhasil diperbarui!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
export async function inputNilaiMagang(id: number, nilai: number, authUserId: string) {
    try {
        const { error } = await supabaseAdmin.from('magang').update({ nilai_akhir: nilai }).eq('id', id);
        if (error) throw new Error(error.message);

        await logActivity(authUserId, 'Magang', 'Updated', `Guru memasukkan nilai akhir magang: ${nilai}`);
        return { success: true, message: "Nilai akhir berhasil disimpan!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}