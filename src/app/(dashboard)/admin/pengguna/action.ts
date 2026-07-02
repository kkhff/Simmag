"use server";

import { createClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/logger";

const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

interface createUserData {
    nama_lengkap: string;
    email: string;
    password?: string; 
    role: string;
    status?: string;
    nip?: string;
    mapel?: string;
    kelamin?:string;
    nis?: string;
    kelas?: string;
    jurusan?: string; // Menampung ID Jurusan berupa string dari modal ("1", "2", dll)
    telepon?: string;
    alamat?: string;
}

interface UpdateUserData {
    userId: string;
    nama_lengkap: string;
    password?: string; 
    role: string;
    status?: string;
    nip?: string;
    kelamin?:string;
    mapel?: string;
    nis?: string;
    kelas?: string;
    jurusan?: string; // Menampung ID Jurusan berupa string dari modal ("1", "2", dll)
    telepon?: string;
    alamat?: string;
}

export async function createClientUser(data: createUserData) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );

    try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: false,
        });

        if (authError) throw new Error(`Gagal membuat Auth: ${authError.message}`);

        const { error: sendEmailError } = await supabaseAdmin.auth.resend({
            type: 'signup',
            email: data.email,
        });

        if (sendEmailError) {
            console.error("Gagal mengirim email via Resend:", sendEmailError.message);
            // Kita tidak throw error agar data user tetap tersimpan di database
        }

        const newUserId = authData.user.id;

        // PUSAT DATA: Nama Lengkap dan Email masuk ke tabel induk 'users'
        const { error: userError } = await supabaseAdmin.from('users').insert({
            id: newUserId,
            nama_lengkap: data.nama_lengkap,
            email: data.email,
            role: data.role,
            email_verified: false,
        });
        
        if (userError) throw new Error(`Gagal menambahkan data user: ${userError.message}`);
        
        if (data.role === 'Guru') {
            const { error: guruError } = await supabaseAdmin.from('guru').insert({
                user_id: newUserId,
                nip: data.nip,
                telepon: data.telepon,
                jenis_kelamin: data.kelamin,
                mata_pelajaran: data.mapel,
                status: data.status,
                alamat: data.alamat,
            });
            if (guruError) throw new Error(`Gagal menambahkan data guru: ${guruError.message}`);
        } else if (data.role === 'Siswa') {
            // 🔥 FIX 1: Ubah kolom target ke jurusan_id dan bungkus dengan Number()
            const { error: siswaError } = await supabaseAdmin.from('siswa').insert({
                user_id: newUserId,
                nis: data.nis,
                kelas: data.kelas,
                jurusan_id: data.jurusan ? Number(data.jurusan) : null,
                telepon: data.telepon,
                status: data.status,
                alamat: data.alamat,
            });
            if (siswaError) throw new Error(`Gagal menambahkan data siswa: ${siswaError.message}`);
        }

        await logActivity(
            null,
            "User",
            "Created",
            `Admin telah membuat User ${data.nama_lengkap}.`
        );
        return { success: true, message: `Akun ${data.role} berhasil dibuat!` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteClientUser(userId: string, nama: string) {
     

    try {
        const { data: userData } = await supabaseAdmin.from('users').select('role').eq('id', userId).single();
        
        if (userData?.role === 'Guru') {
            const { data: guruData } = await supabaseAdmin.from('guru').select('id').eq('user_id', userId).single();
            
            if (guruData) {
                await supabaseAdmin
                    .from('magang')
                    .update({ guru_id: null })
                    .eq('guru_id', guruData.id);
            }
        }

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (error) throw new Error(error.message);
        
        await logActivity(
            null,
            "User",
            "Deleted",
            `Admin telah menghapus User ${nama}.`
        );
        
        return { success: true, message: "Pengguna berhasil dihapus permanen!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateClientUser(data: UpdateUserData) {
     

    try {
        // 1. UPDATE PASSWORD DI AUTH (HANYA JIKA DIISI)
        if (data.password && data.password.trim() !== '') {
            const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
                data.userId,
                { password: data.password }
            );
            if (authUpdateError) throw new Error(`Gagal update password: ${authUpdateError.message}`);
        }

        // 2. UPDATE TABEL INDUK USERS (Pusat pembaruan Nama Lengkap)
        const { error: userError } = await supabaseAdmin.from('users')
            .update({ 
                nama_lengkap: data.nama_lengkap,
            })
            .eq('id', data.userId);
        if (userError) throw new Error(`Gagal update tabel users: ${userError.message}`);

        // 3. UPDATE TABEL PROFIL SPECIFIC
        if (data.role === 'Guru') {
            const { error: guruError } = await supabaseAdmin.from('guru')
                .update({
                    status: data.status,
                    nip: data.nip,
                    mata_pelajaran: data.mapel,
                    jenis_kelamin: data.kelamin,
                    telepon: data.telepon,
                    alamat: data.alamat,
                })
                .eq('user_id', data.userId);
            if (guruError) throw new Error(`Gagal update data guru: ${guruError.message}`);

        } else if (data.role === 'Siswa') {
            // 🔥 FIX 2: Ubah kolom target ke jurusan_id dan bungkus dengan Number() saat update
            const { error: siswaError } = await supabaseAdmin.from('siswa')
                .update({
                    status: data.status,
                    nis: data.nis,
                    kelas: data.kelas,
                    jurusan_id: data.jurusan ? Number(data.jurusan) : null,
                    telepon: data.telepon,
                    alamat: data.alamat,
                })
                .eq('user_id', data.userId);
            if (siswaError) throw new Error(`Gagal update data siswa: ${siswaError.message}`);
        }

        await logActivity(
            null,
            "User",
            "Updated",
            `Admin telah memperbarui data User ${data.nama_lengkap}.`
        );

        return { success: true, message: `Data akun berhasil diperbarui!` };

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getUserPaginated(
    page: number = 1,
    limit: number = 5,
    search: string = "",
    role: string = "Semua Role"
) {
    try {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // 1. Join tabel profil guru ke master tabel users
        let query = supabaseAdmin
            .from('users')
            .select('*', { count: 'exact' })
            .order('role', {ascending: true})
            .order('created_at', { ascending: false });

        // 2. Filter roe  Akun Guru ('Aktif' / 'Nonaktif')
        if (role  !== "Semua Role") {
            query = query.eq('role', role );
        }

        // 3. Pencarian Teks (Cari berdasarkan NIP, Mapel, atau Nama di tabel users)
        if (search.trim() !== "") {

            // Langkah 2: Bangun kondisi OR tunggal — NIP, Mapel, ATAU user_id yang cocok
            query = query.or(
                `nama_lengkap.ilike.%${search}%,email.ilike.%${search}%`
            );

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
