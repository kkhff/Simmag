"use server";

import { createClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/logger";

interface DudiData {
    id?: number;
    nama_perusahaan: string;
    alamat: string;
    telepon: string;
    email: string;
    penanggung_jawab: string;
    status: string;
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createDudi(data: DudiData) {
    try {
        const { error } = await supabaseAdmin.from('dudi').insert({
            nama_perusahaan: data.nama_perusahaan,
            alamat: data.alamat,
            telepon: data.telepon,
            email: data.email,
            penanggung_jawab: data.penanggung_jawab,
            status: data.status,
        });
        
        if (error) throw new Error(error.message);
        await logActivity(null, "Dudi", "Created", `Admin telah membuat data ${data.nama_perusahaan}.`);
        return { success: true, message: "Data Perusahaan berhasil ditambahkan!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateDudi(data: DudiData) {
    try {
        const { error } = await supabaseAdmin.from('dudi')
            .update({
                nama_perusahaan: data.nama_perusahaan,
                alamat: data.alamat,
                telepon: data.telepon,
                email: data.email,
                penanggung_jawab: data.penanggung_jawab,
                status: data.status,
            })
            .eq('id', data.id);
            
        if (error) throw new Error(error.message);
        await logActivity(null, "Dudi", "Updated", `Admin telah memperbarui data ${data.nama_perusahaan}.`);
        return { success: true, message: "Data Perusahaan berhasil diperbarui!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteDudi(id: number, nama: string) {
    try {
        const { error: updateError } = await supabaseAdmin
            .from('magang')
            .update({ dudi_id: null })
            .eq('dudi_id', id);

        if (updateError) throw new Error(`Gagal mengosongkan relasi magang: ${updateError.message}`);

        const { error } = await supabaseAdmin.from('dudi').delete().eq('id', id);
        
        if (error) throw new Error(error.message);

        await logActivity(null, "Dudi", "Deleted", `Admin telah menghapus data ${nama}.`);
        return { success: true, message: "Data Perusahaan berhasil dihapus!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// FUNGSI BARU UNTUK SERVER-SIDE PAGINATION
export async function getDudiPaginated(
    page: number = 1, 
    limit: number = 5, 
    search: string = "", 
    status: string = "Semua Status"
) {
    try {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabaseAdmin
            .from('dudi')
            .select('*, magang(id, status)', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (status !== "Semua Status") {
            query = query.eq('status', status);
        }

        if (search.trim() !== "") {
            query = query.or(`nama_perusahaan.ilike.%${search}%,alamat.ilike.%${search}%,penanggung_jawab.ilike.%${search}%`);
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

export async function getDudiStats() {
    try {
        // 1. Hitung total DUDI berdasarkan status
        const { count: totalDudi } = await supabaseAdmin
            .from('dudi')
            .select('*', { count: 'exact', head: true });

        const { count: aktif } = await supabaseAdmin
            .from('dudi')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Aktif');

        const { count: nonaktif } = await supabaseAdmin
            .from('dudi')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Nonaktif');

        // 2. Hitung total siswa yang status magangnya aktif
        const { count: siswaMagang } = await supabaseAdmin
            .from('magang')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Aktif');

        return {
            success: true,
            stats: {
                totalDudi: totalDudi || 0,
                dudiAktif: aktif || 0,
                dudiNonaktif: nonaktif || 0,
                totalSiswaMagang: siswaMagang || 0
            }
        };
    } catch (error: any) {
        return { success: false, stats: { totalDudi: 0, dudiAktif: 0, dudiNonaktif: 0, totalSiswaMagang: 0 } };
    }
}
