"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, User, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Topbar() {
  const supabase = createClient();
  
  // State Utama
  const [namaSekolah, setNamaSekolah] = useState("Memuat...");
  const [userName, setUserName] = useState("Pengguna");
  const [userRole, setUserRole] = useState("Role");
  const [initials, setInitials] = useState("U");
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // State Notifikasi
  const [notifications, setNotifications] = useState<number>(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifList, setNotifList] = useState<any[]>([]);
  const [myMagangIds, setMyMagangIds] = useState<number[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let channel: any = null;

    async function fetchTopbarData() {
      try {
        if (typeof window !== "undefined") {
          setIsOnline(navigator.onLine);
              
          const handleOnline = () => {
            setIsOnline(true);
            toast.success("Koneksi internet kembali terhubung!", { icon: "🌐" });
          };
        
          const handleOffline = () => {
            setIsOnline(false);
            toast.error("Koneksi internet terputus. Anda masuk ke mode offline!", { icon: "⚠️" });
          };
        
          window.addEventListener("online", handleOnline);
          window.addEventListener("offline", handleOffline);
        
          
        }
        // 1. Ambil Nama Sekolah
        const { data: settingData } = await supabase.from('pengaturan').select('nama_sekolah').eq('id', 1).single();
        if (settingData?.nama_sekolah) setNamaSekolah(settingData.nama_sekolah);
        else setNamaSekolah("SIMMAG Dashboard");

        // 2. Ambil Sesi User Login
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 3. Ambil Profil User
        const { data: userData } = await supabase.from('users').select('nama_lengkap, role').eq('id', user.id).single();
        if (!userData) throw new Error("Gagal mengambil profil");

        const role = userData.role || 'User';
        const namaLengkap = userData.nama_lengkap || 'Pengguna SIMMAG';

        setUserRole(role);
        setUserName(namaLengkap);

        // 4. Bikin Inisial Avatar
        const nameParts = namaLengkap.trim().split(/\s+/);
        setInitials(nameParts.length > 1 ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() : namaLengkap.substring(0, 2).toUpperCase());

        // =========================================================
        // 🔒 LOGIKA FILTER NOTIFIKASI GURU (SUDAH DISINKRONKAN)
        // =========================================================
        if (role.toLowerCase().includes('guru')) {
          const { data: guruData } = await supabase.from('guru').select('id').eq('user_id', user.id).single();
          
          if (guruData) {
            const { data: magangData } = await supabase.from('magang').select('id').eq('guru_id', guruData.id);
            const validIds = magangData ? magangData.map(m => m.id) : [];
            setMyMagangIds(validIds);

            if (validIds.length > 0) {
              // 🔥 KOREKSI: Pastikan .on() dan .subscribe() dipanggil berurutan TANPA JEDA ASYNC
              channel = supabase
                .channel('realtime-guru-jurnal')
                .on(
                  'postgres_changes',
                  { event: 'INSERT', schema: 'public', table: 'jurnal' },
                  (payload) => {
                    if (validIds.includes(payload.new.magang_id)) {
                      setNotifications((prev) => prev + 1);
                      toast("Jurnal baru dari siswa bimbingan masuk!", { 
                        icon: '🔔',
                        style: { borderRadius: '10px', background: '#333', color: '#fff' },
                      });
                    }
                  }
                );
              
              // Diketok palu setelah .on() siap terpasang sempurna
              channel.subscribe();
            }
          }
        }
      } catch (error) {
        console.error("Gagal memuat data topbar:", error);
      } finally {
        setIsLoading(false);
      }
    }

    // Jalankan fungsi utama
    fetchTopbarData();

    // Tutup dropdown kalau ngeklik di luar kotak
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      // Cleanup channel dipindahkan ke sini dengan aman
      if (channel) supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [supabase]);

  // Fungsi saat Lonceng diklik: Buka modal/dropdown dan tarik 5 jurnal terbaru
  const toggleNotifications = async () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown && myMagangIds.length > 0) {
      setNotifications(0); // Reset lencana merah
      
      const { data } = await supabase
        .from('jurnal')
        .select(`
          id, 
          kegiatan, 
          created_at,
          magang ( siswa ( users ( nama_lengkap ) ) )
        `)
        .in('magang_id', myMagangIds) // Hanya ambil dari anak bimbingannya
        .order('created_at', { ascending: false })
        .limit(5); // MAKSIMAL 5 DATA TERBARU

      if (data) setNotifList(data);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-20 px-8 bg-white border-b border-slate-200 shadow-sm font-sans w-full">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-black text-slate-800 tracking-tight">{namaSekolah}</h1>
      </div>

      <div className="flex items-center gap-5">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border transition-all ${
          isOnline 
            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
            : "bg-red-50 text-red-600 border-red-100 animate-pulse"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`} />
          {isOnline ? "ONLINE" : "OFFLINE"}
        </div>
        
        {/* AREA IKON NOTIFIKASI & DROPDOWN MODAL */}
        {userRole.toLowerCase().includes('guru') && (
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={toggleNotifications}
              className="relative cursor-pointer p-2 hover:bg-slate-100 rounded-full transition-all"
            >
              <Bell size={20} className="text-slate-600" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full animate-bounce shadow-sm">
                  {notifications}
                </span>
              )}
            </div>

            {/* MODAL / DROPDOWN NOTIFIKASI MINI */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-black text-sm text-slate-800">Notifikasi Terbaru</h3>
                  <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Maks 5</div>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto">
                  {notifList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 font-medium">
                      Belum ada notifikasi jurnal masuk dari siswa bimbingan Anda.
                    </div>
                  ) : (
                    notifList.map((notif) => (
                      <div key={notif.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-2 bg-blue-50 text-blue-600 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <FileText size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {(notif.magang?.siswa as any)?.users?.nama_lengkap || "Siswa"}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
                              Telah mengisi jurnal: "{notif.kegiatan}"
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1.5 flex items-center gap-1">
                              {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 size={12} /> Semua notifikasi telah dibaca
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors">
          <div className="hidden sm:flex flex-col items-end">
            {isLoading ? <div className="w-24 h-4 bg-slate-100 rounded animate-pulse mb-1"></div> : <p className="text-sm font-bold text-slate-800 leading-tight">{userName}</p>}
            {isLoading ? <div className="w-12 h-3 bg-slate-100 rounded animate-pulse"></div> : <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5">{userRole}</p>}
          </div>
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-500 text-white rounded-full flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
            {isLoading ? <User size={18} className="opacity-50" /> : initials}
          </div>
        </div>
      </div>
    </header>
  );
}