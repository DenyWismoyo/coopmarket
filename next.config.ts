import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // [FIX] Matikan ini karena menyebabkan error "invalid option" jika plugin belum diinstall
  // experimental: {
  //   reactCompiler: true,
  // },

  // [PENTING] Aktifkan ini untuk Production di Firebase Hosting
  // Ini memperbaiki masalah gambar tidak muncul (Bad Request) karena bypass image optimization server
  images: {
    unoptimized: true, 
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;