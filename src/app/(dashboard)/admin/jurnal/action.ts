"use server";

import { createClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/logger";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function forceUpdateJurnal(
    jurnalId: number,
    status: 'Disetujui' | 'Ditolak' | 'Pending',
    catatan: string,
    authUserId: string
) {
    try {
        const { error } = await supabaseAdmin
            .from('jurnal')
            .update({ status, catatan })
            .eq('id', jurnalId);

        if (error) throw new Error(error.message);

        await logActivity(
            authUserId,
            'Logbook',
            'Updated',
            `Admin melakukan intervensi (Force Update) status jurnal (ID: ${jurnalId}) menjadi: ${status}.`
        );

        return { success: true, message: `Status jurnal berhasil diubah menjadi ${status}!` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteJurnal(id: number, authUserId: string) {
    try {
        const { error } = await supabaseAdmin.from('jurnal').delete().eq('id', id);
        if (error) throw new Error(error.message);

        await logActivity(
            authUserId,
            'Logbook',
            'Deleted',
            `Admin menghapus jurnal (ID: ${id}).`
        );

        return { success: true, message: "Jurnal berhasil dihapus!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getJurnalPaginated(
    page: number = 1,
    limit: number = 10,
    search: string = "",
    status: string = "Semua Status",
    month: string = "Semua Bulan",
    year: string = "Semua Tahun"
) {
    try {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabaseAdmin
            .from('jurnal')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Filter Berdasarkan Status
        if (status !== "Semua Status") {
            query = query.eq('status', status);
        }

        // Filter Tanggal: Gunakan range .gte() dan .lte() karena Supabase JS
        // tidak mendukung filter 'raw'. Bangun rentang tanggal dari bulan dan tahun.
        const targetYear = year !== "Semua Tahun" ? parseInt(year) : null;
        const targetMonth = month !== "Semua Bulan" ? parseInt(month) : null;

        if (targetYear !== null && targetMonth !== null) {
            // Filter spesifik: bulan dan tahun keduanya dipilih
            const startDate = new Date(targetYear, targetMonth - 1, 1);
            const endDate = new Date(targetYear, targetMonth, 0); // hari terakhir bulan
            query = query
                .gte('tanggal', startDate.toISOString().split('T')[0])
                .lte('tanggal', endDate.toISOString().split('T')[0]);
        } else if (targetYear !== null) {
            // Filter hanya tahun
            query = query
                .gte('tanggal', `${targetYear}-01-01`)
                .lte('tanggal', `${targetYear}-12-31`);
        } else if (targetMonth !== null) {
            // Filter hanya bulan — default ke tahun berjalan karena Supabase JS
            // tidak bisa melakukan EXTRACT(MONTH) dalam query paginated
            const currentYear = new Date().getFullYear();
            const startDate = new Date(currentYear, targetMonth - 1, 1);
            const endDate = new Date(currentYear, targetMonth, 0);
            query = query
                .gte('tanggal', startDate.toISOString().split('T')[0])
                .lte('tanggal', endDate.toISOString().split('T')[0]);
        }



        // Pencarian Teks Terdenormalisasi (Sudah fix typo nama_guru_cache)
        if (search.trim() !== "") {
            query = query.or(`nama_siswa_cache.ilike.%${search}%,nama_dudi_cache.ilike.%${search}%,kegiatan.ilike.%${search}%`);
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

export async function getJurnalStats() {
    try {
        const { count: totalJurnal } = await supabaseAdmin
            .from('jurnal')
            .select('*', { count: 'exact', head: true });

        const { count: Disetujui } = await supabaseAdmin
            .from('jurnal')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Disetujui');

        const { count: pending } = await supabaseAdmin
            .from('jurnal')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Pending');

        const { count: kendala } = await supabaseAdmin
            .from('jurnal')
            .select('*', { count: 'exact', head: true })
            .not('kendala', 'is', null)
            .neq('kendala', '');

        return {
            success: true,
            stats: {
                totalJurnal: totalJurnal || 0,
                disetujui: Disetujui || 0,
                totalJurnalPending: pending || 0,
                totalJurnalKendala: kendala || 0
            }
        };
    } catch (error: any) {
        return { success: false, stats: { totalJurnal: 0, disetujui: 0, totalJurnalPending: 0, totalJurnalKendala: 0 } };
    }
}