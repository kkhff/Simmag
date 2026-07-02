import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fnljmtytwgsydzvkdkex.supabase.co', // Hostname dari pesan error kamu
        port: '',
        pathname: '/storage/v1/object/public/**', // Mengizinkan semua gambar di dalam folder storage public
      },
    ],
  },
};

export default nextConfig;