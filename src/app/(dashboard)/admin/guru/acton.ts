"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getGuruPaginated(
    page: number = 1,
    limit: number = 5,
    search: string = "",
    status: string = "Semua Status"
) {
    try {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // 1. Join tabel profil guru ke master tabel users
        let query = supabaseAdmin
            .from('guru')
            .select('*, users!inner(email, nama_lengkap), magang(id, status)', { count: 'exact' })
            .order('created_at', { ascending: false });

        // 2. Filter Status Akun Guru ('Aktif' / 'Nonaktif')
        if (status !== "Semua Status") {
            query = query.eq('status', status);
        }

        // 3. Pencarian Teks (Cari berdasarkan NIP, Mapel, atau Nama di tabel users)
        if (search.trim() !== "") {
            // Langkah 1: Cari user_id dari tabel users yang nama_lengkap-nya cocok
            const { data: matchingUsers } = await supabaseAdmin
                .from('users')
                .select('id')
                .ilike('nama_lengkap', `%${search}%`);

            const matchingUserIds = (matchingUsers ?? []).map((u: any) => u.id);

            // Langkah 2: Bangun kondisi OR tunggal — NIP, Mapel, ATAU user_id yang cocok
            if (matchingUserIds.length > 0) {
                // Gabungkan semua dalam satu .or() agar benar-benar OR
                query = query.or(
                    `nip.ilike.%${search}%,mata_pelajaran.ilike.%${search}%,user_id.in.(${matchingUserIds.join(',')})`
                );
            } else {
                // Tidak ada nama yang cocok, cukup cari berdasarkan NIP dan Mapel
                query = query.or(`nip.ilike.%${search}%,mata_pelajaran.ilike.%${search}%`);
            }
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

export async function getGuruStats() {
    try {
        // 1. Hitung total DUDI berdasarkan status
        const { count: totalGuru } = await supabaseAdmin
            .from('guru')
            .select('*', { count: 'exact', head: true });

        const { count: aktif } = await supabaseAdmin
            .from('guru')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Aktif');

        const { count: nonaktif } = await supabaseAdmin
            .from('guru')
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
                totalGuru: totalGuru || 0,
                guruAktif: aktif || 0,
                guruNonAktif: nonaktif || 0,
                totalSiswaMagang: siswaMagang || 0
            }
        };
    } catch (error: any) {
        return { success: false, stats: { totalGuru: 0, guruAktif: 0, guruNonAktif: 0, totalSiswaMagang: 0 } };
    }
}
