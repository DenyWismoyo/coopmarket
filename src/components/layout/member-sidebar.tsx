// File: src/components/layout/member-sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
   ShoppingBag, Store, Wallet, User, LogOut, LayoutDashboard,
   TrendingUp, History, MonitorPlay, ExternalLink, Users,
   LucideIcon, QrCode, ClipboardList, Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/components/auth/auth-provider";
import { JSX } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MemberSidebarProps {
  isMobile?: boolean;
}

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon | ((props: any) => JSX.Element);
  external?: boolean;
  hasNotification?: boolean;
}

type MenuGroup = {
  id: string;
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
}

export function MemberSidebar({ isMobile }: MemberSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData } = useAuth();
  const { hasMemberSales } = useNotifications();
  
  const minimized = !isMobile;

  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  let hoverTimeout: NodeJS.Timeout;

  const handleMouseEnter = (key: string) => {
    clearTimeout(hoverTimeout);
    setHoveredMenu(key);
  };

  const handleMouseLeave = () => {
    hoverTimeout = setTimeout(() => {
      setHoveredMenu(null);
    }, 150);
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  const menuGroups: MenuGroup[] = [
    {
      id: "keanggotaan",
      title: "Keanggotaan",
      icon: Users,
      items: [
        { href: "/member", label: "Ringkasan", icon: LayoutDashboard },
        { href: "/member/savings", label: "Simpanan & Aset", icon: Wallet },
        { href: "/member/history", label: "Riwayat Transaksi", icon: History },
      ]
    },
    {
      id: "toko",
      title: "Toko Saya (Seller)",
      icon: Store,
      items: [
        { href: "/member/shop", label: "Dashboard Toko", icon: LayoutDashboard },
        { href: "/member/shop/products", label: "Produk Saya", icon: PackageIcon },
        { href: "/member/shop/pos", label: "Kasir / POS", icon: MonitorPlay },
        { href: "/member/shop/qris", label: "QRIS Toko", icon: QrCode },
        { href: "/member/sales", label: "Laporan Penjualan", icon: TrendingUp, hasNotification: hasMemberSales },
      ]
    },
    {
      id: "belanja",
      title: "Aktivitas Belanja",
      icon: ShoppingBag,
      items: [
        { href: "/member/orders", label: "Pesanan Saya", icon: ClipboardList },
        { href: "/marketplace", label: "Ke Marketplace", icon: ExternalLink, external: true },
      ]
    }
  ];

  const NotificationDot = ({ absolute }: { absolute?: boolean }) => (
    <span className={cn("flex h-2.5 w-2.5", absolute ? "absolute top-2 right-2" : "ml-auto")}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
    </span>
  );

  return (
    <div className="flex flex-col h-full max-h-screen bg-white text-zinc-600 overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      
      {/* ================= HEADER PROFIL ================= */}
      {!isMobile ? (
        <div className="h-[88px] border-b border-zinc-100 shrink-0 flex flex-col items-center justify-center relative bg-zinc-50/50">
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-sm font-bold shadow-sm">
             {userData?.fullName?.substring(0,2).toUpperCase()}
          </div>
        </div>
      ) : (
        <div className="p-5 border-b border-zinc-100 shrink-0 flex flex-col gap-4 bg-zinc-50/50">
          <div className="flex items-center gap-4 w-full">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
               {userData?.fullName?.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
               <p className="text-base font-bold truncate text-zinc-900">{userData?.fullName}</p>
               <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-1">Koperasi Digital</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= AREA MENU NAVIGASI ================= */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <div className="space-y-2">
          
          {menuGroups.map((group) => {
            const GroupIcon = group.icon;
            const hasGroupNotification = group.items.some(i => i.hasNotification);
            
            // [PERBAIKAN] Logika penentuan status grup aktif secara presisi
            const isGroupActive = group.items.some(item => {
              if (item.href === '/member') {
                return pathname === '/member'; // Wajib sama persis untuk base path
              }
              return pathname === item.href || pathname.startsWith(item.href + "/");
            });

            return (
              <div key={group.id} className="mb-2">
                {/* TAMPILAN MOBILE (Drawer Mode) */}
                {!minimized ? (
                   <div className="mb-6">
                     <h3 className="px-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                       {group.title}
                     </h3>
                     <div className="space-y-1.5">
                       {group.items.map(item => {
                         const SubIcon = item.icon;
                         // Pengecualian presisi untuk sub-menu
                         const isSubActive = pathname === item.href || (item.href !== '/member' && pathname.startsWith(item.href + '/'));
                         
                         return (
                           <Link key={item.href} href={item.href} className="block">
                             <Button
                               variant="ghost"
                               className={cn(
                                 "w-full justify-start h-10 px-4 transition-all duration-200",
                                 isSubActive ? "bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                               )}
                             >
                               <SubIcon className={cn("h-5 w-5 mr-3", isSubActive ? "text-blue-600" : "text-zinc-400")} />
                               <span className="truncate">{item.label}</span>
                               {item.hasNotification && <NotificationDot />}
                             </Button>
                           </Link>
                         )
                       })}
                     </div>
                   </div>
                ) : (
                  /* TAMPILAN DESKTOP (Slim Hover Portal) */
                  <DropdownMenu 
                    open={hoveredMenu === group.id} 
                    onOpenChange={(open) => setHoveredMenu(open ? group.id : null)}
                  >
                    <DropdownMenuTrigger asChild>
                      <div className="outline-none" onMouseEnter={() => handleMouseEnter(group.id)} onMouseLeave={handleMouseLeave}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full relative transition-all duration-200 border border-transparent justify-center px-0 h-12 rounded-xl",
                            isGroupActive ? "bg-blue-600 text-white shadow-md font-semibold border-blue-500" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                          )}
                        >
                          <div className="relative flex items-center justify-center">
                              <GroupIcon className={cn("h-6 w-6", isGroupActive ? "text-white" : "text-zinc-500")} />
                              {hasGroupNotification && <NotificationDot absolute={true} />}
                          </div>
                        </Button>
                      </div>
                    </DropdownMenuTrigger>

                    {/* POPUP MENU MELAYANG SAAT HOVER */}
                    <DropdownMenuContent 
                      side="right" 
                      align="start" 
                      sideOffset={15} 
                      className="w-56 bg-white border-zinc-200 text-zinc-800 shadow-xl p-2 animate-in fade-in zoom-in-95 duration-200"
                      onMouseEnter={() => handleMouseEnter(group.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <DropdownMenuLabel className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-2">
                        {group.title}
                      </DropdownMenuLabel>
                      
                      {group.items.map((item) => {
                        const SubIcon = item.icon;
                        // Pengecualian presisi untuk sub-menu
                        const isSubActive = pathname === item.href || (item.href !== '/member' && pathname.startsWith(item.href + '/'));
                        
                        return (
                          <DropdownMenuItem key={item.href} asChild className={cn("cursor-pointer mb-1 rounded-md", isSubActive ? "bg-blue-50 text-blue-700 focus:bg-blue-100 focus:text-blue-800" : "focus:bg-zinc-50 focus:text-zinc-900")}>
                             <Link href={item.href} className="flex items-center w-full px-2 py-2">
                               <SubIcon className={cn("mr-3 h-4 w-4", isSubActive ? "text-blue-600" : "opacity-70")} />
                               <span className={cn("flex-1 font-medium", isSubActive && "font-bold")}>{item.label}</span>
                               {item.hasNotification && <NotificationDot />}
                               {item.external && <ExternalLink className="w-3.5 h-3.5 opacity-50 ml-2" />}
                             </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
          
          <Separator className="my-4 mx-4 w-auto bg-zinc-100" />
          
          {/* PENGATURAN AKUN */}
          <div className="mb-2">
            {!minimized ? (
               <div className="mb-6">
                 <h3 className="px-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Akun</h3>
                 <Link href="/member/profile" className="block">
                   <Button variant="ghost" className={cn("w-full justify-start h-10 px-4 transition-all duration-200", pathname === "/member/profile" ? "bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50")}>
                     <User className={cn("h-5 w-5 mr-3", pathname === "/member/profile" ? "text-blue-600" : "text-zinc-400")} />
                     Profil & Keamanan
                   </Button>
                 </Link>
               </div>
            ) : (
              <DropdownMenu 
                open={hoveredMenu === 'profile'} 
                onOpenChange={(open) => setHoveredMenu(open ? 'profile' : null)}
              >
                <DropdownMenuTrigger asChild>
                  <div className="outline-none" onMouseEnter={() => handleMouseEnter('profile')} onMouseLeave={handleMouseLeave}>
                    <Link href="/member/profile" className="block">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full transition-all duration-200 border border-transparent justify-center px-0 h-12 rounded-xl",
                          pathname === "/member/profile" ? "bg-blue-600 text-white shadow-md font-semibold border-blue-500" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                        )}
                      >
                         <Settings className={cn("h-6 w-6", pathname === "/member/profile" ? "text-white" : "text-zinc-500")} />
                      </Button>
                    </Link>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="center" sideOffset={15} className="bg-white border-zinc-200 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-blue-50 focus:text-blue-700 font-medium px-4 py-2">
                     <Link href="/member/profile">Profil & Keamanan</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

        </div>
      </div>
             
      {/* ================= FOOTER LOGOUT ================= */}
      <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 shrink-0 flex flex-col items-center">
        {!minimized ? (
          <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent transition-colors justify-start h-11 px-4 rounded-lg" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium">Keluar Aplikasi</span>
          </Button>
        ) : (
          <DropdownMenu 
            open={hoveredMenu === 'logout'} 
            onOpenChange={(open) => setHoveredMenu(open ? 'logout' : null)}
          >
            <DropdownMenuTrigger asChild>
              <div className="w-full outline-none" onMouseEnter={() => handleMouseEnter('logout')} onMouseLeave={handleMouseLeave}>
                <Button
                   variant="ghost"
                   className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent transition-colors justify-center px-0 h-12 rounded-xl"
                  onClick={handleLogout}
                >
                  <LogOut className="h-6 w-6 ml-1" />
                </Button>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="right" align="center" sideOffset={15} className="bg-red-50 border-red-100 text-red-600 shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer focus:bg-red-100 font-bold px-4 py-2">
                 Keluar Aplikasi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// Icon khusus jika LucideIcon tidak memiliki package yang pas
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