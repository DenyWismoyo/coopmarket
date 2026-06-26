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
  PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/components/auth/auth-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Import Hook Notifikasi
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
  
  // Ambil status notifikasi realtime
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
        { href: "/admin/products", label: "Produk", icon: Package, roles: ['super_admin', 'unit_admin', 'admin'] },
        { href: "/admin/inventory", label: "Stok & Opname", icon: ClipboardList, roles: ['unit_admin', 'admin'] },
        // Pasang Notifikasi Order disini
        { href: "/admin/orders", label: "Pesanan Online", icon: ShoppingBag, roles: ['super_admin', 'unit_admin', 'admin'], hasNotification: hasAdminOrders },
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
        // Pasang Notifikasi Member disini
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
    <div className="flex flex-col h-full bg-zinc-900 text-white">
      {!isMobile && (
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 font-bold text-xl">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-900/50">A</div>
            <span className="tracking-tight">Admin Panel</span>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-6">
          <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-800">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                   {userData?.fullName?.substring(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium truncate text-zinc-100">{userData?.fullName}</p>
                   <p className="text-[10px] text-zinc-400 capitalize">{userData?.role?.replace('_', ' ')}</p>
                </div>
             </div>
             {(userData?.role === 'unit_admin' || userData?.role === 'admin') && (
                <div className="text-[10px] bg-zinc-900/80 px-2 py-1.5 rounded border border-zinc-700 text-zinc-400 truncate flex items-center gap-1.5">
                   <Building2 className="w-3 h-3" />
                   {userData?.coopName}
                </div>
             )}
          </div>

          <nav className="space-y-1">
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
      </ScrollArea>
      
      <div className="p-4 border-t border-zinc-800 bg-zinc-900">
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