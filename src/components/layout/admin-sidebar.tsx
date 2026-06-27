// File: src/components/layout/admin-sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
   LayoutDashboard, 
   Package, 
   ShoppingBag, 
   Users, 
   Settings,
   LogOut,
   Wallet,
   Building2,
   CheckCircle2,
   UserCog,
   FileText,
   MonitorPlay,
   History,
   Database,
   TrendingDown,
   ClipboardList,
   Megaphone,
   FileBarChart,
   ChevronDown,
   ChevronRight,
   Store,
   PieChart,
   BarChart3, 
   ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/use-notifications";

interface AdminSidebarProps {
  isMobile?: boolean;
}

type MenuItem = {
  href: string;
  label: string;
  icon: any;
  roles: string[];
  hasNotification?: boolean;
}

type MenuGroup = {
  title: string;
  icon?: any;
  items: MenuItem[];
  roles: string[];
}

export function AdminSidebar({ isMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData } = useAuth();
  
  const { hasAdminOrders, hasAdminMembers } = useNotifications();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "toko": true,
    "keuangan": false,
    "anggota": false,
    "laporan": false,
    "platform": false
  });

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
        { href: "/admin/products", label: "Produk", icon: Package, roles: ['super_admin', 'unit_admin', 'admin'] },
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
        { href: "/admin/shu", label: "S H U", icon: FileText, roles: ['super_admin', 'unit_admin'] },
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

  const NotificationDot = () => (
    <span className="relative flex h-2 w-2 ml-auto">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
    </span>
  );

  return (
    <div className="flex flex-col h-full max-h-screen bg-zinc-900 text-white overflow-hidden">
      
      {/* [MODIFIKASI TERBARU] Header Kompak (Identitas Admin & Tombol) */}
      {!isMobile && (
        <div className="p-4 border-b border-zinc-800 shrink-0 flex flex-col gap-3 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center text-sm font-bold shrink-0">
               {userData?.fullName?.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
               <p className="text-sm font-semibold truncate text-zinc-100">{userData?.fullName}</p>
               
               <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-1">
                  <span className="capitalize font-medium text-zinc-300">{userData?.role?.replace('_', ' ')}</span>
                  
                  {(userData?.role === 'unit_admin' || userData?.role === 'admin') && userData?.coopName && (
                     <>
                        <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0"></span>
                        <span className="truncate flex items-center gap-1">
                           <Building2 className="w-3 h-3 shrink-0" />
                           <span className="truncate">{userData?.coopName}</span>
                        </span>
                     </>
                  )}
               </div>
            </div>
          </div>
          
          <Link href="/marketplace" className="w-full">
            <Button variant="secondary" className="w-full h-7 text-[11px] bg-zinc-800 hover:bg-red-600 hover:text-white transition-colors border-none flex items-center justify-center">
               <ExternalLink className="w-3 h-3 mr-1.5" /> Ke Marketplace
            </Button>
          </Link>
        </div>
      )}

      {/* Area Menu Scroll */}
      <div className="flex-1 overflow-y-auto px-3 py-5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <div className="space-y-6">
          <nav className="space-y-1 pb-10">
            {mainItems.filter(i => userData?.role && i.roles.includes(userData.role)).map((item) => {
               const Icon = item.icon;
               const isActive = pathname === item.href;
               return (
                  <Link key={item.href} href={item.href} className="block mb-1">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-10 relative",
                        isActive 
                           ? "bg-red-600 text-white hover:bg-red-700 shadow-md font-medium" 
                           : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                      )}
                    >
                      <Icon className={cn("mr-3 h-4 w-4", isActive ? "text-white" : "text-zinc-500")} />
                      {item.label}
                      {item.hasNotification && <NotificationDot />}
                    </Button>
                  </Link>
               )
            })}

            <Separator className="my-3 bg-zinc-800" />

            {Object.entries(menuGroups).map(([key, group]) => {
              if (!userData?.role || !group.roles.includes(userData.role)) return null;
              
              const isOpen = openGroups[key];
              const GroupIcon = group.icon;
              const hasGroupNotification = group.items.some(i => i.hasNotification);

              return (
                <div key={key} className="mb-2">
                  <button
                    onClick={() => toggleGroup(key)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                      isOpen ? "text-white bg-zinc-800/50" : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {GroupIcon && <GroupIcon className="w-4 h-4" />}
                      <span>{group.title}</span>
                    </div>
                    {hasGroupNotification && !isOpen && (
                        <div className="mr-3"><NotificationDot /></div>
                    )}
                    {isOpen ? <ChevronDown className="w-3 h-3 opacity-50" /> : <ChevronRight className="w-3 h-3 opacity-50" />}
                  </button>

                  {isOpen && (
                    <div className="mt-1 ml-4 border-l border-zinc-800 pl-2 space-y-1 animate-in slide-in-from-left-2 duration-200">
                      {group.items.filter(i => userData?.role && i.roles.includes(userData.role)).map((item) => {
                        const isSubActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        const SubIcon = item.icon;
                        
                        return (
                          <Link key={item.href} href={item.href} className="block">
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start h-9 text-xs relative",
                                isSubActive 
                                   ? "text-red-400 bg-red-950/20 font-medium border-r-2 border-red-600 rounded-none" 
                                   : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                              )}
                            >
                              <SubIcon className={cn("mr-3 h-3 w-3", isSubActive ? "text-red-400" : "text-zinc-600")} />
                              {item.label}
                              {item.hasNotification && <NotificationDot />}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <Separator className="my-3 bg-zinc-800" />
            
            <Link href="/admin/settings" className="block">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-10",
                    pathname === '/admin/settings' 
                      ? "bg-zinc-800 text-white" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  )}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Pengaturan
                </Button>
            </Link>
          </nav>
        </div>
      </div>
      
      <div className="p-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
        <Button 
           variant="ghost" 
           className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-zinc-800/50 h-10"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  );
}