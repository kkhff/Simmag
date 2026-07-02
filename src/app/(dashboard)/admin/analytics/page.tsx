"use client";

import { useEffect, useState } from "react";
import { getAnalyticsData } from "./action";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from "recharts";
import { Users, Building2, ClipboardCopy, Percent, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchStats = async () => {
    setLoading(true);
    const res = await getAnalyticsData();
    if (res.success) {
      setData(res);
    } else {
      toast.error("Gagal menyegarkan data grafik");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <div className="text-center p-20 font-bold text-slate-500 animate-pulse">Memuat Analitik Database SIMMAG...</div>;

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800">Analitik Sistem SIMMAG</h2>
          <p className="text-xs text-slate-500 mt-0.5">Pantau data operasional magang secara real-time</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-xl transition-all border border-slate-200">
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Siswa Aktif", val: data?.cards.siswaAktif, color: "text-blue-600", icon: <Users /> },
                { label: "Mitra DUDI", val: data?.cards.totalDudi, color: "text-emerald-600", icon: <Building2 /> },
                { label: "Pending Approval", val: data?.cards.pendingMagang, color: "text-amber-600", icon: <ClipboardCopy /> },
                { label: "Absensi Hari Ini", val: data?.cards.rasioPresensi, color: "text-purple-600", icon: <Percent /> },
              ].map((item, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${item.color}`}>
                    {item.icon} {item.label}
                  </div>
                  <h3 className="text-3xl font-black text-slate-800">{item.val}</h3>
                </div>
              ))}
            </div>
      

      {/* 4 GRID CARDS STATS (Bagian Atas) */}
      

      {/* CHARTS GRAPHICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 📊 BAR CHART: Jurnal vs Presensi (Mengambil 2 Kolom Grid) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <h4 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">Kinerja Bulanan (Presensi vs Logbook)</h4>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Presensi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Jurnal Disetujui" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🍕 PIE CHART: Distribusi Siswa Per Jurusan (Mengambil 1 Kolom Grid) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">Distribusi Siswa Per Jurusan</h4>
          <div className="h-64 w-full text-xs relative flex items-center justify-center">
            {data?.pieData.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Belum ada siswa di jurusan aktif magang</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                    {data?.pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 📈 LINE CHART: Tren Aktivitas Mingguan (Lebar Penuh di Bawah) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3">
          <h4 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">Tren Aktivitas Sistem (Mingguan)</h4>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} />
                <YAxis tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Jurnal" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="LogAktivitas" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}