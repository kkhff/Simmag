"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { verifikasiJurnalSiswa } from "./action";
import { Search, CheckCircle, XCircle, User, Calendar, AlertTriangle, MessageSquare, Filter, Eye, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import JurnalDetailModal from "@/components/modals/JurnalDetailModal";

export default function ValidasiJurnalGuruPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  // Modal States
  const [selectedJurnal, setSelectedJurnal] = useState<any>(null);
  
  // Modal Konfirmasi Aksi
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [actionType, setActionType] = useState<"Disetujui" | "Ditolak">("Disetujui");
  const [formCatatan, setFormCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Detail

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: guruData } = await supabase.from('guru').select('id').eq('user_id', user.id).single();
      if (!guruData) {
        setLogs([]);
        setIsLoading(false);
        return;
      }

      const { data: magangList } = await supabase
        .from('magang')
        .select('id, siswa(users(nama_lengkap))')
        .eq('guru_id', guruData.id);

      if (!magangList || magangList.length === 0) {
        setLogs([]);
        setIsLoading(false);
        return;
      }

      const magangIds: number[] = [];
      const magangMap: Record<number, string> = {};
      
      magangList.forEach((m: any) => {
        magangIds.push(m.id);
        let nama = "Siswa Tidak Diketahui";
        if (m.siswa) {
          nama = Array.isArray(m.siswa) ? m.siswa[0]?.users.nama_lengkap : m.siswa.users.nama_lengkap;
        }
        magangMap[m.id] = nama;
      });

      const { data: jurnalList } = await supabase
        .from('jurnal')
        .select('*')
        .in('magang_id', magangIds)
        .order('tanggal', { ascending: false });

      const combinedLogs = (jurnalList || []).map(j => ({
        ...j,
        nama_siswa: magangMap[j.magang_id] || "Siswa"
      }));

      setLogs(combinedLogs);

    } catch (error) {
      toast.error("Gagal memuat daftar logbook.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { fetchData(); }, []);

  const total = logs.length;
  const approved = logs.filter(l => l.status === 'Disetujui').length;
  const pending = logs.filter(l => l.status === 'Pending').length;
  const rejected = logs.filter(l => l.status === 'Ditolak').length;


  // Buka Modal Konfirmasi ACC/Tolak
  const openActionModal = (type: "Disetujui" | "Ditolak", jurnal: any) => {
    setSelectedJurnal(jurnal);
    setActionType(type);
    setFormCatatan(jurnal.catatan || "");
    setIsActionModalOpen(true);
  };

  // Buka Modal Detail
  const openDetailModal = (jurnal: any) => {
    setSelectedJurnal(jurnal);
    setIsDetailOpen(true);
  };

  const handleProcessAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionType === "Ditolak" && !formCatatan.trim()) {
      return toast.error("Wajib memberikan alasan atau catatan revisi jika menolak jurnal!");
    }

    setIsSubmitting(true);
    const res = await verifikasiJurnalSiswa(selectedJurnal.id, actionType, formCatatan, userId);
    
    if (res.success) {
      toast.success(res.message);
      setIsActionModalOpen(false);
      fetchData();
    } else {
      toast.error(res.message);
    }
    setIsSubmitting(false);
  };

  const filteredLogs = logs.filter((log) => {
    const namaSiswa = log.nama_siswa.toLowerCase();
    const isiKegiatan = (log.kegiatan || "").toLowerCase();
    
    const matchesSearch = namaSiswa.includes(debounceSearch.toLowerCase()) || isiKegiatan.includes(debounceSearch.toLowerCase());
    const matchesStatus = statusFilter === "Semua" || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Validasi Jurnal Siswa</h2>
        <p className="text-slate-500 text-sm mt-1">Periksa dan berikan verifikasi logbook kegiatan harian siswa bimbingan Anda</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Jurnal", val: total, color: "text-slate-800", icon: <BookOpen /> },
          { label: "Disetujui", val: approved, color: "text-emerald-600", icon: <CheckCircle /> },
          { label: "Menunggu", val: pending, color: "text-blue-600", icon: <Clock /> },
          { label: "Ditolak", val: rejected, color: "text-red-600", icon: <XCircle /> },
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${item.color}`}>
               {item.icon} {item.label}
            </div>
            <h3 className="text-3xl font-black text-slate-800">{item.val}</h3>
          </div>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input 
            placeholder="Cari nama siswa atau kata kunci..." 
            className="pl-9 bg-slate-50 border-slate-200 rounded-full h-10 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-slate-400 hidden sm:inline" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-slate-50 border-slate-200 rounded-full h-10 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua">Semua Riwayat</SelectItem>
              <SelectItem value="Pending">Menunggu (Pending)</SelectItem>
              <SelectItem value="Disetujui">Telah Disetujui</SelectItem>
              <SelectItem value="Ditolak">Ditolak / Revisi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* FEED LIST */}
      <div className="space-y-4">
        {isLoading ? (
  Array.from({ length: 5 }).map((_, index) => (
    <div
      key={index}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between gap-6 animate-pulse"
    >
      {/* Kiri */}
      <div className="w-full lg:w-1/4 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-4">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-6 w-20 rounded-full bg-slate-200" />
      </div>

      {/* Tengah */}
      <div className="flex-1 space-y-3">
        <div>
          <div className="h-3 w-28 rounded bg-slate-200 mb-3" />

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-5/6 rounded bg-slate-200" />
            <div className="h-4 w-2/3 rounded bg-slate-200" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2">
          <div className="h-3 w-20 rounded bg-red-200" />
          <div className="h-4 w-1/2 rounded bg-red-200" />
        </div>
      </div>

      {/* Kanan */}
      <div className="w-full lg:w-auto flex flex-row lg:flex-col gap-2">
        <div className="h-10 w-full lg:w-28 rounded-xl bg-slate-200" />
        <div className="h-10 w-full lg:w-28 rounded-xl bg-slate-200" />
        <div className="h-10 w-full lg:w-28 rounded-xl bg-slate-200" />
      </div>
    </div>
  ))
) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold bg-white border border-slate-200 rounded-3xl shadow-sm">
            Tidak ada laporan jurnal yang ditemukan.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between gap-6 transition-all hover:border-slate-300">
              
              {/* Kolom Kiri: Profil & Status */}
              <div className="w-full lg:w-1/4 space-y-2 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-4">
                <div className="flex items-center gap-2 font-black text-slate-800 text-base">
                  <User size={18} className="text-blue-500 shrink-0" />
                  <span className="truncate max-w-[180px]">{log.nama_siswa}</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  {new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="pt-1">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                    log.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    log.status === 'Ditolak' ? 'bg-red-50 text-red-600 border-red-200' :
                    'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {log.status === 'Pending' ? 'Menunggu' : log.status}
                  </span>
                </div>
              </div>

              {/* Kolom Tengah: Kegiatan & Kendala */}
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi Kegiatan</h4>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100 line-clamp-3">
                    {log.kegiatan}
                  </p>
                </div>
                
                {log.kendala && (
                  <div className="bg-red-50/50 border border-red-100 p-3 rounded-xl flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-0.5">Kendala</h4>
                      <p className="text-xs text-red-700 font-medium line-clamp-1">{log.kendala}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Aksi dengan Tombol Detail */}
              <div className="w-full lg:w-auto flex flex-row flex-wrap lg:flex-col gap-2 justify-center shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
                <Button 
                  onClick={() => openDetailModal(log)} 
                  variant="outline"
                  className="flex-1 lg:flex-initial border-blue-200 text-blue-600 hover:bg-blue-50 bg-white font-bold rounded-xl h-10 px-5 text-xs shadow-sm"
                >
                  <Eye size={15} className="mr-2"/> Detail
                </Button>
                <Button 
                  onClick={() => openActionModal("Disetujui", log)} 
                  disabled={log.status === 'Disetujui'}
                  className="flex-1 lg:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl h-10 px-5 text-xs shadow-sm shadow-emerald-500/10"
                >
                  <CheckCircle size={15} className="mr-2"/> Setujui
                </Button>
                <Button 
                  onClick={() => openActionModal("Ditolak", log)} 
                  disabled={log.status === 'Ditolak'}
                  variant="outline" 
                  className="flex-1 lg:flex-initial text-red-600 border-red-200 hover:bg-red-50 bg-white font-bold rounded-xl h-10 px-5 text-xs"
                >
                  <XCircle size={15} className="mr-2"/> Tolak
                </Button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ======================= MODAL DETAIL JURNAL ======================= */}
      {/* ======================= MODAL DETAIL JURNAL ======================= */}
      <JurnalDetailModal 
  isOpen={isDetailOpen} 
  onClose={() => setIsDetailOpen(false)} 
  jurnal={selectedJurnal} 
/>

      {/* ======================= MODAL KONFIRMASI AKSI ======================= */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="sm:max-w-md font-sans rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800">
              Konfirmasi Verifikasi Logbook
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleProcessAction} className="space-y-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
              <p>Siswa: <strong className="text-slate-800">{selectedJurnal?.nama_siswa}</strong></p>
              <p>Tanggal: <strong className="text-slate-800">{selectedJurnal?.tanggal}</strong></p>
              <p className="flex items-center gap-1 border-t border-slate-200 pt-1.5 mt-1.5">
                Tindakan: <strong className={`px-2 py-0.5 rounded-md ${actionType === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {actionType === 'Disetujui' ? 'Menyetujui Laporan' : 'Menolak & Minta Revisi'}
                </strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">
                Catatan / Masukan Guru {actionType === 'Ditolak' && <span className="text-red-500">*</span>}
              </label>
              <Textarea 
                placeholder={actionType === 'Disetujui' ? 'Bagus, pertahankan kerjamu! (Opsional)' : 'Tuliskan alasan penolakan atau bagian mana yang perlu diperbaiki...'}
                value={formCatatan} 
                onChange={(e) => setFormCatatan(e.target.value)} 
                className="rounded-xl bg-white min-h-[100px]"
                required={actionType === 'Ditolak'}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setIsActionModalOpen(false)} className="font-bold rounded-xl">Batal</Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className={`font-bold px-6 rounded-xl h-10 ${actionType === 'Disetujui' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
              >
                {isSubmitting ? "Memproses..." : `Ya, ${actionType === 'Disetujui' ? 'Setujui' : 'Tolak'}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}