"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { daftarMagang } from "./action";
import { Clock, Building, User, Calendar, CheckCircle2, Search, Send, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import toast from "react-hot-toast";

export default function MagangSiswaPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"status" | "cari">("status");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Modal Daftar
  const [isDaftarModalOpen, setIsDaftarModalOpen] = useState(false);
  const [selectedDudi, setSelectedDudi] = useState<any>(null);
  
  // FIX 1: Nilai awal untuk Select TIDAK BOLEH string kosong "" jika dipakai sbg value yang di-control
  const [selectedGuru, setSelectedGuru] = useState<string>("placeholder"); 

  // State Data
  const [currentSiswa, setCurrentSiswa] = useState<any>(null);
  const [myMagangList, setMyMagangList] = useState<any[]>([]);
  const [allDudiList, setAllDudiList] = useState<any[]>([]);
  const [optGuru, setOptGuru] = useState<any[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: siswaData } = await supabase.from('siswa').select('*, users(nama_lengkap), jurusan(nama_jurusan)').eq('user_id', user.id).single();
      if (siswaData) setCurrentSiswa(siswaData);

      if (siswaData) {
        const { data: magangData } = await supabase
          .from('magang')
          .select('*, dudi(nama_perusahaan, alamat, telepon), guru(users(nama_lengkap), nip)')
          .eq('siswa_id', siswaData.id)
          .order('created_at', { ascending: false });
        setMyMagangList(magangData || []);
      }

      // Ambil daftar DUDI & Guru Aktif secara paralel
      const [resDudi, resGuru] = await Promise.all([
        supabase.from('dudi').select('*').eq('status', 'Aktif'),
        supabase.from('guru').select('id, users(nama_lengkap)').eq('status', 'Aktif')
      ]);

      setAllDudiList(resDudi.data || []);
      setOptGuru(resGuru.data || []);

    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Buka Modal Daftar
  const handleOpenModal = (dudi: any) => {
    setSelectedDudi(dudi);
    setSelectedGuru("placeholder"); // FIX 1: Reset ke nilai pengaman
    setIsDaftarModalOpen(true);
  };

  // Proses Submit Pendaftaran
  const handleDaftarSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentSiswa || !selectedDudi || selectedGuru === "placeholder") {
      toast.error("Pastikan semua form (termasuk guru pembimbing) terisi!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await daftarMagang(currentSiswa.id, selectedDudi.id, Number(selectedGuru));
      if (!response.success) throw new Error(response.message);
      
      toast.success(response.message);
      setIsDaftarModalOpen(false);
      fetchData(); 
      setActiveTab("status"); 
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kalkulasi Status
  const pendingCount = myMagangList.filter(m => m.status === 'Pending').length;
  // Cari yang statusnya Aktif. Kalau gak ada, baru cari yang Selesai.
  const activeMagang = myMagangList.find(m => m.status === 'Aktif') || myMagangList.find(m => m.status === 'Selesai');
  
  const isAlreadyApplied = (dudiId: number) => {
    return myMagangList.some(m => m.dudi_id === dudiId && (m.status === 'Pending' || m.status === 'Aktif'));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (isLoading) return <div className="flex h-[70vh] items-center justify-center text-slate-500 font-bold">Memuat Data Magang...</div>;

  return (
    <div className="space-y-6 font-sans">
      
      {/* BANNER BIRU */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl p-8 text-white shadow-md">
        <h2 className="text-3xl font-black tracking-tight mb-2">Magang Siswa</h2>
        <p className="opacity-90 font-medium">Cari tempat magang dan pantau status pendaftaran Anda</p>
      </div>

      {/* CUSTOM TABS */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab("status")} 
          className={`flex items-center gap-2 pb-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === "status" ? "border-cyan-500 text-cyan-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Clock size={16} /> Status Magang Saya
        </button>
        <button 
          onClick={() => setActiveTab("cari")} 
          className={`flex items-center gap-2 pb-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === "cari" ? "border-cyan-500 text-cyan-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Search size={16} /> Cari Tempat Magang
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: STATUS MAGANG SAYA */}
      {/* ========================================== */}
      {activeTab === "status" && (
        <div className="space-y-6 max-w-4xl">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-slate-800">{currentSiswa?.users?.nama_lengkap} • {currentSiswa?.nis}</h3>
              <p className="text-sm text-slate-500 mt-1">{currentSiswa?.kelas} • {currentSiswa?.jurusan.nama_jurusan}</p>
            </div>
            <div className="text-right">
              <h3 className="text-2xl font-black text-cyan-600">{pendingCount}/3</h3>
              <p className="text-xs font-bold text-slate-400">Pendaftaran Pending</p>
            </div>
          </div>

          {/* KONDISI 1: ADA MAGANG AKTIF / SELESAI */}
          {activeMagang && (activeMagang.status === 'Aktif' || activeMagang.status === 'Selesai') ? (
            <div className={`${activeMagang.status === 'Aktif' ? 'bg-emerald-50 border-emerald-200' : 'bg-purple-50 border-purple-200'} rounded-3xl border shadow-sm overflow-hidden`}>
              <div className={`p-4 border-b ${activeMagang.status === 'Aktif' ? 'border-emerald-200 bg-emerald-100/50' : 'border-purple-200 bg-purple-100/50'} flex justify-between items-center`}>
                <div className={`flex items-center gap-2 font-bold ${activeMagang.status === 'Aktif' ? 'text-emerald-700' : 'text-purple-700'}`}>
                  <CheckCircle2 size={18} /> Detail Magang {activeMagang.status === 'Aktif' ? 'Aktif' : 'Selesai'}
                </div>
                <span className={`px-3 py-1 text-white text-xs font-bold rounded-full ${activeMagang.status === 'Aktif' ? 'bg-emerald-500' : 'bg-purple-500'}`}>
                  {activeMagang.status === 'Aktif' ? 'Berlangsung' : 'Selesai'}
                </span>
              </div>
              
              <div className="p-6 space-y-4">
                <div className={`bg-white p-4 rounded-2xl border ${activeMagang.status === 'Aktif' ? 'border-emerald-100' : 'border-purple-100'}`}>
                  <div className={`flex items-center gap-2 mb-2 ${activeMagang.status === 'Aktif' ? 'text-emerald-600' : 'text-purple-600'}`}>
                    <User size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Data Siswa</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[10px] font-bold text-slate-400">NAMA LENGKAP</p><p className="font-bold text-slate-800">{currentSiswa?.users?.nama_lengkap}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-400">NIS</p><p className="font-bold text-slate-800">{currentSiswa?.nis}</p></div>
                  </div>
                </div>

                <div className={`bg-white p-4 rounded-2xl border ${activeMagang.status === 'Aktif' ? 'border-emerald-100' : 'border-purple-100'}`}>
                  <div className={`flex items-center gap-2 mb-2 ${activeMagang.status === 'Aktif' ? 'text-emerald-600' : 'text-purple-600'}`}>
                    <Building size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Tempat Magang</span>
                  </div>
                  <h4 className="font-black text-slate-800">{activeMagang.dudi?.nama_perusahaan}</h4>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2"><span className="text-slate-400">📍</span> {activeMagang.dudi?.alamat}</p>
                </div>

                <div className={`bg-white p-4 rounded-2xl border ${activeMagang.status === 'Aktif' ? 'border-emerald-100' : 'border-purple-100'}`}>
                  <div className={`flex items-center gap-2 mb-2 ${activeMagang.status === 'Aktif' ? 'text-emerald-600' : 'text-purple-600'}`}>
                    <GraduationCap size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Guru Pembimbing</span>
                  </div>
                  <h4 className="font-black text-slate-800">{activeMagang.guru?.users?.nama_lengkap}</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`bg-white p-4 rounded-2xl border ${activeMagang.status === 'Aktif' ? 'border-emerald-100' : 'border-purple-100'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${activeMagang.status === 'Aktif' ? 'text-emerald-600' : 'text-purple-600'}`}>
                      <Calendar size={14} /> <span className="text-xs font-bold uppercase tracking-wider">Tanggal Mulai</span>
                    </div>
                    <p className="font-bold text-slate-800">{formatDate(activeMagang.tanggal_mulai)}</p>
                  </div>
                  <div className={`bg-white p-4 rounded-2xl border ${activeMagang.status === 'Aktif' ? 'border-emerald-100' : 'border-purple-100'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${activeMagang.status === 'Aktif' ? 'text-emerald-600' : 'text-purple-600'}`}>
                      <Calendar size={14} /> <span className="text-xs font-bold uppercase tracking-wider">Tanggal Selesai</span>
                    </div>
                    <p className="font-bold text-slate-800">{formatDate(activeMagang.tanggal_selesai)}</p>
                  </div>
                </div>

                {activeMagang.status === 'Selesai' && activeMagang.nilai_akhir && (
                  <div className="bg-white p-4 rounded-2xl border border-purple-100 text-center">
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Nilai Akhir Magang</p>
                    <p className="text-4xl font-black text-purple-900">{activeMagang.nilai_akhir}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // KONDISI 2: RIWAYAT PENDAFTARAN (Jika tidak ada yang Aktif)
            <div>
              <h3 className="font-bold text-slate-800 mb-4">Riwayat Pendaftaran & Penolakan</h3>
              <div className="space-y-4">
                {myMagangList.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 rounded-3xl border border-slate-200 text-slate-400 text-sm font-medium">
                    Anda belum mendaftar ke tempat magang manapun.
                  </div>
                ) : (
                  myMagangList.map((m) => (
                    <div key={m.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1.5">
                        <h4 className="font-black text-slate-800 text-lg leading-tight">{m.dudi?.nama_perusahaan}</h4>
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><span className="text-slate-400">📍</span> {m.dudi?.alamat}</p>
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><span className="text-slate-400">👤</span> Pembimbing: {m.guru?.users?.nama_lengkap}</p>
                      </div>
                      <div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                          m.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          m.status === 'Selesai' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: CARI TEMPAT MAGANG */}
      {/* ========================================== */}
      {activeTab === "cari" && (
        <div className="space-y-4 max-w-4xl">
          {allDudiList.map((dudi) => {
            const isApplied = isAlreadyApplied(dudi.id);

            return (
              <div key={dudi.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-1.5">
                  <h4 className="font-black text-slate-800 text-lg">{dudi.nama_perusahaan}</h4>
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><span className="text-slate-400">📍</span> {dudi.alamat}</p>
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><span className="text-slate-400">📞</span> {dudi.telepon}</p>
                </div>
                
                <div className="w-full sm:w-auto flex items-center min-w-[200px]">
                  {activeMagang ? (
                    <div className="w-full py-2.5 px-4 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl text-center text-xs font-bold">
                      Anda sudah magang
                    </div>
                  ) : isApplied ? (
                    <div className="w-full py-2.5 px-4 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                      <Clock size={14} /> Menunggu Verifikasi
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleOpenModal(dudi)} 
                      disabled={pendingCount >= 3}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl h-10 shadow-md shadow-cyan-500/20"
                    >
                      <Send size={16} className="mr-2" /> Ajukan Ke Sini
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL PILIH GURU PEMBIMBING */}
      {/* ========================================== */}
      <Dialog open={isDaftarModalOpen} onOpenChange={setIsDaftarModalOpen}>
        <DialogContent className="sm:max-w-md font-sans rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800">
              Pengajuan Tempat Magang
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleDaftarSubmit} className="space-y-6 pt-2">
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Perusahaan Tujuan</p>
              <p className="text-lg font-black text-slate-800 leading-tight">{selectedDudi?.nama_perusahaan}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Pilih Guru Pembimbing</label>
              
              <Select value={selectedGuru} onValueChange={setSelectedGuru} required>
                <SelectTrigger className="w-full h-11 rounded-xl bg-white">
                  <SelectValue placeholder="Pilih Guru Pembimbing..." />
                </SelectTrigger>
                <SelectContent>
                  {/* FIX 2: Tambahkan opsi placeholder yang nilainya "placeholder" lalu di-disable */}
                  <SelectItem value="placeholder" disabled className="text-slate-400">-- Pilih Guru Pembimbing --</SelectItem>
                  {optGuru.length === 0 ? (
                    <SelectItem value="empty" disabled>Tidak ada guru aktif</SelectItem>
                  ) : (
                    optGuru.map(g => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.users.nama_lengkap}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                Pilih guru yang akan membimbing dan memantau jurnal harian Anda selama di perusahaan ini.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setIsDaftarModalOpen(false)} className="font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || selectedGuru === "placeholder"} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6 rounded-xl shadow-md shadow-cyan-500/20">
                {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}