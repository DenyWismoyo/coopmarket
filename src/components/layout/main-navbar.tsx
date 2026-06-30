// File: src/components/layout/main-navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { ShoppingCart, LogOut, User, Store, LayoutDashboard, MonitorPlay, Download, Bell, ShoppingBag, Home, Search } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CartSheet } from "@/components/layout/cart-sheet";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useNotifications } from "@/hooks/use-notifications";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function MainNavbar() {
  const { user, userData, loading } = useAuth();
  const totalCartItems = useCartStore((state) => state.totalItems());
  const router = useRouter();
  const pathname = usePathname();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { totalNotifications, notificationsList } = useNotifications();
  const { isInstallable, triggerInstall } = usePWAInstall();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    toast.success("Berhasil keluar");
    router.push("/login");
  };

  const getInitials = (name: string) => name?.substring(0, 2).toUpperCase() || "U";
  const hasAdminAccess = userData?.role && ['admin', 'super_admin', 'unit_admin'].includes(userData.role);

  return (
    <>
      {/* HEADER ATAS (Desktop & Mobile Minimal) */}
      <header className={`sticky top-0 z-40 w-full transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-zinc-200/50 shadow-sm' : 'bg-white/80 backdrop-blur-md border-b'}`}>
        <div className="w-full flex h-16 items-center justify-between px-4 md:px-8 lg:px-12">
          
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-3 font-bold text-xl text-zinc-900 group">
              <div className="relative w-10 h-10 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
                  <Image src="/icon.png" alt="Logo" fill className="object-contain drop-shadow-md" />
              </div>
              <div className="flex-col leading-none hidden sm:flex">
                  <span className="text-lg tracking-tight text-zinc-900 font-extrabold">CoopConnect</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-zinc-600">
              <Link href="/marketplace" className={`hover:text-red-600 transition-colors ${pathname === '/marketplace' ? 'text-red-600' : ''}`}>Belanja</Link>
              <Link href="/about" className="hover:text-red-600 transition-colors">Tentang Kami</Link>
              
              {user && (
                 <Link href={userData?.role === 'customer' ? '/orders' : '/member/orders'} className="hover:text-red-600 transition-colors flex items-center gap-1.5">
                   <ShoppingBag className="w-4 h-4" /> Pesanan Saya
                 </Link>
              )}
              
              {hasAdminAccess && (
                <Link href="/catalog-display" className="relative inline-flex items-center gap-2 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-red-600 via-amber-500 to-red-600 bg-[length:200%_auto] rounded-full shadow-md transition-all duration-500 hover:bg-right hover:scale-105 overflow-hidden">
                  <MonitorPlay className="w-3.5 h-3.5" />
                  <span>Display Katalog</span>
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            {isInstallable && (
              <Button variant="outline" size="sm" onClick={() => { triggerInstall(); toast.success("Mulai menginstal!"); }} className="hidden sm:flex text-red-600 border-red-200 hover:bg-red-50 rounded-full">
                <Download className="w-4 h-4 mr-2" /> Instal App
              </Button>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-zinc-100 rounded-full">
                    <Bell className="w-5 h-5 text-zinc-600" />
                    {totalNotifications > 0 && (
                      <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 border-2 border-white"></span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 mt-2 rounded-2xl shadow-xl border-zinc-100">
                  <DropdownMenuLabel>Pemberitahuan</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notificationsList.length === 0 ? (
                    <div className="p-6 text-center text-sm text-zinc-500">Tidak ada pemberitahuan</div>
                  ) : (
                    notificationsList.map(notif => (
                      <DropdownMenuItem key={notif.id} onClick={() => router.push(notif.href)} className="cursor-pointer flex flex-col items-start gap-1 p-3 hover:bg-red-50 rounded-xl m-1">
                        <span className="font-bold text-sm text-zinc-900">{notif.title}</span>
                        <span className="text-xs text-zinc-500 line-clamp-2">{notif.desc}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Desktop Cart Button (Sembunyikan icon keranjang atas di Mobile karena sudah ada di Bottom Nav) */}
            <Button variant="ghost" size="icon" className="hidden md:flex relative hover:bg-red-50 hover:text-red-600 rounded-full" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="w-5 h-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white animate-in zoom-in">
                  {totalCartItems}
                </span>
              )}
            </Button>

            {loading ? (
               <div className="w-9 h-9 rounded-full bg-zinc-200 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-red-200 transition-all p-0">
                    <Avatar className="h-10 w-10 border border-zinc-200 shadow-sm">
                      <AvatarImage src={userData?.photoURL} alt={userData?.fullName} />
                      <AvatarFallback className="bg-gradient-to-br from-red-100 to-red-50 text-red-700 font-bold">
                        {getInitials(userData?.fullName || "")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 mt-2 rounded-2xl shadow-xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none">{userData?.fullName}</p>
                      <p className="text-xs leading-none text-zinc-500 mt-1">{userData?.email}</p>
                      <span className="text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded w-fit mt-2 capitalize font-bold border border-red-100">
                        {userData?.role?.replace('_', ' ')}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(userData?.role === 'customer' ? '/orders' : '/member/orders')} className="cursor-pointer py-2.5 rounded-lg m-1 font-medium">
                    <ShoppingBag className="mr-3 h-4 w-4 text-zinc-500" /> Pesanan Saya
                  </DropdownMenuItem>
                  {userData?.role === 'member' && (
                    <>
                      <DropdownMenuItem onClick={() => router.push('/member')} className="cursor-pointer py-2.5 rounded-lg m-1">
                        <User className="mr-3 h-4 w-4 text-zinc-500" /> Area Member
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/member/shop')} className="cursor-pointer py-2.5 rounded-lg m-1">
                        <Store className="mr-3 h-4 w-4 text-zinc-500" /> Toko Saya
                      </DropdownMenuItem>
                    </>
                  )}
                  {hasAdminAccess && (
                    <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer py-2.5 rounded-lg m-1 bg-zinc-50 font-semibold">
                      <LayoutDashboard className="mr-3 h-4 w-4 text-zinc-600" /> Dashboard Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer py-2.5 rounded-lg m-1">
                    <LogOut className="mr-3 h-4 w-4" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                 <Link href="/login">
                   <Button variant="ghost" className="hover:text-red-600 font-semibold rounded-full hidden sm:flex">Masuk</Button>
                 </Link>
                 <Link href="/register">
                   <Button className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 font-bold rounded-full px-5">Daftar</Button>
                 </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BOTTOM NAVIGATION BAR (Khusus Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-zinc-200 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
         <div className="flex justify-around items-center h-16">
            <Link href="/" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${pathname === '/' ? 'text-red-600' : 'text-zinc-500'}`}>
               <Home className={`w-5 h-5 ${pathname === '/' ? 'fill-red-100' : ''}`} />
               <span className="text-[10px] font-medium">Beranda</span>
            </Link>
            
            <Link href="/marketplace" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${pathname === '/marketplace' ? 'text-red-600' : 'text-zinc-500'}`}>
               <Store className={`w-5 h-5 ${pathname === '/marketplace' ? 'fill-red-100' : ''}`} />
               <span className="text-[10px] font-medium">Market</span>
            </Link>

            <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center justify-center w-full h-full gap-1 text-zinc-500 relative">
               <div className="relative">
                 <ShoppingCart className="w-5 h-5" />
                 {totalCartItems > 0 && (
                    <span className="absolute -top-1.5 -right-2 h-4 w-4 rounded-full bg-red-600 text-[9px] font-bold text-white flex items-center justify-center border border-white">
                      {totalCartItems}
                    </span>
                 )}
               </div>
               <span className="text-[10px] font-medium">Keranjang</span>
            </button>

            {user && (
              <Link href={userData?.role === 'customer' ? '/orders' : '/member/orders'} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${pathname.includes('/orders') ? 'text-red-600' : 'text-zinc-500'}`}>
                 <ShoppingBag className={`w-5 h-5 ${pathname.includes('/orders') ? 'fill-red-100' : ''}`} />
                 <span className="text-[10px] font-medium">Pesanan</span>
              </Link>
            )}

            {!user && (
              <Link href="/login" className="flex flex-col items-center justify-center w-full h-full gap-1 text-zinc-500">
                 <User className="w-5 h-5" />
                 <span className="text-[10px] font-medium">Login</span>
              </Link>
            )}
         </div>
      </div>
      
      <CartSheet open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}