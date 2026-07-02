import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function logActivity(userId: string | null, entities: 'User' | 'Dudi' | 'Magang' | 'Logbook' | 'Settings' | 'Activity',  aksi: 'Created' | 'Updated' | 'Deleted', deskripsi: string) {
    try {
        await supabaseAdmin.from('activity_logs').insert({
            user_id: userId || null, 
            entities: entities,
            aksi: aksi,
            deskripsi: deskripsi
        });
    } catch (error) {
        console.error("Gagal mencatat log aktivitas:", error);
    }
}