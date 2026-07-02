"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { savePengaturan } from "./action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Edit2, Save, Eye, Monitor, FileText, Printer, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function PengaturanPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // State untuk mode edit
  const [lastUpdated, setLastUpdated] = useState('');

  // State Form
  const [namaSekolah, setNamaSekolah] = useState('');
  const [npsn, setNpsn] = useState('');
  const [kepalaSekolah, setKepalaSekolah] = useState('');
  const [email, setEmail] = useState('');
  const [telepon, setTelepon] = useState('');
  const [website, setWebsite] = useState('');
  const [alamat, setAlamat] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    async function loadPengaturan() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from('pengaturan').select('*').eq('id', 1).single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setNamaSekolah(data.nama_sekolah || '');
          setNpsn(data.npsn || '');
          setKepalaSekolah(data.kepala_sekolah || '');
          setEmail(data.email || '');
          setTelepon(data.telepon || '');
          setWebsite(data.website || '');
          setAlamat(data.alamat || '');
          setLogoUrl(data.logo_url || '');

          if (data.updated_at) {
            setLastUpdated(new Date(data.updated_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }));
          }
        }
      } catch (error) {
        toast.error("Gagal memuat pengaturan");
      } finally {
        setIsLoading(false);
      }
    }
    loadPengaturan();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Mengambil 1 file yang dipilih pengguna

    if (file) {
      // Mengubah file dokumen gambar menjadi URL lokal sementara
      const localUrl = URL.createObjectURL(file);
      setLogoUrl(localUrl);
    }
  };


  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await savePengaturan({
        nama_sekolah: namaSekolah, npsn, kepala_sekolah: kepalaSekolah, email, telepon, website, alamat, logo_url: logoUrl
      });

      if (!response.success) throw new Error(response.message);
      toast.success(response.message);
      setIsEditing(false); // Kunci form lagi setelah simpan
      setLastUpdated(new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }));
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">

      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Pengaturan Sekolah</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ========================================== */}
        {/* KOLOM KIRI: FORM INFORMASI SEKOLAH */}
        {/* ========================================== */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Settings size={18} className="text-cyan-500" />
              Informasi Sekolah
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full px-4">
                <Edit2 size={14} className="mr-2" /> Edit
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="rounded-full px-4 text-slate-500">
                Batal
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Logo Sekolah</label>
              <div className="flex items-center gap-4">
                {/* Kotak Pratinjau Gambar */}
                <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                  {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" />}
                </div>

                {/* Tombol Pilih File Gambar */}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={!isEditing}
                  className="flex-1 bg-slate-50 disabled:bg-slate-100 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                />
              </div>
            </div>


            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Nama Sekolah/Instansi</label>
              <Input placeholder="SMK Negeri 1 Surabaya" value={namaSekolah} onChange={(e) => setNamaSekolah(e.target.value)} disabled={!isEditing} required className="bg-slate-50 disabled:bg-slate-100" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Alamat Lengkap</label>
              <Textarea placeholder="Jl. SMEA No.4, Surabaya..." value={alamat} onChange={(e) => setAlamat(e.target.value)} disabled={!isEditing} rows={3} required className="bg-slate-50 disabled:bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Telepon</label>
                <Input placeholder="031-5678910" value={telepon} onChange={(e) => setTelepon(e.target.value)} disabled={!isEditing} required className="bg-slate-50 disabled:bg-slate-100" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Email</label>
                <Input type="email" placeholder="info@smkn1surabaya.sch.id" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEditing} required className="bg-slate-50 disabled:bg-slate-100" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Website</label>
              <Input placeholder="www.smkn1surabaya.sch.id" value={website} onChange={(e) => setWebsite(e.target.value)} disabled={!isEditing} className="bg-slate-50 disabled:bg-slate-100" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Kepala Sekolah</label>
              <Input placeholder="Nama Kepala Sekolah..." value={kepalaSekolah} onChange={(e) => setKepalaSekolah(e.target.value)} disabled={!isEditing} required className="bg-slate-50 disabled:bg-slate-100" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">NPSN</label>
              <Input placeholder="Nomor Pokok Sekolah Nasional" value={npsn} onChange={(e) => setNpsn(e.target.value)} disabled={!isEditing} required className="bg-slate-50 disabled:bg-slate-100" />
            </div>

            {isEditing && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-full">
                  <Save size={16} className="mr-2" /> {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            )}

            {!isEditing && lastUpdated && (
              <p className="text-xs text-slate-400 mt-4">Terakhir diperbarui: {lastUpdated}</p>
            )}

          </form>
        </div>

        {/* ========================================== */}
        {/* KOLOM KANAN: LIVE PREVIEW */}
        {/* ========================================== */}
        <div className="lg:col-span-5 space-y-6">

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
              <Eye size={18} className="text-blue-500" /> Preview Tampilan
            </h3>
            <p className="text-xs text-slate-500 mb-4">Pratinjau bagaimana informasi sekolah akan ditampilkan</p>

            <div className="space-y-4">
              {/* Preview 1: Dashboard Header */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-2 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Monitor size={14} /> Dashboard Header
                </div>
                <div className="p-4 bg-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-50 flex items-center justify-center">
                    {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300" />}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm leading-tight">{namaSekolah || 'Nama Sekolah'}</p>
                    <p className="text-[10px] text-slate-500">Sistem Informasi Magang</p>
                  </div>
                </div>
              </div>

              {/* Preview 2: Kop Surat / Sertifikat */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-2 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-500">
                  <FileText size={14} /> Header Export / Sertifikat
                </div>
                <div className="p-6 bg-white flex flex-col items-center text-center">
                  <h4 className="font-black text-slate-800 text-lg uppercase leading-tight mb-1">{namaSekolah || 'NAMA SEKOLAH'}</h4>
                  <p className="text-[10px] text-slate-600 max-w-[250px] leading-relaxed mb-2">{alamat || 'Alamat Lengkap Sekolah'}</p>
                  <p className="text-[9px] text-slate-500 space-x-2 mb-2">
                    <span>Telp: {telepon || '-'}</span>
                    <span>Email: {email || '-'}</span>
                  </p>
                  <div className="w-full border-t border-slate-300 mb-3"></div>
                  <p className="text-xs font-bold tracking-widest uppercase">Sertifikat Magang</p>
                </div>
              </div>


            </div>
          </div>

        </div>
      </div>
    </div>
  );
}