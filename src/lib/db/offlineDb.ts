import Dexie, { type Table } from "dexie";

// 1. Definisikan Struktur Interface Data Jurnal Offline
export interface OfflineJurnal {
  id?: number;          // Auto-increment primary key untuk lokal
  magang_id: number;
  siswa_id: number;     // ID int8 siswa kamu
  tanggal: string;      // Format: YYYY-MM-DD
  kegiatan: string;
  kendala?: string;
  created_at: string;
}

// 2. Buat Class Instance Database Dexie
class SIMMAGOfflineDatabase extends Dexie {
  jurnalDrafts!: Table<OfflineJurnal>; 

  constructor() {
    super("SIMMAGOfflineDB");
    
    // Tentukan kolom index utama. Kolom 'id' diset auto-increment (++)
    this.version(1).stores({
      jurnalDrafts: "++id, magang_id, siswa_id, tanggal"
    });
  }
}

// Export satu instance tunggal (Singleton) agar tidak membuat koneksi ganda
export const offlineDb = new SIMMAGOfflineDatabase();