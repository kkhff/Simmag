"use server";

import { createClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/logger";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function verifikasiJurnalSiswa(
    jurnalId: number, 
    status: 'Disetujui' | 'Ditolak', 
    catatan: string, 
    authUserId: string
) {
    try {
        const { error } = await supabaseAdmin
            .from('jurnal')
            .update({ 
                status: status, 
                catatan: catatan || null 
            })
            .eq('id', jurnalId);

        if (error) throw new Error(error.message);

        // Catat aktivitas ke log
        await logActivity(
            authUserId,
            'Logbook',
            'Updated',
            `Guru mengubah status jurnal menjadi: ${status}.`
        );

        return { success: true, message: `Laporan jurnal berhasil di-${status.toLowerCase()}!` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}