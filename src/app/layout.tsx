import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "sonner";
import QueryProvider from "@/lib/query-provider";

const inter = Inter({ subsets: ["latin"] });

// [PERBAIKAN MOBILE]: Tambahkan viewport-fit=cover untuk layar poni/bezel-less
export const viewport: Viewport = {
  themeColor: "#b91c1c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah zoom saat input text di iOS
  viewportFit: "cover", // Mendukung Safe Area Inset
};

export const metadata: Metadata = {
  title: "CoopConnect",
  description: "Platform Digital Terintegrasi",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon/icon-192x192.png",
  },
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
      <body className={`${inter.className} antialiased bg-zinc-50/50`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}