// File: src/components/layout/admin-sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut,
    Wallet, Building2, CheckCircle2, UserCog, FileText, MonitorPlay,
    History, Database, TrendingDown, ClipboardList, Megaphone, FileBarChart,
    ChevronDown, ChevronRight, Store, PieChart, BarChart3, ExternalLink,
    TrendingUp,
    Coins
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/use-notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminSidebarProps {
  isMobile?: boolean;
}

type MenuItem = {
  href: string;
  label: string;
  icon: any;
  roles: string[];
  hasNotification?: boolean;
};

type MenuGroup = {
  title: string;
  icon?: any;
  items: MenuItem[];
  roles: string[];
};

export function AdminSidebar({ isMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData } = useAuth();
  const { hasAdminOrders, hasAdminMembers } = useNotifications();
  
  // Jika dibuka di desktop, SELALU ramping (minimized = true)
  const minimized = !isMobile;
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "toko": true,
    "keuangan": false,
    "anggota": false,
    "laporan": false,
    "platform": false
  });

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

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const mainItems: MenuItem[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ['super_admin', 'unit_admin', 'admin'] },
    { href: "/admin/pos", label: "Kasir / POS", icon: MonitorPlay, roles: ['unit_admin', 'admin'] },
  ];

  const menuGroups: Record<string, MenuGroup> = {
    platform: {
      title: "Platform Admin",
      icon: Database,
      roles: ['super_admin'],
      items: [
        { href: "/admin/cooperatives", label: "Unit Koperasi", icon: Building2, roles: ['super_admin'] },
        { href: "/admin/admins", label: "Kelola Admin", icon: UserCog, roles: ['super_admin'] },
        { href: "/admin/seed", label: "Data Seeding", icon: Database, roles: ['super_admin'] },
      ]
    },
    toko: {
      title: "Manajemen Toko",
      icon: Store,
      roles: ['super_admin', 'unit_admin', 'admin'],
      items: [
        { href: "/admin/unit-products", label: "Produk Internal Unit", icon: Building2, roles: ['super_admin', 'unit_admin', 'admin'] },
        { href: "/admin/products", label: "Produk & Etalase", icon: Package, roles: ['super_admin', 'unit_admin', 'admin'] },
        { href: "/admin/inventory", label: "Stok & Opname", icon: ClipboardList, roles: ['unit_admin', 'admin'] },
        { href: "/admin/orders", label: "Riwayat Pesanan", icon: ShoppingBag, roles: ['super_admin', 'unit_admin', 'admin'], hasNotification: hasAdminOrders },
        { href: "/admin/sales-recap", label: "Rekap Penjualan", icon: BarChart3, roles: ['super_admin', 'unit_admin', 'admin'] },
      ]
    },
    keuangan: {
      title: "Keuangan Unit",
      icon: PieChart,
      roles: ['unit_admin', 'admin', 'super_admin'],
      items: [
        { href: "/admin/savings", label: "Input Simpanan", icon: Wallet, roles: ['unit_admin', 'admin'] },
        { href: "/admin/expenses", label: "Pengeluaran", icon: TrendingDown, roles: ['unit_admin', 'admin'] },
        { href: "/admin/shu", label: "Laporan SHU", icon: FileText, roles: ['super_admin', 'unit_admin'] },
        { href: "/admin/cash-flow", label: "Buku Kas", icon: Coins, roles: ['super_admin', 'unit_admin'] },
      ]
    },
    anggota: {
      title: "Keanggotaan",
      icon: Users,
      roles: ['unit_admin', 'admin', 'super_admin'],
      items: [
        { href: "/admin/members", label: "Data Anggota", icon: Users, roles: ['super_admin', 'unit_admin', 'admin'] },
        { href: "/admin/approvals", label: "Validasi Anggota", icon: CheckCircle2, roles: ['unit_admin', 'admin'], hasNotification: hasAdminMembers },
        { href: "/admin/announcements", label: "Pengumuman", icon: Megaphone, roles: ['unit_admin', 'admin'] },
      ]
    },
    laporan: {
      title: "Laporan",
      icon: FileBarChart,
      roles: ['unit_admin', 'admin', 'super_admin'],
      items: [
        { href: "/admin/history", label: "Riwayat Transaksi", icon: History, roles: ['super_admin', 'unit_admin', 'admin'] },
        { href: "/admin/reports", label: "Pusat Laporan", icon: FileBarChart, roles: ['super_admin', 'unit_admin', 'admin'] },
        { href: "/admin/reports/member-traction", label: "Traksi Koperasi", icon: TrendingUp, roles: ['super_admin', 'unit_admin', 'admin'] },
      ]
    }
  };

  useEffect(() => {
    Object.entries(menuGroups).forEach(([key, group]) => {
      const isActive = group.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"));
      if (isActive) {
        setOpenGroups(prev => ({ ...prev, [key]: true }));
      }
    });
  }, [pathname]);

  const NotificationDot = ({ absolute }: { absolute?: boolean }) => (
    <span className={cn("flex h-2.5 w-2.5", absolute ? "absolute top-2 right-2" : "ml-auto")}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-[#1c1c1c]"></span>
    </span>
  );

  return (
    <div className="flex flex-col h-full max-h-screen bg-[#1c1c1c] text-zinc-300 overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      
      {/* ================= HEADER PROFIL ================= */}
      {!isMobile ? (
        // Desktop Header: Ikon Saja (Kotak proporsional 88px)
        <div className="h-[88px] border-b border-white/5 shrink-0 flex flex-col items-center justify-center relative">
          <div className="w-11 h-11 rounded-full bg-red-900/40 text-red-400 border border-red-500/20 flex items-center justify-center text-sm font-bold shadow-inner">
             {userData?.fullName?.substring(0,2).toUpperCase()}
          </div>
        </div>
      ) : (
        // Mobile Header: Info Lengkap
        <div className="p-5 border-b border-white/5 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className="w-10 h-10 rounded-full bg-red-900/40 text-red-400 border border-red-500/20 flex items-center justify-center text-sm font-bold shadow-inner shrink-0">
               {userData?.fullName?.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
               <p className="text-base font-bold truncate text-white">{userData?.fullName}</p>
               <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1.5">
                  <span className="capitalize font-medium text-zinc-300">{userData?.role?.replace('_', ' ')}</span>
                  {(userData?.role === 'unit_admin' || userData?.role === 'admin') && userData?.coopName && (
                     <>
                        <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0"></span>
                        <span className="truncate flex items-center gap-1">
                           <Building2 className="w-3.5 h-3.5 shrink-0" />
                           <span className="truncate">{userData?.coopName}</span>
                        </span>
                     </>
                  )}
               </div>
            </div>
          </div>
          <Link href="/marketplace" className="w-full mt-2">
            <Button variant="secondary" className="w-full h-9 text-xs bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border-none flex items-center justify-center rounded-lg">
               <ExternalLink className="w-3.5 h-3.5 mr-2 opacity-70" /> Ke Marketplace
            </Button>
          </Link>
        </div>
      )}

      {/* ================= AREA MENU NAVIGASI ================= */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <div className="space-y-6">
          <nav className="space-y-1.5 pb-10">
            
            {/* MENU UTAMA (SINGLE ITEMS) */}
            {mainItems.filter(i => userData?.role && i.roles.includes(userData.role)).map((item) => {
               const Icon = item.icon;
               const isActive = pathname === item.href;
               return (
                  <DropdownMenu 
                    key={item.href} 
                    open={minimized && hoveredMenu === item.href} 
                    onOpenChange={(open) => minimized && setHoveredMenu(open ? item.href : null)}
                  >
                    <DropdownMenuTrigger asChild>
                      <Link href={item.href} className="block outline-none" onMouseEnter={() => minimized && handleMouseEnter(item.href)} onMouseLeave={() => minimized && handleMouseLeave()}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full relative transition-all duration-200 border border-transparent",
                            minimized ? "justify-center px-0 h-12 rounded-xl" : "justify-start h-11 rounded-lg px-4",
                            isActive
                                ? "bg-[#cf3535] text-white shadow-md font-semibold border-red-500/50"
                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <div className="relative flex items-center justify-center">
                              <Icon className={cn(minimized ? "h-6 w-6" : "h-5 w-5 mr-3", isActive ? "text-white" : "text-zinc-400")} />
                              {item.hasNotification && <NotificationDot absolute={minimized} />}
                          </div>
                          {!minimized && <span className="truncate">{item.label}</span>}
                        </Button>
                      </Link>
                    </DropdownMenuTrigger>

                    {minimized && (
                      <DropdownMenuContent side="right" align="center" sideOffset={15} className="bg-[#2c2c2c] border-zinc-700 text-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 font-medium px-4 py-2">
                           <Link href={item.href}>{item.label}</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    )}
                  </DropdownMenu>
               )
            })}

            <Separator className="my-4 mx-4 w-auto bg-white/5" />

            {/* GRUP MENU ACCORDION */}
            {Object.entries(menuGroups).map(([key, group]) => {
              if (!userData?.role || !group.roles.includes(userData.role)) return null;                              
              const isOpen = openGroups[key];
              const GroupIcon = group.icon;
              const hasGroupNotification = group.items.some(i => i.hasNotification);
              const isGroupActive = group.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"));

              return (
                <DropdownMenu 
                  key={key} 
                  open={minimized && hoveredMenu === key} 
                  onOpenChange={(open) => minimized && setHoveredMenu(open ? key : null)}
                >
                  <DropdownMenuTrigger asChild>
                    <div className="mb-1 outline-none" onMouseEnter={() => minimized && handleMouseEnter(key)} onMouseLeave={() => minimized && handleMouseLeave()}>
                      <button
                        onClick={() => !minimized && toggleGroup(key)}
                        className={cn(
                          "w-full flex items-center transition-all duration-200 border border-transparent cursor-pointer outline-none",
                          minimized ? "justify-center px-0 h-12 rounded-xl" : "justify-between px-4 py-2.5 rounded-lg text-sm font-medium",
                          isOpen && !minimized ? "text-white bg-white/5" : "text-zinc-400 hover:text-white hover:bg-white/5",
                          minimized && isGroupActive && !isOpen ? "bg-white/5 text-white" : ""
                        )}
                      >
                        <div className={cn("flex items-center", minimized ? "justify-center relative" : "gap-3 flex-1")}>
                          {GroupIcon && <GroupIcon className={cn(minimized ? "w-6 h-6" : "w-5 h-5 shrink-0")} />}
                          {!minimized && <span>{group.title}</span>}
                          {hasGroupNotification && minimized && <NotificationDot absolute={true} />}
                        </div>
                        {hasGroupNotification && !isOpen && !minimized && (
                            <div className="mr-3"><NotificationDot /></div>
                        )}
                        {!minimized && (isOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />)}
                      </button>

                      {!minimized && isOpen && (
                        <div className="mt-2 ml-6 border-l border-white/10 pl-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {group.items.filter(i => userData?.role && i.roles.includes(userData.role)).map((item) => {
                            const isSubActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            const SubIcon = item.icon;                                                  
                            return (
                              <Link key={item.href} href={item.href} className="block">
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start h-9 text-xs relative transition-colors rounded-md",
                                    isSubActive
                                        ? "text-red-400 bg-red-500/10 font-semibold"
                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                  )}
                                >
                                  <SubIcon className={cn("mr-3 h-4 w-4", isSubActive ? "text-red-400" : "text-zinc-600")} />
                                  <span className="truncate">{item.label}</span>
                                  {item.hasNotification && <NotificationDot />}
                                </Button>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </DropdownMenuTrigger>

                  {minimized && (
                    <DropdownMenuContent 
                      side="right" 
                      align="start" 
                      sideOffset={15} 
                      className="w-56 bg-[#2c2c2c] border-zinc-700 text-zinc-300 shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200"
                      onMouseEnter={() => handleMouseEnter(key)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <DropdownMenuLabel className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">{group.title}</DropdownMenuLabel>
                      {group.items.filter(i => userData?.role && i.roles.includes(userData.role)).map((item) => {
                        const isSubActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        const SubIcon = item.icon;
                        return (
                          <DropdownMenuItem key={item.href} asChild className={cn("cursor-pointer mb-1 rounded-md", isSubActive ? "bg-red-500/20 text-red-400 focus:bg-red-500/30 focus:text-red-300" : "focus:bg-white/10 focus:text-white")}>
                             <Link href={item.href} className="flex items-center w-full px-2 py-2">
                               <SubIcon className="mr-3 h-4 w-4 opacity-70" />
                               <span className="flex-1 font-medium">{item.label}</span>
                               {item.hasNotification && <NotificationDot />}
                             </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              );
            })}

            <Separator className="my-4 mx-4 w-auto bg-white/5" />
                          
            {/* PENGATURAN */}
            <DropdownMenu 
              open={minimized && hoveredMenu === '/admin/settings'} 
              onOpenChange={(open) => minimized && setHoveredMenu(open ? '/admin/settings' : null)}
            >
              <DropdownMenuTrigger asChild>
                <Link href="/admin/settings" className="block outline-none" onMouseEnter={() => minimized && handleMouseEnter('/admin/settings')} onMouseLeave={() => minimized && handleMouseLeave()}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full transition-all duration-200 border border-transparent",
                        minimized ? "justify-center px-0 h-12 rounded-xl" : "justify-start h-11 rounded-lg px-4",
                        pathname === '/admin/settings' 
                           ? "bg-[#cf3535] text-white shadow-md font-semibold border-red-500/50" 
                           : "text-zinc-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Settings className={cn(minimized ? "h-6 w-6" : "h-5 w-5 mr-3")} />
                      {!minimized && <span>Pengaturan</span>}
                    </Button>
                </Link>
              </DropdownMenuTrigger>
              {minimized && (
                <DropdownMenuContent side="right" align="center" sideOffset={15} className="bg-[#2c2c2c] border-zinc-700 text-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 font-medium px-4 py-2">
                     <Link href="/admin/settings">Pengaturan</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              )}
            </DropdownMenu>

          </nav>
        </div>
      </div>
            
      {/* ================= FOOTER LOGOUT ================= */}
      <div className="p-4 border-t border-white/5 bg-[#1c1c1c] shrink-0 flex flex-col items-center">
        
        <DropdownMenu 
          open={minimized && hoveredMenu === 'logout'} 
          onOpenChange={(open) => minimized && setHoveredMenu(open ? 'logout' : null)}
        >
          <DropdownMenuTrigger asChild>
            <div className="w-full outline-none" onMouseEnter={() => minimized && handleMouseEnter('logout')} onMouseLeave={() => minimized && handleMouseLeave()}>
              <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border border-transparent",
                    minimized ? "justify-center px-0 h-12 rounded-xl" : "justify-start h-11 rounded-lg px-4"
                  )}
                onClick={handleLogout}
              >
                <LogOut className={cn(minimized ? "h-6 w-6 ml-0.5" : "h-5 w-5 mr-3")} />
                {!minimized && <span className="font-medium">Keluar Aplikasi</span>}
              </Button>
            </div>
          </DropdownMenuTrigger>

          {minimized && (
            <DropdownMenuContent side="right" align="center" sideOffset={15} className="bg-red-600 border-red-500 text-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer focus:bg-red-700 font-bold px-4 py-2">
                 Keluar Aplikasi
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>

      </div>
    </div>
  );
}