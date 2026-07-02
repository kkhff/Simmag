import type { Metadata, Viewport } from "next"; // 👈 Tambah import Viewport
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast"; 
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"], // Tambah 500 & 900 biar teks tebal di dashboard makin gahar
});

// 🟢 CONFIG VIEWPORT (Cara Modern Next.js untuk Theme Color PWA)
export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Mencegah browser nge-zoom otomatis pas siswa ngeklik input text di HP
};

export const metadata: Metadata = {
  title: "SIMMAG - Sistem Informasi Manajemen Magang",
  description: "Aplikasi Manajemen Magang SMK Berbasis Offline-First",
  manifest: "/manifest.webmanifest",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased" 
    >
      {/* 2. Masukkan variabel font ke elemen body dan terapkan ke font-family */}
      <body className={`${poppins.variable} font-[family-name:var(--font-poppins)] min-h-full flex flex-col`}>
        {children}
        <Toaster position="top-right"/>
      </body>
    </html>
  );
}

