// File: src/components/layout/member-sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
   ShoppingBag, Store, Wallet, User, LogOut, LayoutDashboard,
   TrendingUp, History, MonitorPlay, CreditCard, ExternalLink,
   LucideIcon, QrCode, PanelLeftClose, PanelLeftOpen // Icon baru untuk Minimize
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/components/auth/auth-provider";
import { JSX } from "react";
import { useNotifications } from "@/hooks/use-notifications";

interface MemberSidebarProps {
  isMobile?: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon | ((props: any) => JSX.Element);
  external?: boolean;
  hasNotification?: boolean;
}

type MenuGroup = {
  title: string;
  items: MenuItem[];
}

export function MemberSidebar({ isMobile, isMinimized, onToggleMinimize }: MemberSidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData } = useAuth();
  const { hasMemberSales } = useNotifications();
  const minimized = !isMobile && isMinimized;

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  const menuGroups: MenuGroup[] = [
    {
      title: "Keanggotaan",
      items: [
        { href: "/member", label: "Ringkasan", icon: LayoutDashboard },
        { href: "/member/savings", label: "Simpanan & Aset", icon: Wallet },
        { href: "/member/history", label: "Riwayat Transaksi", icon: History },
      ]
    },
    {
      title: "Toko Saya (Seller)",
      items: [
        { href: "/member/shop", label: "Dashboard Toko", icon: Store },
        { href: "/member/shop/products", label: "Produk Saya", icon: PackageIcon },
        { href: "/member/shop/pos", label: "Kasir / POS", icon: MonitorPlay },
        { href: "/member/shop/qris", label: "QRIS Toko", icon: QrCode },
        { href: "/member/sales", label: "Laporan Penjualan", icon: TrendingUp, hasNotification: hasMemberSales },
      ]
    },
    {
      title: "Aktivitas Belanja",
      items: [
        { href: "/member/orders", label: "Pesanan Saya", icon: ShoppingBag },
        { href: "/marketplace", label: "Ke Marketplace", icon: ExternalLink, external: true },
      ]
    }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-zinc-200 min-h-screen">
      <div className={cn("p-6 border-b border-zinc-100 flex relative transition-all duration-300", minimized ? "flex-col items-center gap-4" : "items-center gap-3")}>
        <div className={cn("bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-blue-200 shrink-0", minimized ? "w-10 h-10" : "w-8 h-8")}>
          <CreditCard className={cn(minimized ? "w-5 h-5" : "w-4 h-4")} />
        </div>
        {!minimized && (
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-zinc-900 leading-none truncate">Member Area</h2>
            <span className="text-[10px] text-zinc-500 font-medium">Koperasi Digital</span>
          </div>
        )}

        {/* Toggle Minimize Button */}
        {!isMobile && (
          <Button
             variant="ghost"
             size="icon"
             onClick={onToggleMinimize}
             className={cn("text-zinc-400 hover:text-blue-600 shrink-0", minimized ? "" : "absolute top-5 right-2")}
          >
             {minimized ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </Button>
        )}
      </div>
             
      <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
        {userData && (
           <div className={cn("mb-6 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center transition-all", minimized ? "p-2 justify-center" : "p-3 gap-3")}>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                {userData.fullName?.substring(0,2).toUpperCase()}
              </div>
              {!minimized && (
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Login Sebagai</p>
                  <p className="font-bold text-zinc-900 truncate text-sm">{userData.fullName}</p>
                </div>
              )}
           </div>
        )}

        <div className="space-y-6">
          {menuGroups.map((group, index) => (
            <div key={index}>
              {!minimized ? (
                 <h3 className="px-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                   {group.title}
                 </h3>
              ) : (
                 <div className="w-full h-px bg-zinc-100 my-4" />
              )}
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/member' && pathname.startsWith(item.href + '/'));
                                     
                  if (item.external) {
                    return (
                        <Link key={item.href} href={item.href} className="block">
                          <Button variant="ghost" className={cn("w-full transition-all duration-200 relative", minimized ? "justify-center px-0 h-10" : "justify-start h-9 px-4 text-zinc-500 hover:text-blue-600 hover:bg-blue-50")}>
                            <Icon className={cn("h-4 w-4 shrink-0", minimized ? "" : "mr-3")} />
                            {!minimized && <span className="truncate">{item.label}</span>}
                          </Button>
                        </Link>
                    )
                  }
                  return (
                    <Link key={item.href} href={item.href} className="block">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full transition-all duration-200 relative",
                          minimized ? "justify-center px-0 h-10" : "justify-start h-9 px-4",
                          isActive
                             ? "bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100 translate-x-1"
                             : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", minimized ? "" : "mr-3", isActive ? "text-blue-600" : "text-zinc-400")} />
                        {!minimized && <span className="truncate">{item.label}</span>}
                                                 
                        {item.hasNotification && (
                            <span className={cn("relative flex h-2 w-2", minimized ? "absolute top-1 right-1" : "ml-auto")}>
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
          
          <div>
            {!minimized ? (
               <h3 className="px-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                 Akun
               </h3>
            ) : (
               <div className="w-full h-px bg-zinc-100 my-4" />
            )}
            <nav className="space-y-1">
              <Link href="/member/profile">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full transition-all duration-200",
                    minimized ? "justify-center px-0 h-10" : "justify-start h-9 px-4",
                    pathname === "/member/profile"
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100 translate-x-1"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  )}
                >
                  <User className={cn("h-4 w-4 shrink-0", minimized ? "" : "mr-3", pathname === "/member/profile" ? "text-blue-600" : "text-zinc-400")} />
                  {!minimized && <span className="truncate">Profil & Keamanan</span>}
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </div>
             
      <div className="p-4 border-t border-zinc-100 bg-zinc-50/30">
        <Button
           variant="ghost"
           className={cn(
             "w-full text-zinc-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent transition-colors",
             minimized ? "justify-center px-0" : "justify-start"
           )}
          onClick={handleLogout}
        >
          <LogOut className={cn("h-4 w-4 shrink-0", minimized ? "" : "mr-3")} />
          {!minimized && <span>Keluar Aplikasi</span>}
        </Button>
      </div>
    </div>
  );
}

function PackageIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22v-10" />
        </svg>
    )
}