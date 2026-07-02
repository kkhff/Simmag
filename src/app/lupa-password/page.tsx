"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LupaPassword() {
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            // Buat query string yang aman agar tidak merusak URL Supabase
            const params = new URLSearchParams({ next: '/auth/reset-password' });

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                // Menggunakan params.toString() memastikan format URL valid
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });


            if (error) throw new Error(error.message);
            
            toast.success("Tautan reset password telah dikirim ke email Anda!");
            setEmail('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 font-sans">
      <Card className="w-full max-w-md border-0 shadow-xl shadow-slate-200/50 rounded-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-3 text-center pt-8 pb-6">
          <CardTitle className="text-2xl font-black tracking-tight text-slate-800">Lupa Password?</CardTitle>
          <CardDescription className="text-slate-500 font-medium px-4">
            Masukkan email Anda dan kami akan mengirimkan tautan untuk mereset password.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-bold">Email Terdaftar</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@sekolah.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-md rounded-xl shadow-md transition-all">
              {isLoading ? "Mengirim Tautan..." : "Kirim Tautan Reset"}
            </Button>

            <div className="text-center mt-4">
              <Link href="/login" className="text-sm font-bold text-blue-600 hover:text-blue-700">
                &larr; Kembali ke halaman Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}