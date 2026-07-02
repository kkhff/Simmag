"use server";

import { createClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/logger";

interface MagangData {
    id?: number;
    siswa_id: number;
    dudi_id: number;
    guru_id: number;
    tanggal_mulai: string;
    tanggal_selesai: string;
    status: string;
    catatan?: string;
    nilai_akhir?: number | null;
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createMagang(data: MagangData) {
    try {

        const { data: dataSiswa, error: errorSiswa } = await supabaseAdmin
            .from('siswa')
            .select('users(nama_lengkap)')
            .eq('id', data.siswa_id)
            .single();

        if (errorSiswa || !dataSiswa) {
            throw new Error('Siswa tidak ditemukan di database.');
        }
        if (data.status === "Aktif") {
            const { error: errorAktif } = await supabaseAdmin
                .from('siswa')
                .update({ status: "Magang" })
                .eq('id', data.siswa_id);

            if (errorAktif) throw new Error(`Gagal memperbarui status siswa: ${errorAktif.message}`);
        }



        const { error } = await supabaseAdmin.from('magang').insert({
            siswa_id: data.siswa_id,
            dudi_id: data.dudi_id,
            guru_id: data.guru_id,
            tanggal_mulai: data.tanggal_mulai,
            tanggal_selesai: data.tanggal_selesai,
            status: data.status || 'Pending',
            catatan: data.catatan,
            nilai_akhir: data.nilai_akhir || null
        });

        if (error) throw new Error(error.message);
        await logActivity(
            null,
            "Magang",
            "Created",
            `Admin telah membuat data magang siswa ${dataSiswa?.users?.[0]?.nama_lengkap}.`
        );
        return { success: true, message: "Penempatan magang berhasil dibuat!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateMagang(data: MagangData) {
    try {
        const { data: dataSiswa, error: errorSiswa } = await supabaseAdmin
            .from('siswa')
            .select('users(nama_lengkap)')
            .eq('id', data.siswa_id)
            .single();

        if (errorSiswa || !dataSiswa) {
            throw new Error('Siswa tidak ditemukan di database.');
        }

        const { error } = await supabaseAdmin.from('magang')
            .update({
                siswa_id: data.siswa_id,
                dudi_id: data.dudi_id,
                guru_id: data.guru_id,
                tanggal_mulai: data.tanggal_mulai,
                tanggal_selesai: data.tanggal_selesai,
                status: data.status,
                catatan: data.catatan,
                nilai_akhir: data.nilai_akhir || null
            })
            .eq('id', data.id);

        if (data.status === 'Aktif') {
            // Ubah semua pendaftaran lain milik siswa ini yang masih 'Pending' menjadi 'Batal'
            const { error: cancelError } = await supabaseAdmin
                .from('magang')
                .update({ status: 'Batal', catatan: 'Dibatalkan otomatis karena siswa telah diterima di tempat lain.' })
                .eq('siswa_id', data.siswa_id)
                .eq('status', 'Pending')
                .neq('id', data.id); // PENTING: Kecualikan ID yang baru saja di-ACC!


            if (cancelError) {
                console.error("Gagal membatalkan sisa pendaftaran:", cancelError.message);
                // Kita cuma log errornya aja, gak usah throw error biar proses ACC utama tetap sukses
            }
        }
        if (data.status === 'Selesai' && data?.siswa_id) {
            const { error: siswaError } = await supabaseAdmin
                .from('siswa')
                .update({ status: 'Selesai' })
                .eq('id', data.siswa_id);

            if (siswaError) {
                throw new Error(`Gagal memperbarui status siswa: ${siswaError.message}`);
            }
        }

        if (error) throw new Error(error.message);
        await logActivity(
            null,
            "Magang",
            "Updated",
            `Admin telah memperbarui data magang siswa ${dataSiswa?.users?.[0]?.nama_lengkap}.`
        );
        return { success: true, message: "Data penempatan magang berhasil diperbarui!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteMagang(id: number, namaSiswa: string) {
    try {
        const { error } = await supabaseAdmin.from('magang').delete().eq('id', id);
        if (error) throw new Error(error.message);
        await logActivity(
            null,
            "Magang",
            "Deleted",
            `Admin telah menghapus data magang siswa ${namaSiswa}.`
        );
        return { success: true, message: "Data penempatan magang berhasil dihapus!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getMagangPaginated(
    page: number = 1,
    limit: number = 10,
    search: string = "",
    status: string = "Semua Status",

) {
    try {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabaseAdmin
            .from('magang')
            .select('*, siswa(nis, kelas)', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Filter Berdasarkan Status
        if (status !== "Semua Status") {
            query = query.eq('status', status);
        }



        // Pencarian Teks Terdenormalisasi (Sudah fix typo nama_guru_cache)
        if (search.trim() !== "") {
            query = query.or(`nama_siswa_cache.ilike.%${search}%,nama_dudi_cache.ilike.%${search}%,nama_guru_cache.ilike.%${search}%`);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) throw error;

        return {
            success: true,
            data: data || [],
            totalCount: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
        };
    } catch (error: any) {
        return { success: false, message: error.message, data: [], totalCount: 0, totalPages: 0 };
    }
}

export async function getMagangStats() {
    try {
        const { count: totalMagang } = await supabaseAdmin
            .from('magang')
            .select('*', { count: 'exact', head: true });

        const { count: pending } = await supabaseAdmin
            .from('magang')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Pending');

        const { count: aktif } = await supabaseAdmin
            .from('magang')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Aktif');

        const { count: selesai } = await supabaseAdmin
            .from('magang')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Selesai');

        return {
            success: true,
            stats: {
                totalMagang: totalMagang || 0,
                pending: pending || 0,
                aktif: aktif || 0,
                selesai: selesai || 0
            }
        };
    } catch (error: any) {
        return { success: false, stats: { totalMagang: 0, pending: 0, aktif: 0, selesai: 0 } };
    }
}