// File: src/app/(member)/member/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { MemberSidebar } from "@/components/layout/member-sidebar";
import { Loader2, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 space-y-4">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        <p className="text-sm text-zinc-500 font-medium animate-pulse">Memuat ruang kerja...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      {/* DESKTOP SIDEBAR - Dikunci Ramping (Lebar 88px) */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 z-50 border-r border-zinc-200 bg-white shadow-xl w-[88px]">
        <MemberSidebar />
      </aside>

      {/* MOBILE & MAIN CONTENT - Margin dinamis mengikuti Sidebar */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-[88px]">
                 
        {/* === MOBILE HEADER === */}
        <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 font-bold text-zinc-800">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">M</div>
             <span className="tracking-tight">Member Area</span>
          </div>
                     
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-zinc-600 active:scale-95 transition-transform">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-white border-r border-zinc-200 shadow-2xl">
              <SheetTitle className="sr-only">Menu Navigasi Member</SheetTitle>
              <MemberSidebar isMobile />
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