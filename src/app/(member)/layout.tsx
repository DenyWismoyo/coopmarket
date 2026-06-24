"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation"; // Tambahkan usePathname
import { useAuth } from "@/components/auth/auth-provider";
import { MemberSidebar } from "@/components/layout/member-sidebar";
import { Loader2, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Hook untuk deteksi pindah halaman
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Tutup drawer mobile saat pindah halaman
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-white">
        <MemberSidebar />
      </aside>

      {/* MOBILE & MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 transition-all duration-300">
        
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-white border-b border-zinc-200 px-4 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 font-bold text-zinc-800">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">M</div>
             <span>Member Area</span>
          </div>
          
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-zinc-600">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-white">
              <MemberSidebar />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content Area - Full Width */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden w-full">
          {/* Menggunakan w-full agar konten memenuhi sisa layar */}
          <div className="w-full space-y-6">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}