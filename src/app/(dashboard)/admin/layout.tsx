"use client"; // Ubah jadi use client karena mengontrol state buka-tutup di layout

import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { Menu } from "lucide-react"; // Ikon hamburger menu

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 1. Pasang Sidebar dengan menyuntikkan kontrol state */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Konten Utama di Kanan */}
      <div className="flex flex-col flex-1 w-full min-w-0">
        
        {/* TOPBAR BANNER DENGAN TOMBOL HAMBURGER */}
        <header className="sticky top-0 bg-white border-b border-slate-200 h-20 px-4 sm:px-6 flex items-center justify-between lg:justify-end z-30">
          
          {/* Tombol Hamburger: Muncul hanya saat layar hp/tablet (< 1024px) */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl lg:hidden transition-colors border border-slate-200"
          >
            <Menu size={20} />
          </button>

          {/* Isi komponen Topbar asli milikmu (Avatar, Notifikasi, dkk) */}
          <Topbar /> 
        </header>
        
        {/* Halaman Konten Utama */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}