"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExportMagang } from "@/components/details/ExportMagang"; 
import { tinjauMagang, editMagangAktif, inputNilaiMagang } from "./action";
import { Search, FileSpreadsheet, Printer, Edit, Eye, Star, Building, Calendar, CheckCircle, XCircle, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

export default function MagangGuruPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<any[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");

  // Modal States
  const [modalType, setModalType] = useState<"tinjau" | "edit" | "nilai" | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [formStatus, setFormStatus] = useState("");
  const [namaGuru, setNamaGuru] = useState<string>("");
  const [formCatatan, setFormCatatan] = useState("");
  const [formTglMulai, setFormTglMulai] = useState("");
  const [formTglSelesai, setFormTglSelesai] = useState("");
  const [formNilai, setFormNilai] = useState<number | "">("");


  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // 1. Tarik Data Identitas Sekolah dari Pengaturan Admin
      const { data: schoolData } = await supabase.from('pengaturan').select('*').eq('id', 1).maybeSingle();
      if (schoolData) setSchoolProfile(schoolData);

      // 2. Tarik Data Siswa Magang khusus bimbingan Guru ini
      const { data: guruData } = await supabase.from('guru').select('id, users(nama_lengkap)').eq('user_id', user.id).single();
      
      if (guruData) {
        setNamaGuru(guruData.users?.[0]?.nama_lengkap);
        const { data: magang } = await supabase
        .from('magang')
        .select('*, siswa(users(nama_lengkap),  nis), dudi(nama_perusahaan)')
        .eq('guru_id', guruData.id)
        .order('created_at', { ascending: false });
        
        setLogs(magang || []);
      }
    } catch (error) {
      toast.error("Gagal sinkronisasi data database");
    } {
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


  const openModal = (type: "tinjau" | "edit" | "nilai", item: any) => {
    setSelectedItem(item);
    setModalType(type);
    if (type === 'tinjau') { setFormStatus("Aktif"); setFormCatatan(""); }
    if (type === 'edit') { setFormTglMulai(item.tanggal_mulai || ""); setFormTglSelesai(item.tanggal_selesai || ""); setFormStatus(item.status); }
    if (type === 'nilai') { setFormNilai(item.nilai_akhir || ""); }
  };

  const handleSubmitTinjau = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await tinjauMagang(selectedItem.id, selectedItem.siswa_id, formStatus, formCatatan, userId);
    if (res.success) { toast.success(res.message); setModalType(null); fetchData(); } else { toast.error(res.message); }
    setIsSubmitting(false);
  };

  const handleSubmitEdit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await editMagangAktif(selectedItem.id, formTglMulai, formTglSelesai, formStatus, userId);
    if (res.success) { toast.success(res.message); setModalType(null); fetchData(); } else { toast.error(res.message); }
    setIsSubmitting(false);
  };

  const handleSubmitNilai = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formNilai === "" || Number(formNilai) < 0 || Number(formNilai) > 100) return toast.error("Skala nilai valid 0 - 100");
    setIsSubmitting(true);
    const res = await inputNilaiMagang(selectedItem.id, Number(formNilai), userId);
    if (res.success) { toast.success(res.message); setModalType(null); fetchData(); } else { toast.error(res.message); }
    setIsSubmitting(false);
  };

  const filteredLogs = logs.filter((m) => {
    const siswaName = m.siswa?.users?.nama_lengkap?.toLowerCase() || "";
    const dudiName = m.dudi?.nama_perusahaan?.toLowerCase() || "";
    const matchesSearch = siswaName.includes(debounceSearch.toLowerCase()) || dudiName.includes(debounceSearch.toLowerCase());
    const matchesStatus = statusFilter === "Semua Status" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const magangAktif = logs.filter(m => m.status === 'Aktif').length;
  const magangPending = logs.filter(m => m.status === 'Pending').length;

  const magangDinilai = logs.filter(m => m.nilai_akhir && m.nilai_akhir > 0);
  const rataRataNilai = magangDinilai.length > 0 
    ? (magangDinilai.reduce((total, m) => total + m.nilai_akhir, 0) / magangDinilai.length).toFixed(1) 
    : "-";

  return (
    <div className="space-y-6 font-sans">
      
      
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Magang Siswa</h2>
            <p className="text-slate-500 text-sm mt-1">Kelola status dan input nilai akhir siswa bimbingan Anda</p>
          </div>
          <ExportMagang data={filteredLogs} schoolProfile={schoolProfile} namaGuru={namaGuru}/>
        </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Magang Aktif", val: magangAktif, color: "text-blue-600", icon: <CheckCircle size={18} /> },
            { label: "Menunggu", val: magangPending, color: "text-amber-600", icon: <Clock size={18} /> },
            { label: "Rata Nilai", val: rataRataNilai, color: "text-purple-600", icon: <Star size={18} /> },
          ].map((item, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${item.color}`}>
                  {item.icon} {item.label}
              </div>
              <h3 className="text-3xl font-black text-slate-800">{item.val}</h3>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Cari siswa atau tempat magang..." className="pl-9 bg-slate-50 border-slate-200 rounded-full h-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-slate-50 border-slate-200 rounded-full h-10">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua Status">Semua Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Selesai">Selesai</SelectItem>
                <SelectItem value="Batal">Batal</SelectItem>
                <SelectItem value="Ditolak">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6">Siswa & DUDI</th>
                  <th className="p-4">Periode Magang</th>
                  <th className="p-4 text-center">Nilai</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
    Array.from({ length: 5 }).map((_, index) => (
      <tr key={index} className="animate-pulse border-b border-slate-100">
        {/* Siswa */}
        <td className="p-4 pl-6">
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="h-6 w-32 rounded-md bg-slate-200" />
          </div>
        </td>

        {/* Tanggal */}
        <td className="p-4">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-200" />
          </div>
        </td>

        {/* Nilai */}
        <td className="p-4">
          <div className="flex justify-center">
            <div className="h-9 w-9 rounded-full bg-slate-200" />
          </div>
        </td>

        {/* Status */}
        <td className="p-4">
          <div className="h-6 w-20 rounded-full bg-slate-200" />
        </td>

        {/* Aksi */}
        <td className="p-4">
          <div className="flex justify-center">
            <div className="h-8 w-24 rounded-xl bg-slate-200" />
          </div>
        </td>
      </tr>
    ))
  ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-medium">Tidak ada data penempatan siswa.</td></tr>
                ) : (
                  filteredLogs.map(m => {

                    return (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-black text-slate-800">{m.siswa?.users?.nama_lengkap || '-'}</p>
                        <p className="text-[10px] text-slate-400 font-bold">NIS: {m.siswa?.nis || '-'}</p>
                        <p className="text-xs font-semibold text-blue-600 flex items-center gap-1.5 bg-blue-50 w-max px-2.5 py-1 rounded-md mt-1"><Building size={12}/> {m.dudi?.nama_perusahaan || '-'}</p>
                      </td>
                      <td className="p-4">
                        {m.tanggal_mulai ? (
                          <div className="text-xs font-semibold text-slate-600 space-y-0.5">
                            <p>{m.tanggal_mulai}</p>
                            <p>{m.tanggal_selesai}</p>
                          </div>
                        ) : <span className="text-xs text-slate-400 italic">Belum disetting</span>}
                      </td>
                      <td className="p-4 text-center">
                        {m.nilai_akhir ? <span className="inline-flex items-center justify-center w-9 h-9 bg-emerald-50 text-emerald-700 font-black text-sm rounded-full border border-emerald-200">{m.nilai_akhir}</span> : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase ${m.status === 'Aktif' ? 'bg-blue-50 text-blue-600 border-blue-200' : m.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : m.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{m.status}</span>
                      </td>
                      <td className="p-4 text-center">
                        {m.status === 'Pending' && <Button onClick={() => openModal('tinjau', m)} size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-4 font-bold h-8 text-xs shadow-sm shadow-amber-500/10"><Eye size={14} className="mr-1"/> Tinjau</Button>}
                        {m.status === 'Aktif' && <Button onClick={() => openModal('edit', m)} size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl px-4 font-bold h-8 text-xs"><Edit size={14} className="mr-1"/> Edit Data</Button>}
                        {m.status === 'Selesai' && <Button onClick={() => openModal('nilai', m)} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-4 font-bold h-8 text-xs shadow-sm shadow-emerald-500/10"><Star size={14} className="mr-1"/> Input Nilai</Button>}
                        {(m.status === 'Batal' || m.status === 'Ditolak') && <span className="text-xs text-slate-400 font-bold italic">Arsip Terkunci</span>}
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      <Dialog open={modalType !== null} onOpenChange={(open) => { if(!open) setModalType(null) }}>
        <DialogContent className="sm:max-w-md font-sans rounded-3xl">
          
          {/* MODAL TINJAU (PENDING) */}
          {modalType === 'tinjau' && (
            <>
              <DialogHeader><DialogTitle className="text-xl font-black text-slate-800">Tinjau Pengajuan</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmitTinjau} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-800">{selectedItem?.siswa?.users?.nama_lengkap || '-'}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5"><Building size={14}/> {selectedItem?.dudi?.nama_perusahaan || '-'}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Keputusan Anda</label>
                  <Select value={formStatus} onValueChange={setFormStatus} required>
                    <SelectTrigger className="w-full bg-white rounded-xl h-10"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Terima & Setujui (Aktif)</SelectItem>
                      <SelectItem value="Ditolak">Tolak Pengajuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formStatus === 'Ditolak' && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Alasan Penolakan</label>
                    <Textarea value={formCatatan} onChange={(e)=>setFormCatatan(e.target.value)} placeholder="Tulis alasan penolakan..." className="rounded-xl bg-white" required />
                  </div>
                )}
                <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 mt-4">{isSubmitting ? "Menyimpan..." : "Simpan Keputusan"}</Button>
              </form>
            </>
          )}

          {/* MODAL EDIT (AKTIF) */}
          {modalType === 'edit' && (
            <>
              <DialogHeader><DialogTitle className="text-xl font-black text-slate-800">Edit Data Magang Aktif</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmitEdit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Tgl Mulai</label>
                    <Input type="date" value={formTglMulai} onChange={(e)=>setFormTglMulai(e.target.value)} className="bg-white rounded-xl" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Tgl Selesai</label>
                    <Input type="date" value={formTglSelesai} onChange={(e)=>setFormTglSelesai(e.target.value)} className="bg-white rounded-xl" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Ubah Status Magang</label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger className="w-full bg-white rounded-xl h-10"><SelectValue placeholder="Pilih Status..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Tetap Berlangsung (Aktif)</SelectItem>
                      <SelectItem value="Selesai">Tandai Selesai (Lulus)</SelectItem>
                      <SelectItem value="Batal">Batalkan Magang</SelectItem>
                    </SelectContent>
                  </Select>
                  {formStatus !== 'Aktif' && (
                    <p className="text-[11px] font-bold text-red-500 mt-1.5 bg-red-50 p-2 rounded-lg">⚠️ Jika status diubah ke Selesai/Batal, data akan dikunci permanen.</p>
                  )}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 mt-2">{isSubmitting ? "Memperbarui..." : "Perbarui Data"}</Button>
              </form>
            </>
          )}

          {/* MODAL INPUT NILAI (SELESAI) */}
          {modalType === 'nilai' && (
            <>
              <DialogHeader><DialogTitle className="text-xl font-black text-slate-800">Input Nilai Akhir</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmitNilai} className="space-y-6">
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm shrink-0"><CheckCircle size={24}/></div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{selectedItem?.siswa?.users?.nama_lengkap || '-'}</p>
                    <p className="text-[11px] font-bold text-emerald-700 mt-0.5 uppercase tracking-wider">{selectedItem?.dudi?.nama_perusahaan || '-'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 text-center block">Masukkan Nilai Skala 0 - 100</label>
                  <Input type="number" min="0" max="100" value={formNilai} onChange={(e)=>setFormNilai(Number(e.target.value))} placeholder="Contoh: 85" className="text-3xl font-black h-16 text-center text-emerald-600 bg-white border-2 border-emerald-100 focus-visible:ring-emerald-500 rounded-2xl" required />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl h-11">{isSubmitting ? "Menyimpan..." : "Simpan Nilai Akhir"}</Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
      
    </div>
  );
}