"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Printer } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportButtonsProps {
  data: any[];
  schoolProfile?: any;
  namaGuru?: string; // <-- 1. Tambahkan prop baru di sini
}

export function ExportMagang({ data, schoolProfile, namaGuru }: ExportButtonsProps) {
  
  // =====================
  // EXPORT EXCEL (XLSX)
  // =====================
 const exportToExcel = () => {
  const worksheetData = XLSX.utils.aoa_to_sheet([]);

// Judul di A1
XLSX.utils.sheet_add_aoa(
  worksheetData,
  [[
    namaGuru === "Admin"
      ? `Laporan Data Magang - Pencetak: ${namaGuru}`
      : `Laporan Data Magang - Guru Pembimbing: ${namaGuru}`
  ]],
  { origin: "A1" }
);

// Data mulai A3
XLSX.utils.sheet_add_json(
  worksheetData,
  data.map((v) => {
    if (namaGuru === "Admin") {
      return {
        "NIS": v.siswa?.nis || "-",
        "Nama Siswa": v.nama_siswa_cache || "-",
        "Guru Pembimbing": v.nama_guru_cache || "-",
        "Perusahaan Mitra": v.nama_dudi_cache || "-",
        "Tanggal Mulai": v.tanggal_mulai || "-",
        "Tanggal Selesai": v.tanggal_selesai || "-",
        "Status": v.status,
        "Nilai Akhir": v.nilai_akhir || "-"
      };
    }

    return {
      "NIS": v.siswa?.nis || "-",
      "Nama Siswa": v.nama_siswa_cache || "-",
      "Perusahaan Mitra": v.nama_dudi_cache || "-",
      "Tanggal Mulai": v.tanggal_mulai || "-",
      "Tanggal Selesai": v.tanggal_selesai || "-",
      "Status": v.status,
      "Nilai Akhir": v.nilai_akhir || "-"
    };
  }),
  {
    origin: "A3"
  }
);

  const lastCol = namaGuru === "Admin" ? 7 : 6;

worksheetData["!merges"] = [
  {
    s: { r: 0, c: 0 },
    e: { r: 0, c: lastCol }
  }
];

  // Mengambil judul kolom (key) dari baris pertama data
  const objectKeys = Object.keys(worksheetData).filter(key => !key.startsWith('!'));
  
  // Membuat penampung lebar maksimum tiap kolom
  const colWidths: Record<string, number> = {};
  
  // Mencari teks paling panjang di setiap kolom untuk menentukan lebarnya
  objectKeys.forEach(key => {
    const colName = key.replace(/[0-9]/g, ''); // Mengambil huruf kolom (A, B, C, dst)
    const cellValue = worksheetData[key].v ? worksheetData[key].v.toString() : '';
    
    // Simpan yang paling panjang (ditambah sedikit padding/jarak aman agar tidak mepet)
    if (!colWidths[colName] || cellValue.length > colWidths[colName]) {
      colWidths[colName] = Math.max(cellValue.length + 3, 10); // minimal lebar 10
    }
  });

  // Pasang pengaturan lebar kolom ke worksheet data
  worksheetData['!cols'] = Object.keys(colWidths).map(col => ({ wch: colWidths[col] }));

  // Proses pembuatan file seperti biasa
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheetData, "Data Magang");
  XLSX.writeFile(workbook, `Data_Magang_${new Date().toISOString().slice(0, 10)}.xlsx`);
};


  // =====================
  // EXPORT PDF (JSPDF)
  // =====================
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // --- 1. KOP SURAT ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(schoolProfile?.nama_sekolah?.toUpperCase() || "NAMA INSTANSI SEKOLAH", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(schoolProfile?.alamat || "Alamat Instansi Lengkap", 105, 20, { align: "center" });
    doc.text(`Telp: ${schoolProfile?.telepon || '-'} | Web: ${schoolProfile?.website || '-'}`, 105, 25, { align: "center" });
    
    // Garis Bawah Kop
    doc.setLineWidth(0.5);
    doc.line(14, 28, 196, 28);

    // --- 2. JUDUL DOKUMEN ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN DATA PENEMPATAN MAGANG", 105, 38, { align: "center" });
    
    // --- DIUBAH DI SINI ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (namaGuru === "Admin") {
      doc.text(`Dicetak oleh: ${namaGuru}`, 105, 44, { align: "center" });
    } else {
      doc.text(`Guru Pembimbing: ${namaGuru || '-'}`, 105, 44, { align: "center" });
    }

    // --- 3. TABEL DATA ---
    if (namaGuru === "Admin") {
      autoTable(doc, {
        startY: 50, // Diturunkan sedikit dari 45 agar tidak menabrak baris Guru Pembimbing
        head: [["NIS", "Nama Siswa", "Guru Pembimbing", "Tempat Magang", "Tgl Mulai", "Tgl Selesai", "Status", "Nilai"]],
        body: data.map((v) => {
          return [
          v.siswa?.nis || '-',
          v.nama_siswa_cache || '-',
          v.nama_guru_cache || '-',
          v.nama_dudi_cache || '-',
          v.tanggal_mulai || "-",
          v.tanggal_selesai || "-",
          v.status,
          v.nilai_akhir || "-"
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], halign: 'center' },
      styles: { fontSize: 8 },
      columnStyles: { 0: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' } }
    }
    );
  } else {
    autoTable(doc, {
        startY: 50, // Diturunkan sedikit dari 45 agar tidak menabrak baris Guru Pembimbing
        head: [["NIS", "Nama Siswa", "Tempat Magang", "Tgl Mulai", "Tgl Selesai", "Status", "Nilai"]],
        body: data.map((v) => {
          return [
          v.siswa?.nis || '-',
          v.nama_siswa_cache || '-',
          v.nama_dudi_cache || '-',
          v.tanggal_mulai || "-",
          v.tanggal_selesai || "-",
          v.status,
          v.nilai_akhir || "-"
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], halign: 'center' },
      styles: { fontSize: 8 },
      columnStyles: { 0: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' } }
    }
    );
  }

    // --- 4. FOOTER (TANDA TANGAN) ---
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    const pageHeight = doc.internal.pageSize.getHeight();
    
    let signatureY = finalY + 20;
    if (signatureY + 30 > pageHeight) {
        doc.addPage();
        signatureY = 30;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Mengetahui,", 140, signatureY);
    doc.setFont("helvetica", "bold");
    doc.text(`Kepala ${schoolProfile?.nama_sekolah || "Sekolah"}`, 140, signatureY + 5);
    
    doc.text(schoolProfile?.kepala_sekolah?.toUpperCase() || "NAMA KEPALA SEKOLAH", 140, signatureY + 25);
    doc.setFont("helvetica", "normal");
    doc.text(`NPSN. ${schoolProfile?.npsn || "-"}`, 140, signatureY + 30);

    doc.save(`Laporan_Magang_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
  /* 📱 Di mobile: flex-col (menumpuk). 💻 Di desktop: sm:flex-row (menyamping) */
  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
    <Button 
      variant="outline" 
      onClick={exportToExcel} 
      className="w-full sm:w-auto border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white font-bold rounded-xl shadow-sm h-11 sm:h-10"
    >
      <FileSpreadsheet size={16} className="mr-2 shrink-0"/> Export Excel
    </Button>
    <Button 
      variant="outline" 
      onClick={exportToPDF} 
      className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50 bg-white font-bold rounded-xl shadow-sm h-11 sm:h-10"
    >
      <Printer size={16} className="mr-2 shrink-0"/> Export PDF
    </Button>
  </div>
);
}