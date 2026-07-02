"use server";

import { createClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/logger";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function clearAllLogs() {
    try {
        // Proses hapus semua data di tabel activity_logs
        // Menggunakan kueri .neq('id', 0) artinya menghapus semua baris yang ID-nya bukan 0 (alias semuanya)
        const { error } = await supabaseAdmin
            .from('activity_logs')
            .delete()
            .neq('id', 0);

        if (error) throw new Error(error.message);

        // BONUS: Catat satu log baru bahwa log sistem baru saja dibersihkan
        await logActivity(
            null,
            "Activity",
            "Deleted",
            "Seluruh riwayat activity logs telah dibersihkan oleh Admin."
        );

        return { success: true, message: "Semua riwayat aktivitas berhasil dihapus!" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}