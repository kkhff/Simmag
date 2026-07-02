"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

export default function MobileLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Otomatis tutup sidebar di HP kalau pindah halaman/menu
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50 w-full relative">
      {/* 1. Kirim state kontrol ke Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Konten Utama di Kanan */}
      <div className="flex flex-col flex-1 w-full min-w-0">
        
        {/* 2. Topbar yang cerdas: Muncul tombol Hamburger hanya di layar HP/Tablet (< lg) */}
        <header className="sticky top-0 bg-white border-b border-slate-200 h-20 px-4 sm:px-6 flex items-center justify-between lg:justify-end z-30 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl lg:hidden transition-colors border border-slate-200 shrink-0"
          >
            <Menu size={20} />
          </button>

          {/* Taruh Topbar asli kamu di sini */}
          <Topbar /> 
        </header>
        
        {/* Halaman Konten (Dashboard, Jurnal, dll) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}