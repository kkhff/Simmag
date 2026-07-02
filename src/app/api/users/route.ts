import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Konsisten pake pola admin kamu
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1. GET: Ambil Semua User (Atau 1 user jika ada query ?id=...)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const { data, error } = await supabaseAdmin.from("users").select("*").eq("id", id).single();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, total: data?.length || 0, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 2. POST: Tambah User Baru via API
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, nama_lengkap, role } = body;

    if (!email || !password || !nama_lengkap || !role) {
      return NextResponse.json({ success: false, message: "Parameter email, password, nama_lengkap, role wajib ada!" }, { status: 400 });
    }

    // Buat di Auth Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    // Buat di tabel public.users
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert([{ id: authData.user.id, email, nama_lengkap, role }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: "User baru berhasil dibuat via API", data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 3. PATCH: Update nama_lengkap / Role User
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, nama_lengkap, role } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID User wajib disertakan di body JSON!" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ nama_lengkap, role })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Data user berhasil diperbarui", data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 4. DELETE: Hapus User Total (Tabel Public + Supabase Auth)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "Parameter URL ?id=UUID wajib dimasukkan!" }, { status: 400 });
    }

    // Hapus data di tabel public terlebih dahulu
    await supabaseAdmin.from("users").delete().eq("id", id);

    // Hapus dari sistem autentikasi utama Supabase
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) throw authError;

    return NextResponse.json({ success: true, message: `User ID ${id} resmi dihapus permanen.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}