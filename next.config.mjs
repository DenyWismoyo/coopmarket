// File: next.config.mjs
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Nonaktifkan di mode dev agar tidak mengganggu hot-reload
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // MENGABAIKAN ERROR ESLINT SAAT BUILD DI APP HOSTING
  // Ini akan menyelesaikan masalah "Invalid Options: - Unknown options: useEslintrc"
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Tambahkan konfigurasi image remote jika Anda memuat gambar dari Firebase/URL luar
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default withPWA(nextConfig);