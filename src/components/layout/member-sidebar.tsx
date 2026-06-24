"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  ShoppingBag, 
  Store, 
  Wallet,
  User,
  LogOut,
  LayoutDashboard,
  TrendingUp,
  History,
  MonitorPlay,
  CreditCard,
  Building2,
  ExternalLink,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/components/auth/auth-provider";
import { JSX } from "react";

// Definisi Tipe Data Menu
type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon | ((props: any) => JSX.Element);
  external?: boolean; // Properti opsional
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

export function MemberSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userData } = useAuth();

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  // Definisi Menu dengan Grouping yang disempurnakan
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
        { href: "/member/shop", label: "Dashboard Toko", icon: Store }, // Pointing to Seller Dashboard
        { href: "/member/shop/products", label: "Produk Saya", icon: PackageIcon },
        { href: "/member/shop/pos", label: "Kasir / POS", icon: MonitorPlay },
        { href: "/member/sales", label: "Laporan Penjualan", icon: TrendingUp },
      ]
    },
    {
      title: "Aktivitas Belanja",
      items: [
        { href: "/member/orders", label: "Pesanan Saya", icon: ShoppingBag },
        // Link Eksternal ke Marketplace (karena user bilang member/shop bukan marketplace)
        { href: "/marketplace", label: "Ke Marketplace", icon: ExternalLink, external: true },
      ]
    }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-zinc-200 min-h-screen">
      {/* Header Sidebar */}
      <div className="p-6 border-b border-zinc-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-blue-200">
          <CreditCard className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-zinc-900 leading-none">Member Area</h2>
          <span className="text-[10px] text-zinc-500 font-medium">Koperasi Digital</span>
        </div>
      </div>
      
      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
        {/* User Info Compact */}
        {userData && (
           <div className="mb-6 p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                {userData.fullName?.substring(0,2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Login Sebagai</p>
                <p className="font-bold text-zinc-900 truncate text-sm">{userData.fullName}</p>
              </div>
           </div>
        )}

        {/* Menu Iteration */}
        <div className="space-y-8">
          {menuGroups.map((group, index) => (
            <div key={index}>
              <h3 className="px-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                {group.title}
              </h3>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  // Logic active state yang ketat agar tidak salah highlight
                  // Cek exact match untuk root menu, atau startsWith untuk submenu
                  const isActive = pathname === item.href || (item.href !== '/member' && pathname.startsWith(item.href + '/'));
                  
                  if (item.external) {
                    return (
                        <Link key={item.href} href={item.href} className="block">
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-9 text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Icon className="mr-3 h-4 w-4" />
                            {item.label}
                          </Button>
                        </Link>
                    )
                  }

                  return (
                    <Link key={item.href} href={item.href} className="block">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-9 transition-all duration-200",
                          isActive 
                            ? "bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100 translate-x-1" 
                            : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                        )}
                      >
                        <Icon className={cn("mr-3 h-4 w-4", isActive ? "text-blue-600" : "text-zinc-400")} />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          {/* Settings Section terpisah */}
          <div>
            <h3 className="px-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Akun
            </h3>
            <nav className="space-y-1">
              <Link href="/member/profile">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-9 transition-all duration-200",
                    pathname === "/member/profile"
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100 translate-x-1" 
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  )}
                >
                  <User className={cn("mr-3 h-4 w-4", pathname === "/member/profile" ? "text-blue-600" : "text-zinc-400")} />
                  Profil & Keamanan
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Footer / Logout */}
      <div className="p-4 border-t border-zinc-100 bg-zinc-50/30">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-zinc-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Keluar Aplikasi
        </Button>
      </div>
    </div>
  );
}

// Icon Helper untuk Sidebar
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