"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Building2, ClipboardList, ClockFading, GraduationCap, LayoutDashboard, Settings, Users, LogOut, LayersPlus, Percent, X } from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [role, setRole] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function getRoleUser() {
            try {
                setIsLoading(true);
                const { data, error }= await supabase.auth.getUser();
                if (error) {
                    throw new Error("Sesi login tidak ditemukan atau telah kedaluwarsa");
                };
                const { data: userData, error: userError} = await supabase.from('users').select('role').eq('id', data.user.id).single();
                if (userError) throw userError;

                setRole(userData?.role);

            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        } 

        getRoleUser();
    }, []);

    // Otomatis tutup sidebar drawer ketika siswa/guru klik menu dan berpindah halaman di HP
    useEffect(() => {
        if (onClose) onClose();
    }, [pathname]);

    const adminMenus = [
        {title: "Dashboard", href:"/admin", icon:LayoutDashboard},
        {title: "Siswa", href:"/admin/siswa", icon:GraduationCap},
        {title: "Presensi", href:"/admin/presensi", icon:ClockFading},
        {title: "Guru", href:"/admin/guru", icon:Users},
        {title: "Dudi", href:"/admin/dudi", icon:Building2},
        {title: "Logbook", href:"/admin/jurnal", icon:BookOpen},
        {title: "Magang", href:"/admin/magang", icon:ClipboardList},
        {title: "Pengguna", href:"/admin/pengguna", icon:Users},
        {title: "Batch", href:"/admin/pengguna/batch", icon:LayersPlus},
        {title: "Analytics", href:"/admin/analytics", icon:Percent},
        {title: "Activity Logs", href:"/admin/logs", icon:ClockFading},
        {title: "Pengaturan", href:"/admin/settings", icon:Settings},
    ];
    
    const guruMenus = [
        {title: "Dashboard", href:"/guru", icon:LayoutDashboard},
        {title: "Magang", href:"/guru/magang", icon:GraduationCap},
        {title: "Approval Jurnal", href:"/guru/jurnal", icon:BookOpen},
        {title: "Presensi", href:"/guru/presensi", icon:ClockFading},
    ];

    const siswaMenus = [
        {title: "Dashboard", href:"/siswa", icon:LayoutDashboard},
        {title: "Jurnal Harian", href:"/siswa/jurnal", icon:BookOpen},
        {title: "Magang", href:"/siswa/magang", icon:GraduationCap},
    ];    

    const menus = role === 'Admin' ? adminMenus : role === 'Guru' ? guruMenus : siswaMenus;

    const handleLogout = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        router.replace("/login");
        router.refresh();
      } catch (error) {
        console.error(error);
      }
    };

    return (
        <>
          {/* 🌑 OVERLAY BACKGROUND: Muncul hanya di mobile pas sidebar aktif, jika diklik otomatis menutup */}
          {isOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
              onClick={onClose}
            />
          )}

          {/* 📑 SIDEBAR CONTAINER */}
          <aside className={`
            fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 h-screen bg-white border-r border-slate-200 shadow-xl lg:shadow-sm font-sans shrink-0
            transition-transform duration-300 ease-in-out lg:sticky lg:translate-x-0
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
          `}>
            
            <div className="flex items-center justify-between lg:justify-center h-20 px-5 border-b border-slate-100 shrink-0">
              <h1 className="text-2xl font-black text-blue-600 tracking-tight">SIMMAG</h1>
              {/* Tombol Close silang X di pojok kanan sidebar (Hanya muncul di HP) */}
              <button 
                onClick={onClose} 
                className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg lg:hidden"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {isLoading ? (
                <div className="text-sm text-slate-400 text-center animate-pulse">Memuat menu...</div>
              ) : (
                menus.map((item, index) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={index}
                      href={item.href}
                      className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <item.icon
                        size={20}
                        className={isActive ? "text-blue-600" : "text-slate-400"}
                      />
                      {item.title}
                    </Link>
                  )
                })
              )}
            </nav>

            <div className="p-4 border-t border-slate-100 shrink-0">
              <button 
                onClick={handleLogout}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm font-semibold text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut size={20} />
                Keluar
              </button>
            </div>
          </aside>
        </>
    );
}