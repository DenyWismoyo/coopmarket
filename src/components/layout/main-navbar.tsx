// File: src/components/layout/main-navbar.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useCartStore } from "@/lib/store/use-cart-store"; 
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShoppingCart, LogOut, User, Store, LayoutDashboard, MonitorPlay, Download, Bell, ShoppingBag } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CartSheet } from "@/components/layout/cart-sheet";
import { useState } from "react";
import Image from "next/image";

// Import Hooks
import { useNotifications } from "@/hooks/use-notifications";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function MainNavbar() {
  const { user, userData, loading } = useAuth();
  const totalCartItems = useCartStore((state) => state.totalItems());
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Panggil Data Notifikasi Realtime
  const { totalNotifications, notificationsList } = useNotifications();

  // Panggil Custom Hook PWA (Jauh lebih bersih)
  const { isInstallable, triggerInstall } = usePWAInstall();

  const handleLogout = async () => {
    await authService.logout();
    toast.success("Berhasil keluar");
    router.push("/login");
  };

  const getInitials = (name: string) => name?.substring(0, 2).toUpperCase() || "U";
  const hasAdminAccess = userData?.role && ['admin', 'super_admin', 'unit_admin'].includes(userData.role);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="w-full flex h-16 items-center justify-between px-4 md:px-8 lg:px-12">
        
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex items-center gap-3 font-bold text-xl text-zinc-900 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
                <Image 
                    src="/icon.png" 
                    alt="KopKel Logo" 
                    fill
                    className="object-contain"
                />
            </div>
            <div className="flex flex-col leading-none hidden sm:flex">
                <span className="text-lg tracking-tight text-zinc-900 font-bold">CoopConnect</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
            <Link href="/marketplace" className="hover:text-red-600 transition-colors">Belanja</Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">Tentang Kami</Link>
            
            {/* Menu Riwayat Transaksi / Pesanan Saya (Hanya tampil jika sudah login) */}
            {user && (
               <Link 
                  href={userData?.role === 'customer' ? '/orders' : '/member/orders'} 
                  className="hover:text-red-600 transition-colors flex items-center gap-1.5"
               >
                 <ShoppingBag className="w-4 h-4" /> Pesanan Saya
               </Link>
            )}
            
            {hasAdminAccess && (
              <Link 
                  href="/catalog-display" 
                  className="relative inline-flex items-center gap-2 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-red-600 via-amber-500 to-red-600 bg-[length:200%_auto] rounded-full shadow-md shadow-red-200 transition-all duration-500 hover:bg-right hover:scale-105 border border-red-500/50 overflow-hidden animate-pulse hover:animate-none"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <MonitorPlay className="w-3.5 h-3.5" />
                <span>Display Katalog</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Tombol Instal Aplikasi PWA */}
          {isInstallable && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                triggerInstall();
                toast.success("Mulai menginstal aplikasi!");
              }}
              className="hidden sm:flex text-red-600 border-red-200 hover:bg-red-50 transition-all duration-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Instal App
            </Button>
          )}

          {/* FUNGSI DROPDOWN NOTIFIKASI LONCENG */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-zinc-100">
                  <Bell className="w-5 h-5 text-zinc-600" />
                  {totalNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 mt-2">
                <DropdownMenuLabel>Pemberitahuan</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationsList.length === 0 ? (
                  <div className="p-4 text-center text-sm text-zinc-500">
                    Tidak ada pemberitahuan baru
                  </div>
                ) : (
                  notificationsList.map(notif => (
                    <DropdownMenuItem 
                       key={notif.id} 
                       onClick={() => router.push(notif.href)} 
                       className="cursor-pointer flex flex-col items-start gap-0.5 p-3 hover:bg-red-50"
                    >
                      <span className="font-semibold text-sm text-zinc-900">{notif.title}</span>
                      <span className="text-xs text-zinc-500">{notif.desc}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-red-50 hover:text-red-600"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center animate-in zoom-in">
                {totalCartItems}
              </span>
            )}
          </Button>

          {loading ? (
             <div className="w-8 h-8 rounded-full bg-zinc-200 animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-red-100 transition-all p-0">
                  <Avatar className="h-9 w-9 border border-zinc-200">
                    <AvatarImage src={userData?.photoURL} alt={userData?.fullName} />
                    <AvatarFallback className="bg-red-50 text-red-700 font-bold">
                      {getInitials(userData?.fullName || "")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userData?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userData?.email}</p>
                    <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded w-fit mt-1 capitalize font-bold border border-red-100">
                      {userData?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                {/* Menu Riwayat Pesanan / Transaksi di Dropdown */}
                <DropdownMenuItem onClick={() => router.push(userData?.role === 'customer' ? '/orders' : '/member/orders')} className="cursor-pointer font-medium">
                  <ShoppingBag className="mr-2 h-4 w-4 text-zinc-500" /> Pesanan Saya
                </DropdownMenuItem>
                
                {userData?.role === 'customer' && (
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4 text-zinc-500" /> Profil Saya
                  </DropdownMenuItem>
                )}
                {userData?.role === 'member' && (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/member')} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4 text-zinc-500" /> Area Member
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/member/shop')} className="cursor-pointer">
                      <Store className="mr-2 h-4 w-4 text-zinc-500" /> Toko Saya
                    </DropdownMenuItem>
                  </>
                )}
                
                {hasAdminAccess && (
                  <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer bg-zinc-50">
                    <LayoutDashboard className="mr-2 h-4 w-4 text-zinc-500" /> Dashboard Admin
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Keluar
                </DropdownMenuItem>
                
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
               <Link href="/login">
                 <Button variant="ghost" className="hover:text-red-600 hover:bg-red-50 font-medium">Masuk</Button>
               </Link>
               <Link href="/register">
                 <Button className="bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200 font-bold px-6">Daftar</Button>
               </Link>
            </div>
          )}
        </div>
      </div>
      
      <CartSheet open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}