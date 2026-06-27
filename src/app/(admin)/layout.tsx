// File: src/app/(admin)/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Loader2, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        const allowedRoles = ['admin', 'super_admin', 'unit_admin'];
        if (!userData?.role || !allowedRoles.includes(userData.role)) {
          router.push("/member");
        }
      }
    }
  }, [user, userData, loading, router]);

  // Tutup sidebar mobile secara otomatis ketika rute berpindah
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 space-y-4">
        <Loader2 className="animate-spin h-10 w-10 text-red-600" />
        <p className="text-sm text-zinc-500 font-medium animate-pulse">Memuat ruang kerja...</p>
      </div>
    );
  }

  const allowedRoles = ['admin', 'super_admin', 'unit_admin'];
  if (!user || !userData?.role || !allowedRoles.includes(userData.role)) {
      return null;
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans selection:bg-red-200 selection:text-red-900">
      
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR - Dikunci Ramping (Lebar 88px) */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 z-50 border-r border-zinc-800 bg-[#1c1c1c] shadow-2xl w-[88px]">
        <AdminSidebar />
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA - Padding Kiri dikunci di 88px */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[88px]">
                 
        {/* === MOBILE HEADER === */}
        <header className="md:hidden sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 text-white px-4 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center font-bold text-white shadow-inner">
                A
             </div>
             <span className="font-semibold tracking-tight">Admin Panel</span>
          </div>
                     
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-transform">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="p-0 w-72 bg-[#1c1c1c] border-r border-zinc-800 text-white shadow-2xl"
            >
              <SheetTitle className="sr-only">Menu Navigasi Admin</SheetTitle>
              {/* Melempar flag isMobile agar mode laci menampilkan teks penuh */}
              <AdminSidebar isMobile /> 
            </SheetContent>
          </Sheet>
        </header>

        {/* === MAIN CONTENT === */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 xl:px-10 overflow-x-hidden w-full">
          <div className="w-full max-w-[1600px] mx-auto space-y-6">
             {children}
          </div>
        </main>

      </div>
    </div>
  );
}