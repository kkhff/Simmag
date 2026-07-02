import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eff6ff] via-white to-white font-sans overflow-hidden">
      
      {/* NAVBAR */}
      <header className="container mx-auto px-6 sm:px-12 py-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-lg shadow-sm">
            <GraduationCap size={20} />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">SIMMAS</span>
        </div>

        {/* Desktop Menu */}
        

        {/* Login Button */}
        <div>
          <Link href="/login">
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all shadow-sm shadow-blue-600/20">
              Log In
            </button>
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="container mx-auto px-6 sm:px-12 pt-20 pb-10 flex flex-col items-center text-center">
        
        {/* Badge */}
        <div className="bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-8">
          Platform Magang Siswa SMK
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-800 tracking-tight leading-[1.1] mb-6 max-w-4xl">
          Kelola Program Magang <br className="hidden sm:block" />
          <span className="text-blue-600">Lebih Cerdas</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-base sm:text-lg text-slate-500 font-medium max-w-2xl mb-10 leading-relaxed">
          SIMMAS menghubungkan siswa, guru pembimbing, dan perusahaan mitra dalam satu sistem yang modern, transparan, dan mudah digunakan.
        </p>

        {/* CTA Buttons */}
        
      </main>

      {/* MOCKUP UI ILLUSTRATION */}
      <div className="container mx-auto px-6 mt-12">
        <div className="max-w-5xl mx-auto bg-white/40 backdrop-blur-xl border border-white/60 p-4 sm:p-6 rounded-t-[2.5rem] shadow-2xl relative overflow-hidden h-[400px]">
          
          {/* Inner App Window */}
          <div className="w-full h-full bg-white rounded-t-2xl border border-slate-100 shadow-sm flex overflow-hidden">
            
            {/* Sidebar Skeleton */}
            <div className="w-16 sm:w-64 bg-slate-50 border-r border-slate-100 p-4 flex flex-col gap-6 shrink-0">
              {/* Logo Skeleton */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg shrink-0"></div>
                <div className="h-4 w-24 bg-slate-200 rounded-md hidden sm:block"></div>
              </div>
              {/* Menu Items */}
              <div className="space-y-3">
                <div className="h-10 bg-blue-50 border border-blue-100 rounded-xl hidden sm:block"></div>
                <div className="w-8 h-8 bg-blue-50 rounded-xl sm:hidden mx-auto"></div>
                
                <div className="h-10 bg-transparent rounded-xl flex items-center px-3 hidden sm:flex">
                  <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
                </div>
                <div className="w-8 h-8 bg-slate-100 rounded-xl sm:hidden mx-auto"></div>

                <div className="h-10 bg-transparent rounded-xl flex items-center px-3 hidden sm:flex">
                  <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
                </div>
                <div className="w-8 h-8 bg-slate-100 rounded-xl sm:hidden mx-auto"></div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 p-6 sm:p-10 flex flex-col gap-8">
              {/* Topbar */}
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
                  <div className="h-3 w-32 bg-slate-100 rounded-md"></div>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full shrink-0"></div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="h-28 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
                  <div className="h-3 w-20 bg-slate-100 rounded-md"></div>
                  <div className="h-8 w-12 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="h-28 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
                  <div className="h-3 w-24 bg-slate-100 rounded-md"></div>
                  <div className="h-8 w-16 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="h-28 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex flex-col justify-between hidden sm:flex">
                  <div className="h-3 w-16 bg-slate-100 rounded-md"></div>
                  <div className="h-8 w-10 bg-slate-200 rounded-lg"></div>
                </div>
              </div>

              {/* List Area */}
              <div className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="h-4 w-32 bg-slate-200 rounded-md mb-6"></div>
                <div className="h-12 bg-slate-50 rounded-xl border border-slate-100"></div>
                <div className="h-12 bg-slate-50 rounded-xl border border-slate-100"></div>
                <div className="h-12 bg-slate-50 rounded-xl border border-slate-100 hidden sm:block"></div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}