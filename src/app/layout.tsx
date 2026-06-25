import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "sonner";
import QueryProvider from "@/lib/query-provider";

const inter = Inter({ subsets: ["latin"] });

// 1. Tambahkan Viewport untuk warna browser mobile (Warna Merah sesuai tema landing page Anda)
export const viewport: Viewport = {
  themeColor: "#b91c1c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 2. Tambahkan manifest ke Metadata
export const metadata: Metadata = {
  title: "CoopConnect",
  description: "Platform Digital Terintegrasi",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CoopConnect",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}