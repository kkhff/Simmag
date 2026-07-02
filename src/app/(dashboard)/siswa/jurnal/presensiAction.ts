"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rumus Haversine untuk menghitung jarak antara 2 koordinat (dalam satuan Meter)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Radius bumi dalam meter
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // Mengembalikan jarak dalam satuan meter
}

export async function checkPresensiHariIni(siswaId: number) {
    try {
        // Gunakan Waktu Lokal Asia/Jakarta agar singkron dengan default DB Supabase WIB kamu
        const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }); // Hasilnya selalu: YYYY-MM-DD
        
        const { data, error } = await supabaseAdmin
            .from("presensi")
            .select("id")
            .eq("siswa_id", siswaId) // <-- Sekarang aman, membandingkan int8 dengan int8
            .eq("tanggal", todayStr)
            .maybeSingle();

        if (error) return { hasAbsen: false };
        return { hasAbsen: !!data };
    } catch {
        return { hasAbsen: false };
    }
}

export async function submitPresensiQR(data: {
    qrRawValue: string;
    latitudeSiswa: number;
    longitudeSiswa: number;
    authUserId: string;
    magangId: number;
}) {
    try {
        const todayStr = new Date().toISOString().split("T")[0];

        // 1. Ekstrak Data QR Code ([ID_DUDI]#[TOKEN_RAHASIA]#[TANGGAL])
        const qrParts = data.qrRawValue.split("#");
        if (qrParts.length !== 3) {
            throw new Error("Format QR Code tidak valid atau palsu!");
        }

        const [qrDudiId, qrSecretToken, qrDate] = qrParts;
        const targetDudiId = parseInt(qrDudiId);

        // 🔒 ANTI-FAKE LAPIS 1: Validasi Tanggal Expired QR
        if (qrDate !== todayStr) {
            throw new Error("QR Code sudah kedaluwarsa! Silakan minta QR Code hari ini ke pihak DUDI.");
        }

        // 🔒 ANTI-FAKE LAPIS KOREKSI: Cek apakah DUDI tempat siswa ditugaskan COCOK dengan QR yang di-scan
        const { data: magangCheck, error: magangError } = await supabaseAdmin
            .from("magang")
            .select("dudi_id")
            .eq("id", data.magangId)
            .single();

        if (magangError || !magangCheck) {
            throw new Error("Data aktif penempatan magang Anda tidak ditemukan.");
        }

        if (magangCheck.dudi_id !== targetDudiId) {
            throw new Error("Gagal! QR Code yang Anda scan bukan milik instansi tempat magang Anda!");
        }

        // 2. Tarik data koordinat asli DUDI dari database
        const { data: dudi, error: dudiError } = await supabaseAdmin
            .from("dudi")
            .select("latitude, longitude, qr_secret_token")
            .eq("id", targetDudiId)
            .single();

        if (dudiError || !dudi) throw new Error("Data mitra DUDI tidak ditemukan di sistem.");
        
        // 🔒 ANTI-FAKE LAPIS 2: Validasi Token Rahasia Instansi
        if (dudi.qr_secret_token !== qrSecretToken) {
            throw new Error("Token keamanan QR tidak cocok! Scan gagal.");
        }

        if (!dudi.latitude || !dudi.longitude) {
            throw new Error("Koordinat kantor DUDI belum diset oleh Admin. Silakan hubungi admin sekolah!");
        }

        // 🔒 ANTI-FAKE LAPIS 3: Hitung Pagar Jarak Radius Geolokasi (Maksimal 50 meter)
        const distance = calculateDistance(
            data.latitudeSiswa,
            data.longitudeSiswa,
            Number(dudi.latitude),
            Number(dudi.longitude)
        );

        if (distance > 50) {
            throw new Error(`Posisi Anda terlalu jauh dari kantor (${distance} meter). Maksimal radius absensi adalah 50 meter!`);
        }

        const {data: siswaId} = await supabaseAdmin.from("siswa").select("id").eq("user_id", data.authUserId).maybeSingle();

        // 3. Masukkan data ke tabel presensi jika semua lapis keamanan lolos
        const { error: insertError } = await supabaseAdmin.from("presensi").insert({
            siswa_id: siswaId?.id,
            magang_id: data.magangId,
            dudi_id: targetDudiId,
            tanggal: todayStr,
            latitude_siswa: data.latitudeSiswa,
            longitude_siswa: data.longitudeSiswa,
            jarak_meter: distance,
            status_presensi: "Hadir"
        });

        if (insertError) {
            if (insertError.code === "23505") throw new Error("Anda sudah melakukan absensi kehadiran hari ini!");
            throw new Error(insertError.message);
        }

        return { success: true, message: `Absen berhasil! Terdeteksi ${distance}m dari lokasi kantor.` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getPresensiHarian(dateStr: string) {
    try {
        // 1. Tarik presensi dan dudi saja (tanpa siswa)
        const { data, error } = await supabaseAdmin
            .from("presensi")
            .select(`
                *,
                dudi (
                    nama_perusahaan
                )
            `)
            .eq("tanggal", dateStr)
            .order("waktu_scan", { ascending: false });

        if (error) throw new Error(error.message);

        // 2. Tarik data profil siswa & users manual di dalam loop (Aman dari error FK)
        const formattedData = await Promise.all((data || []).map(async (p: any) => {
            
            const { data: siswaData } = await supabaseAdmin
                .from("siswa")
                .select("nis, users(nama_lengkap)")
                .eq("id", p.siswa_id)
                .maybeSingle();

            return {
                id: p.id,
                waktu: p.waktu_scan,
                jarak: p.jarak_meter,
                status: p.status_presensi,
                // Pastikan format ini flat (rata) biar frontend gampang bacanya
                namaSiswa: (siswaData?.users as any)?.nama_lengkap || "Siswa Magang",
                nisn: siswaData?.nis || "-",
                perusahaan: p.dudi?.nama_perusahaan || "Instansi DUDI",
                koordinat: `${p.latitude_siswa}, ${p.longitude_siswa}`
            };
        }));

        return { success: true, data: formattedData };
    } catch (error: any) {
        return { success: false, message: error.message, data: [] };
    }
}