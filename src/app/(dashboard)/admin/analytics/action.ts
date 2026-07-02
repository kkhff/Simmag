"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAnalyticsData() {
  const supabase = await createClient();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

  try {
    // 1. Ambil Data Card Atas
    const { count: siswaAktif } = await supabase.from("magang").select("*", { count: "exact", head: true }).eq("status", "Aktif");
    const { count: totalDudi } = await supabase.from("dudi").select("*", { count: "exact", head: true }).eq("status", "Aktif");
    const { count: pendingMagang } = await supabase.from("magang").select("*", { count: "exact", head: true }).eq("status", "Pending");
    const { count: hadirHariIni } = await supabase.from("presensi").select("*", { count: "exact", head: true }).eq("tanggal", today).eq("status_presensi", "Hadir");

    // Hitung Rasio Kehadiran (%)
    const rasioPresensi = siswaAktif && siswaAktif > 0 ? Math.round(((hadirHariIni || 0) / siswaAktif) * 100) : 0;

    // 2. Ambil Data Pie Chart: Distribusi per Jurusan
    const { data: magangJurusan } = await supabase
      .from("magang")
      .select("status, siswa(jurusan(nama_jurusan))")
      .eq("status", "Aktif");

    const jurusanMap: Record<string, number> = {};
    magangJurusan?.forEach((m: any) => {
      const namaJurusan = m.siswa?.jurusan?.nama_jurusan || "Tanpa Jurusan";
      jurusanMap[namaJurusan] = (jurusanMap[namaJurusan] || 0) + 1;
    });

    const pieData = Object.keys(jurusanMap).map((key) => ({
      name: key,
      value: jurusanMap[key],
    }));

    // =========================================================================
    // 3. MOCK DATA BULANAN & MINGGUAN (AKTIF)
    // =========================================================================
    // const barData = [
    //   { name: "Jan", Presensi: 45, Jurnal: 40 },
    //   { name: "Feb", Presensi: 55, Jurnal: 48 },
    //   { name: "Mar", Presensi: 70, Jurnal: 65 },
    //   { name: "Apr", Presensi: 65, Jurnal: 60 },
    //   { name: "Mei", Presensi: 85, Jurnal: 80 },
    //   { name: "Jun", Presensi: 90, Jurnal: 88 },
    // ];

    // const lineData = [
    //   { name: "Wk 1", Jurnal: 120, LogAktivitas: 240 },
    //   { name: "Wk 2", Jurnal: 150, LogAktivitas: 280 },
    //   { name: "Wk 3", Jurnal: 180, LogAktivitas: 310 },
    //   { name: "Wk 4", Jurnal: 140, LogAktivitas: 210 },
    // ];

    // =========================================================================
    // 🚀 DATA REAL (TINGGAL HAPUS KOMENTAR INI NANTI, LALU KOMENTAR YANG DUMMY)
    // =========================================================================
    
    // --- LOGIKA BAR DATA REAL (6 Bulan Terakhir) ---
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const startDateBar = sixMonthsAgo.toISOString().split("T")[0];

    // Tarik data mentah dari DB (Presensi Hadir & Semua Jurnal)
    const { data: rawPresensi } = await supabase.from("presensi").select("tanggal").eq("status_presensi", "Hadir").gte("tanggal", startDateBar);
    const { data: rawJurnal } = await supabase.from("jurnal").select("tanggal").eq('status', 'Disetujui').gte("tanggal", startDateBar);

    const barData = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    
    // Looping mundur 5 bulan sampai bulan ini
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const presensiBulanIni = rawPresensi?.filter(p => new Date(p.tanggal).getMonth() === m && new Date(p.tanggal).getFullYear() === y).length || 0;
      const jurnalBulanIni = rawJurnal?.filter(j => new Date(j.tanggal).getMonth() === m && new Date(j.tanggal).getFullYear() === y).length || 0;
      
      barData.push({ name: monthNames[m], Presensi: presensiBulanIni, 'Jurnal Disetujui': jurnalBulanIni });
    }

    // --- LOGIKA LINE DATA REAL (4 Minggu Terakhir) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 28);
    const startDateLine = thirtyDaysAgo.toISOString();

    const { data: rawJurnalWeek } = await supabase.from("jurnal").select("created_at").gte("created_at", startDateLine);
    const { data: rawLogs } = await supabase.from("activity_logs").select("created_at").gte("created_at", startDateLine);

    const lineData = [
      { name: "Minggu 1", Jurnal: 0, LogAktivitas: 0 },
      { name: "Minggu 2", Jurnal: 0, LogAktivitas: 0 },
      { name: "Minggu 3", Jurnal: 0, LogAktivitas: 0 },
      { name: "Minggu 4", Jurnal: 0, LogAktivitas: 0 },
    ];

    const now = new Date();
    // Pilah jurnal berdasarkan minggu
    rawJurnalWeek?.forEach(item => {
      const diffDays = Math.floor((now.getTime() - new Date(item.created_at).getTime()) / (1000 * 3600 * 24));
      if (diffDays < 7) lineData[3].Jurnal++;
      else if (diffDays < 14) lineData[2].Jurnal++;
      else if (diffDays < 21) lineData[1].Jurnal++;
      else if (diffDays <= 28) lineData[0].Jurnal++;
    });

    // Pilah log aktivitas berdasarkan minggu
    rawLogs?.forEach(item => {
      const diffDays = Math.floor((now.getTime() - new Date(item.created_at).getTime()) / (1000 * 3600 * 24));
      if (diffDays < 7) lineData[3].LogAktivitas++;
      else if (diffDays < 14) lineData[2].LogAktivitas++;
      else if (diffDays < 21) lineData[1].LogAktivitas++;
      else if (diffDays <= 28) lineData[0].LogAktivitas++;
    });
    // =========================================================================
    

    return {
      success: true,
      cards: {
        siswaAktif: siswaAktif || 0,
        totalDudi: totalDudi || 0,
        pendingMagang: pendingMagang || 0,
        rasioPresensi: `${rasioPresensi}%`,
      },
      pieData,
      barData, // Kalau nanti mau pakai data asli, ganti jadi: realBarData
      lineData, // Kalau nanti mau pakai data asli, ganti jadi: realLineData
    };
  } catch (error: any) {
    console.error("Gagal memuat analitik:", error);
    return { success: false, message: error.message };
  }
}