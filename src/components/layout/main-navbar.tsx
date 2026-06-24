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
import { ShoppingCart, LogOut, User, Store, LayoutDashboard } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CartSheet } from "@/components/layout/cart-sheet";
import { useState } from "react";
import Image from "next/image"; 

export function MainNavbar() {
  const { user, userData, loading } = useAuth();
  const totalCartItems = useCartStore((state) => state.totalItems());
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    toast.success("Berhasil keluar");
    router.push("/login");
  };

  const getInitials = (name: string) => name?.substring(0, 2).toUpperCase() || "U";

  // Cek akses admin
  const hasAdminAccess = userData?.role && ['admin', 'super_admin', 'unit_admin'].includes(userData.role);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
      {/* Container diubah jadi w-full dengan padding yang pas agar simetris */}
      <div className="w-full flex h-16 items-center justify-between px-4 md:px-8 lg:px-12">
        
        {/* LOGO AREA */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 font-bold text-xl text-zinc-900 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
                <Image 
                    src="/icon.png" 
                    alt="KopKel Logo" 
                    fill
                    className="object-contain"
                />
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-lg tracking-tight text-zinc-900 font-bold">CoopConnect</span>
                <span className="text-[10px] text-red-600 font-bold tracking-widest uppercase">Koperasi Merah Putih</span>
            </div>
          </Link>
          
          {/* Main Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
            <Link href="/marketplace" className="hover:text-red-600 transition-colors">Belanja</Link>
            <Link href="/about" className="hover:text-red-600 transition-colors">Tentang Kami</Link>
          </nav>
        </div>

        {/* ACTIONS AREA */}
        <div className="flex items-center gap-4">
          
          {/* Cart Button */}
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

          {/* User Menu / Auth Buttons */}
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
                
                {/* Menu Member */}
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
                
                {/* Menu Admin (Jika punya akses) */}
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