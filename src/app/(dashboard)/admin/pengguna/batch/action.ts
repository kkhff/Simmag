"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface BatchUserData {
  nama_lengkap: string;
  email: string;
  password?: string;
  role: "Siswa" | "Guru";
  status?: string; // Tambah status ('Aktif', 'Magang', dll)
  // Data Siswa
  nis?: string;
  kelas?: string; // Menggunakan string tingkatan ('X', 'XI', 'XII')
  jurusan?: string; // Menggunakan string ID angka ('1', '2', dll)
  // Data Guru
  nip?: string;
  mapel?: string; 
  kelamin?: string; // Menggunakan 'Laki' / 'Perempuan'
  // Data Bersama
  telepon?: string;
  alamat?: string;
}

export async function executeBatchOperation(
  dataArray: BatchUserData[], 
  isUpsertMode: boolean = false
) {
  const results = { successCount: 0, failureCount: 0, errors: [] as string[] };

  for (const item of dataArray) {
    try {
      if (!item.email || !item.nama_lengkap) {
        throw new Error("Email dan Nama Lengkap wajib diisi!");
      }

      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", item.email)
        .maybeSingle();

      let userId = existingUser?.id;

      if (!userId) {
        // --- JALUR INSERT ---
        if (!item.password || item.password.length < 6) {
          throw new Error(`Password untuk ${item.email} minimal 6 karakter!`);
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: item.email,
          password: item.password,
          email_confirm: true, 
        });

        if (authError) throw new Error(`Auth Error (${item.email}): ${authError.message}`);
        userId = authData.user.id;

        const { error: userTableError } = await supabaseAdmin
          .from("users")
          .insert({ id: userId, email: item.email, role: item.role, nama_lengkap: item.nama_lengkap, email_verified: true });

        if (userTableError) throw new Error(`User Table Error: ${userTableError.message}`);
      } else {
        // --- JALUR UPSERT ---
        if (!isUpsertMode) {
          throw new Error(`Email ${item.email} sudah terdaftar! Gunakan mode Upsert.`);
        }
        
        await supabaseAdmin
          .from("users")
          .update({ nama_lengkap: item.nama_lengkap })
          .eq("id", userId);
      }

      // --- PROSES INFO TAMBAHAN SESUAI PORTINGAN MODAL ---
      const defaultStatus = item.status || "Aktif";

      if (item.role === "Siswa") {
        const siswaPayload = {
          user_id: userId, // Menyesuaikan nama kolom foreign key kamu jika bukan 'id'
          nis: item.nis || null,
          kelas: item.kelas || null,
          jurusan_id: item.jurusan ? parseInt(item.jurusan) : null, // Parsing string id "1" ke integer jika di DB bertipe int
          status: defaultStatus,
          telepon: item.telepon || null,
          alamat: item.alamat || null
        };

        const { error: siswaError } = await supabaseAdmin
          .from("siswa")
          .upsert(siswaPayload, { onConflict: "user_id" }); // Atur key konflik sesuai kolom PK siswa

        if (siswaError) throw new Error(`Siswa Profile Error: ${siswaError.message}`);

      } else if (item.role === "Guru") {
        const guruPayload = {
          user_id: userId,
          nip: item.nip || null,
          mata_pelajaran: item.mapel || null,
          jenis_kelamin: item.kelamin || null,
          status: defaultStatus,
          telepon: item.telepon || null,
          alamat: item.alamat || null
        };

        const { error: guruError } = await supabaseAdmin
          .from("guru")
          .upsert(guruPayload, { onConflict: "user_id" });

        if (guruError) throw new Error(`Guru Profile Error: ${guruError.message}`);
      }

      results.successCount++;
    } catch (err: any) {
      results.failureCount++;
      results.errors.push(err.message || "Error tidak diketahui");
    }
  }

  return results;
}