import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sistem Informasi Manajemen Magang - SIMMAG",
    short_name: "SIMMAG",
    description: "Aplikasi Manajemen Magang SMK Berbasis Offline-First",
    // 🟢 UBAH DI SINI: Gunakan "/" agar dinamis menyesuaikan domain (baik localhost, ngrok, maupun pas hosting)
    start_url: "/", 
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}