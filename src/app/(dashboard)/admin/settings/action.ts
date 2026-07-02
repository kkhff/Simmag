"use server";

import { createClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/logger";

interface PengaturanData {
    nama_sekolah: string;
    alamat: string;
    telepon: string;
    email: string;
    website: string;
    kepala_sekolah: string;
    npsn: string;
    logo_url?: string;
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function savePengaturan(data: PengaturanData) {
    try {
        const { error } = await supabaseAdmin.from('pengaturan').upsert({
            id: 1,
            nama_sekolah: data.nama_sekolah,
            alamat: data.alamat,
            telepon: data.telepon,
            email: data.email,
            website: data.website,
            kepala_sekolah: data.kepala_sekolah,
            npsn: data.npsn,
            logo_url: data.logo_url || '',
            updated_at: new Date().toISOString(),
        });

        if (error) throw new Error(error.message);

        await logActivity(
            null,
            "Settings",
            "Updated",
            `Pengaturan sekolah diperbarui: ${data.nama_sekolah}`
        );
        return { success: true, message: "Pengaturan sekolah berhasil diperbarui!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}