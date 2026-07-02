"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getSiswaPaginated(
    page: number = 1,
    limit: number = 5,
    search: string = "",
    status: string = "Semua Status"
) {
    try {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // 1. Join tabel profil siswa ke master tabel users
        let query = supabaseAdmin
            .from('siswa')
            .select('*, users!inner(nama_lengkap, email), jurusan(nama_jurusan), magang(dudi(nama_perusahaan))', { count: 'exact' })
            .order('created_at', { ascending: false });

        // 2. Filter Status Akun Siswa ('Aktif', 'Magang', 'Selesai', 'Nonaktif')
        if (status !== "Semua Status") {
            query = query.eq('status', status);
        }

        // 3. Pencarian Teks (Cari berdasarkan NIS, Kelas, atau Nama di tabel users)
        if (search.trim() !== "") {
            // Langkah 1: Cari user_id dari tabel users yang nama_lengkap-nya cocok
            const { data: matchingUsers } = await supabaseAdmin
                .from('users')
                .select('id')
                .ilike('nama_lengkap', `%${search}%`);

            const matchingUserIds = (matchingUsers ?? []).map((u: any) => u.id);

            const { data: matchingJurusan } = await supabaseAdmin
                .from('jurusan')
                .select('id')
                .ilike('nama_jurusan', `%${search}%`);


            const matchingJurusanIds = (matchingJurusan ?? []).map((u: any) => u.id);

            // Langkah 2: Bangun kondisi OR secara dinamis agar jurusan tetap dicari
            // meskipun tidak ada nama user yang cocok
            const orParts: string[] = [`nis.ilike.%${search}%`];

            if (matchingUserIds.length > 0) {
                orParts.push(`user_id.in.(${matchingUserIds.join(',')})`);
            }

            if (matchingJurusanIds.length > 0) {
                orParts.push(`jurusan_id.in.(${matchingJurusanIds.join(',')})`);
            }

            query = query.or(orParts.join(','));
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

export async function getSiswaStats() {
    try {
        // 1. Hitung total DUDI berdasarkan status
        const { count: totalSiswa } = await supabaseAdmin
            .from('siswa')
            .select('*', { count: 'exact', head: true });

        const { count: aktif } = await supabaseAdmin
            .from('siswa')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Aktif');

        const { count: sedang } = await supabaseAdmin
            .from('siswa')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Magang');

        // 2. Hitung total siswa yang status magangnya aktif
        const { count: siswaSelesai } = await supabaseAdmin
            .from('siswa')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Selesai');

        return {
            success: true,
            stats: {
                totalSiswa: totalSiswa || 0,
                siswaAktif: aktif || 0,
                totalSiswaSedang: sedang || 0,
                totalSiswaSelesai: siswaSelesai || 0
            }
        };
    } catch (error: any) {
        return { success: false, stats: { totalSiswa: 0, siswaAktif: 0, totalSiswaSedang: 0, totalSiswaSelesai: 0 } };
    }
}
