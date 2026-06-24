"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Loader2, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin h-8 w-8 text-red-600" />
      </div>
    );
  }

  const allowedRoles = ['admin', 'super_admin', 'unit_admin'];
  if (!user || !userData?.role || !allowedRoles.includes(userData.role)) {
      return null;
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-zinc-900">
        <AdminSidebar />
      </aside>

      {/* MOBILE & MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 transition-all duration-300">
        
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800 text-white px-4 h-16 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white">A</div>
             <span className="font-semibold">Admin Panel</span>
          </div>
          
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-zinc-900 border-r-zinc-800 text-white">
              <AdminSidebar isMobile />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content Area - Full Width */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden w-full">
          {/* Hapus max-w-6xl agar full width, ganti dengan w-full */}
          <div className="w-full space-y-6">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}