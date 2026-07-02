"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clearAllLogs } from "./action";
import { Search, Trash2, Clock, PlusCircle, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function ActivityLogsPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // State Filter
  const [search, setSearch] = useState("");
  const [debounceSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [entityFilter, setEntityFilter] = useState("All Entities");

  const fetchLogs = async () => {
    setIsLoading(true);
    // Sihir Join: Tarik data log sekaligus nama_lengkap dari tabel users
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        users (nama_lengkap)
      `)
      .order('created_at', { ascending: false });
    
    if (error) toast.error("Gagal memuat log");
    else setLogs(data || []);
    setIsLoading(false);
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchLogs(); }, []);

  // Hitung Summary Cards
  const total = logs.length;
  const created = logs.filter(l => l.aksi === 'Created').length;
  const updated = logs.filter(l => l.aksi === 'Updated').length;
  const deleted = logs.filter(l => l.aksi === 'Deleted').length;

  // Filter Data
  const filteredLogs = logs.filter(l => {
    const matchSearch = l.deskripsi.toLowerCase().includes(debounceSearch.toLowerCase());
    const matchAction = actionFilter === "All Actions" || l.aksi === actionFilter;
        const matchEntity = entityFilter === "All Entities" || l.entities === entityFilter; 
    
    return matchSearch && matchAction && matchEntity;
  });

  const handleClearLogs = async () => {
    const result = await Swal.fire({
      title: 'Kosongkan Log?',
      text: "Semua riwayat aktivitas sistem akan dihapus permanen dan tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Kosongkan!',
      cancelButtonText: 'Batal',
      customClass: { popup: 'font-sans' }
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);
        const response = await clearAllLogs();
        if (!response.success) throw new Error(response.message);
        
        toast.success(response.message);
        fetchLogs(); // Refresh data biar langsung kosong di UI
      } catch (error: any) {
        toast.error("Gagal menghapus log: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 font-sans p-6">
      <h2 className="text-3xl font-black text-slate-800">Activity Logs</h2>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Logs", val: total, color: "text-slate-800" },
          { label: "Created", val: created, color: "text-emerald-600" },
          { label: "Updated", val: updated, color: "text-blue-600" },
          { label: "Deleted", val: deleted, color: "text-red-600" },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase">{item.label}</p>
            <h3 className={`text-4xl font-black ${item.color} mt-2`}>{item.val}</h3>
          </div>
        ))}
      </div>

      {/* FILTERS */}
<div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center w-full">
  
  {/* 📐 Bagian Pencarian & Dropdown: Pake grid di mobile biar gak sempit */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
    
    {/* Input Search */}
    <div className="relative w-full">
      <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
      <Input 
        placeholder="Search logs..." 
        className="pl-10 h-10 rounded-xl" 
        onChange={(e) => setSearch(e.target.value)} 
      />
    </div>

    {/* Filter Action */}
    <Select onValueChange={setActionFilter}>
      <SelectTrigger className="w-full h-10 rounded-xl">
        <SelectValue placeholder="All Actions" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All Actions">All Actions</SelectItem>
        <SelectItem value="Created">Created</SelectItem>
        <SelectItem value="Updated">Updated</SelectItem>
        <SelectItem value="Deleted">Deleted</SelectItem>
      </SelectContent>
    </Select>

    {/* Filter Entity */}
    <Select onValueChange={setEntityFilter}>
      <SelectTrigger className="w-full h-10 rounded-xl">
        <SelectValue placeholder="All Entities" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All Entities">All Entities</SelectItem>
        <SelectItem value="User">User</SelectItem>
        <SelectItem value="Dudi">DUDI</SelectItem>
        <SelectItem value="Magang">Magang</SelectItem>
        <SelectItem value="Logbook">Logbook</SelectItem>
        <SelectItem value="Activity">Activity</SelectItem>
        <SelectItem value="Settings">Settings</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* 🚨 Tombol Clear Logs: Di mobile lebar penuh, di laptop pas sesuai konten */}
  <Button 
    variant="destructive" 
    onClick={handleClearLogs} 
    disabled={isLoading || logs.length === 0}
    className="rounded-xl px-5 font-bold h-10 w-full lg:w-auto shrink-0"
  >
    <Trash2 size={16} className="mr-2 shrink-0" /> Clear Logs
  </Button>
</div>

      {/* TIMELINE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-4">Activity Timeline</h3>
        { isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-4 p-4 border-b border-slate-100 items-center animate-pulse">
              
              {/* Skeleton Kotak Ikon Kiri */}
              <div className="h-9 w-9 rounded-lg bg-slate-200 shrink-0" />
              
              {/* Skeleton Baris Teks Kanan */}
              <div className="space-y-2 w-full">
                {/* Judul Deskripsi Log */}
                <div className="h-4 w-3/4 max-w-[400px] rounded bg-slate-200" />
                {/* Meta Data (Entity, Nama, Tanggal) */}
                <div className="h-3 w-1/2 max-w-[250px] rounded bg-slate-200" />
              </div>
              
            </div>
          ))
        ) :
        filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No logs found.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-4 p-4 border-b border-slate-100 items-center">
              <div className={`p-2 rounded-lg ${log.aksi === 'Created' ? 'bg-emerald-50 text-emerald-600' : log.aksi === 'Updated' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                 {log.aksi === 'Created' ? <PlusCircle size={20}/> : log.aksi === 'Updated' ? <Pencil size={20}/> : <Trash size={20}/>}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{log.deskripsi}</p>
                <p>
                  <span className="text-xs font-bold text-slate-500 uppercase ">[{log.entities}] </span> 
                  <span className="text-xs text-slate-400">{log.users?.nama_lengkap || "Unknown Admin"} • {new Date(log.created_at).toLocaleString()}</span>
                </p>
                
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}