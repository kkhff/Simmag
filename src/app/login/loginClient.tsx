"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ReCAPTCHA from "react-google-recaptcha"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff } from "lucide-react" // Menghapus import Router yang tidak terpakai
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Login() {
  const searchParams = useSearchParams();
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const [isOtpMode, setIsOtpMode] = useState(false); // Untuk tukar form password ke form OTP
    const [otpCode, setOtpCode] = useState(''); // Menampung 6 digit kode OTP
    const [isSendingOtp, setIsSendingOtp] = useState(false); // Loading pas kirim OTP
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

    useEffect(() => {
        const status = searchParams.get('status');
        if (status === 'unregistered') {
            toast.error("Email Google Anda belum didaftarkan oleh Admin SIMMAG!", { id: 'oauth-error' });
        } else if (status === 'failed') {
            toast.error("Proses login Google OAuth gagal. Silakan coba lagi.", { id: 'oauth-error' });
        }
    }, [searchParams]);
    
    // 1. FUNGSI UNTUK GOOGLE OAUTH
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setErrorMsg('');
        
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Supabase akan mengarahkan user kembali ke sini setelah login Google berhasil
                    redirectTo: `${window.location.origin}/auth/callback`, 
                },
            });
            
            if (error) throw error;
        } catch (error: any) {
            setErrorMsg("Gagal terhubung ke Google Auth: " + error.message);
            setIsLoading(false);
        }
    };

    // Fungsi A: Minta Supabase kirim kode OTP ke Gmail
    const handleSendOtp = async () => {
      if (!recaptchaToken) {
          toast.error("Silakan centang reCAPTCHA terlebih dahulu!");
          setIsLoading(false);
          return;
      }
      if (!email) {
        toast.error("Masukkan email terlebih dahulu!");
            return;
        }
        setIsSendingOtp(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    shouldCreateUser: false, // Jangan bikin akun baru, khusus buat yang sudah didaftarkan admin aja
                }
            });
          
            if (error) throw new Error(error.message);
          
            toast.success("Kode OTP berhasil dikirim! Silakan cek kotak masuk Gmail Anda.");
            setIsOtpMode(true); // Pindah tampilan ke mode input token OTP
        } catch (error: any) {
            toast.error("Gagal mengirim OTP: " + error.message);
        } finally {
            setIsSendingOtp(false);
        }
    };

// Fungsi B: Verifikasi kode OTP yang diketik user
    const handleVerifyOtp = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.verifyOtp({
              email: email,
              token: otpCode,
                type: 'email',
            });
          
            if (error) throw new Error(error.message);
          
            // Jika lolos, cek role-nya di tabel users untuk routing (samakan dengan logika handleLogin biasa kamu)
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user?.id)
                .single();
          
            if (userData) {
                router.push(`/${userData.role.toLowerCase()}`);
            } else {
                await supabase.auth.signOut();
                toast.error("Akun Anda belum terdaftar di SIMMAG!");
            }
        } catch (error: any) {
            toast.error("Kode OTP salah atau kedaluwarsa: " + error.message);
          } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      setErrorMsg('');
      
      if (!recaptchaToken) {
          toast.error("Silakan centang reCAPTCHA terlebih dahulu!");
          setIsLoading(false);
          return;
      }
        try {
            const { data, error} = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) {
                // Cek secara spesifik jika user belum melakukan konfirmasi email
                if (error.message.toLowerCase().includes("confirm") || error.message.toLowerCase().includes("verified")) {
                    throw new Error("Akun Anda belum aktif! Silakan periksa kotak masuk Gmail Anda untuk melakukan verifikasi.");
                }
                throw new Error("Email atau Password salah!");
            }
            
            // Pengecekan Role di tabel kustom public.users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single();
                
            if (userError || !userData) {
                // Keamanan Sistem Privat: Jika di auth ada tapi di tabel kustom kosong, kick out!
                await supabase.auth.signOut();
                throw new Error("Akun Anda belum terdaftar di sistem SIMMAG sekolah!");
            }
            
            switch (userData.role) {
                case "Admin":
                    router.push('/admin');
                    break;
                case "Guru":
                    router.push('/guru');
                    break;
                case "Siswa":
                    router.push('/siswa');
                    break;
            }
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false)
        }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 font-sans">
      <Card className="w-full max-w-md border-0 shadow-xl shadow-slate-200/50 rounded-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-3 text-center pt-8 pb-6">
          <div className="mx-auto bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 mb-2">
            <span className="text-white font-black text-2xl">S</span>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-slate-800">
            SIMMAG
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium px-4">
            Sistem Informasi Manajemen Magang. Masuk ke akun Anda.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={isOtpMode ? handleVerifyOtp : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-bold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@sekolah.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl"
              />
            </div>
            
            {isOtpMode ? (
              <div className="space-y-2">
                <Label htmlFor="otp">Masukkan 6 Digit Kode OTP</Label>
                <Input 
                  id="otp" 
                  placeholder="123456" 
                  maxLength={6} 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value)} 
                  required 
                />
                <button type="button" onClick={() => setIsOtpMode(false)} className="text-xs font-bold text-blue-600">
                  Kembali pakai Password
                </button>
              </div>
            ) : (
            <div className="space-y-2">
              {/* Flex container untuk memisahkan Label (Kiri) dan Link Lupa Password (Kanan) */}
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-bold">Password</Label>
                <Link
                  href="/lupa-password" 
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                >
                  Lupa Password?
                </Link>
              </div>
              
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl pr-12"
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold text-center border border-red-100">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-center my-2 scale-90 origin-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!} // Ambil dari file .env.local kamu
                onChange={(token) => setRecaptchaToken(token)}
                onExpired={() => setRecaptchaToken(null)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-md rounded-xl shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5" 
              disabled={isLoading}
            >
              {isLoading ? "Memverifikasi..." : "Masuk ke Dashboard"}
            </Button>

            {/* 2. GARIS PEMISAH OR / ATAU */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute w-full border-t border-slate-200"></div>
              <span className="relative bg-white/90 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Atau
              </span>
            </div>

            {/* 3. TOMBOL LOGIN GOOGLE OAUTH */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-md rounded-xl shadow-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3"
            >
              {/* SVG Logo Google Resmi */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3A11.916 11.916 0 0 0 12 .091C7.255.091 3.173 2.7 1.055 6.518l4.21 3.247z"
                />
                <path
                  fill="#34A853"
                  d="M16.04 15.314c-1.055.727-2.427 1.163-4.04 1.163-2.936 0-5.446-1.936-6.336-4.545L1.41 15.145A11.954 11.954 0 0 0 12 23.909c3.236 0 6.136-1.073 8.355-2.918l-4.318-3.677z"
                />
                <path
                  fill="#4285F4"
                  d="M23.491 12.273c0-.818-.082-1.609-.218-2.364H12v4.51h6.464a5.527 5.527 0 0 1-2.4 3.627l4.318 3.677c2.518-2.327 3.982-5.764 3.982-9.45z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.664 11.932A7.014 7.014 0 0 1 5.264 12c0-.59.1-1.164.264-1.718L1.318 7.036A11.964 11.964 0 0 0 .091 12c0 1.764.39 3.445 1.082 4.964l4.49-3.032z"
                />
              </svg>
              Masuk dengan Google
            </Button>
          </form>
          {!isOtpMode && (
            <Button 
              type="button" 
              variant="outline" 
              disabled={isSendingOtp} 
              onClick={handleSendOtp}
              className="w-full mt-2"
            >
              {isSendingOtp ? "Mengirim OTP..." : "Masuk Alternatif via Kode OTP Email"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}