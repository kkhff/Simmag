"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Printer } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportDudiProps {
  data: any[];
  schoolProfile?: any;
  namaPencetak?: string; // Bisa kamu isi string "Admin" dari page
}

export function ExportDudi({ data, schoolProfile, namaPencetak }: ExportDudiProps) {
  
  // =====================
  // EXPORT EXCEL (XLSX)
  // =====================
  const exportToExcel = () => {
    const worksheetData = XLSX.utils.aoa_to_sheet([]);

    // Judul di A1
    XLSX.utils.sheet_add_aoa(
      worksheetData,
      [[`Laporan Data Perusahaan Mitra (DUDI) - Dicetak oleh: ${namaPencetak || 'Admin'}`]],
      { origin: "A1" }
    );

    // Data mulai A3
    XLSX.utils.sheet_add_json(
      worksheetData,
      data.map((v, index) => {
        return {
          "No": index + 1,
          "Nama Perusahaan": v.nama_perusahaan || "-",
          "Penanggung Jawab": v.penanggung_jawab || "-",
          "Telepon": v.telepon || "-",
          "Email": v.email || "-",
          "Alamat": v.alamat || "-",
          "Status": v.status || "-"
        };
      }),
      {
        origin: "A3"
      }
    );

    // Karena ada 7 kolom (No sampai Status), index terakhirnya 6 (A sampai G)
    worksheetData["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: 6 } 
      }
    ];

    // Proses Auto-Fit Kolom
    const objectKeys = Object.keys(worksheetData).filter(key => !key.startsWith('!'));
    const colWidths: Record<string, number> = {};
    
    objectKeys.forEach(key => {
      // Ambil angka barisnya. Skip baris 1 (Judul) dan 2 (Kosong)
      const rowNum = parseInt(key.replace(/\D/g, ''), 10);
      if (rowNum === 1 || rowNum === 2) return; 

      const colName = key.replace(/[0-9]/g, ''); 
      const cellValue = worksheetData[key].v ? worksheetData[key].v.toString() : '';
      
      // Simpan yang paling panjang + padding
      if (!colWidths[colName] || cellValue.length > colWidths[colName]) {
        colWidths[colName] = Math.max(cellValue.length + 3, 10); 
      }
    });

    worksheetData['!cols'] = Object.keys(colWidths).map(col => ({ wch: colWidths[col] }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheetData, "Data DUDI");
    XLSX.writeFile(workbook, `Data_DUDI_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // =====================
  // EXPORT PDF (JSPDF)
  // =====================
  const exportToPDF = () => {
    // Pakai orientasi landscape ('l') karena alamat DUDI biasanya panjang-panjang
    const doc = new jsPDF('p'); 
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- 1. KOP SURAT ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(schoolProfile?.nama_sekolah?.toUpperCase() || "NAMA INSTANSI SEKOLAH", pageWidth / 2, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(schoolProfile?.alamat || "Alamat Instansi Lengkap", pageWidth / 2, 20, { align: "center" });
    doc.text(`Telp: ${schoolProfile?.telepon || '-'} | Web: ${schoolProfile?.website || '-'}`, pageWidth / 2, 25, { align: "center" });
    
    // Garis Bawah Kop
    doc.setLineWidth(0.5);
    doc.line(14, 28, pageWidth - 14, 28);

    // --- 2. JUDUL DOKUMEN ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN DATA PERUSAHAAN MITRA (DUDI)", pageWidth / 2, 38, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Dicetak oleh: ${namaPencetak || 'Admin'}`, pageWidth / 2, 44, { align: "center" });

    // --- 3. TABEL DATA ---
    autoTable(doc, {
      startY: 50,
      head: [["No", "Nama Perusahaan", "Penanggung Jawab", "Telepon", "Email", "Alamat", "Status"]],
      body: data.map((v, index) => [
        index + 1,
        v.nama_perusahaan || '-',
        v.penanggung_jawab || '-',
        v.telepon || '-',
        v.email || '-',
        v.alamat || '-',
        v.status || '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], halign: 'center' },
      styles: { fontSize: 8 },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 10 }, 
        6: { halign: 'center', cellWidth: 20 } 
      }
    });

    // --- 4. FOOTER (TANDA TANGAN) ---
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    
    let signatureY = finalY + 20;
    if (signatureY + 30 > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        signatureY = 30;
    }

    // Posisi TTD di kanan (dikurang jarak margin)
    const ttdX = pageWidth - 60; 

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Mengetahui,", ttdX, signatureY, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(`Kepala ${schoolProfile?.nama_sekolah || "Sekolah"}`, ttdX, signatureY + 5, { align: "center" });
    
    doc.text(schoolProfile?.kepala_sekolah?.toUpperCase() || "NAMA KEPALA SEKOLAH", ttdX, signatureY + 25, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(`NPSN. ${schoolProfile?.npsn || "-"}`, ttdX, signatureY + 30, { align: "center" });

    doc.save(`Laporan_DUDI_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
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