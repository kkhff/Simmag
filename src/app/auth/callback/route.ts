import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    console.error("CALLBACK ERROR: Tidak ada 'code' di dalam URL.");
    return NextResponse.redirect(`${origin}/login?status=failed`)
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error) {
    console.error("SUPABASE EXCHANGE ERROR:", error.message);
    return NextResponse.redirect(`${origin}/login?status=failed`)
  }
  
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (userData) {
      return NextResponse.redirect(`${origin}/${userData.role.toLowerCase()}`)
    } else {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?status=unregistered`)
    }
  }

  return NextResponse.redirect(`${origin}/login?status=failed`)
}