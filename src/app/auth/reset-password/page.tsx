"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResetPassword() {
    const supabase = createClient();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdatePassword = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error("Password tidak cocok!");
            return;
        }
        if (password.length < 6) {
            toast.error("Password minimal 6 karakter!");
            return;
        }

        setIsLoading(true);
        
        try {
            // Karena user sudah otomatis ter-otentikasi lewat callback, kita tinggal update passwordnya
            const { error } = await supabase.auth.updateUser({ password: password });

            if (error) throw new Error(error.message);
            
            toast.success("Password berhasil diubah! Silakan login kembali.");
            
            // Logout paksa biar rapi, lalu arahkan ke login
            await supabase.auth.signOut();
            router.push('/login');
            
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
          <CardTitle className="text-2xl font-black tracking-tight text-slate-800">Buat Password Baru</CardTitle>
          <CardDescription className="text-slate-500 font-medium px-4">
            Masukkan password baru yang kuat dan mudah diingat.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Password Baru</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-slate-50 border-slate-200 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-bold">Konfirmasi Password</Label>
              <Input
                type="password"
                placeholder="Ketik ulang password baru..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 bg-slate-50 border-slate-200 rounded-xl"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-md rounded-xl shadow-md transition-all">
              {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}