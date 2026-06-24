"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { financeService } from "@/services/finance.service";
import { productService } from "@/services/product.service";
import { Product } from "@/types/product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { 
  Wallet, 
  Store, 
  ArrowRight, 
  MonitorPlay,
  TrendingUp,
  PlusCircle,
  ShoppingBag,
  CreditCard
} from "lucide-react";
import Image from "next/image";

export default function MemberDashboard() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ total: 0, pokok: 0, wajib: 0, sukarela: 0 });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (user && userData?.coopId) {
        try {
          const [bal, products] = await Promise.all([
            financeService.getMemberBalance(user.uid),
            productService.getPublicProductsByCoop(userData.coopId)
          ]);
          setBalance(bal);
          setRecentProducts(products.slice(0, 5));
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [user, userData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[...Array(4)].map((_,i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* SECTION 1: KARTU ANGGOTA & SALDO (ATM Style) */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-900 text-white shadow-2xl shadow-zinc-200">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative p-6 md:p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest mb-1">Total Aset Simpanan</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{formatCurrency(balance.total)}</h2>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${userData?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-xs font-medium">{userData?.status === 'active' ? 'Member Aktif' : 'Pending'}</span>
              </div>
            </div>
            <Wallet className="md:hidden w-6 h-6 text-zinc-400" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
             <div>
                <p className="text-xs text-zinc-400 mb-1">Simpanan Wajib</p>
                <p className="font-semibold text-lg">{formatCurrency(balance.wajib)}</p>
             </div>
             <div>
                <p className="text-xs text-zinc-400 mb-1">Simpanan Pokok</p>
                <p className="font-semibold text-lg">{formatCurrency(balance.pokok)}</p>
             </div>
             <div>
                <p className="text-xs text-zinc-400 mb-1">Sukarela</p>
                <p className="font-semibold text-lg">{formatCurrency(balance.sukarela)}</p>
             </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: AKSES CEPAT (Quick Actions) */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Panel Penjual (Seller) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" /> Area Penjual & Bisnis
          </h3>
          <div className="grid grid-cols-2 gap-3">
             <Link href="/member/shop/pos" className="block">
                <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full border-zinc-200">
                   <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                         <MonitorPlay className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-800">Kasir Toko</p>
                        <p className="text-[10px] text-zinc-500">Buat transaksi POS</p>
                      </div>
                   </CardContent>
                </Card>
             </Link>
             <Link href="/member/shop/products/new" className="block">
                <Card className="hover:border-blue-500 hover:shadow-md transition-all cursor-pointer h-full border-zinc-200">
                   <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                         <PlusCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-800">Tambah Produk</p>
                        <p className="text-[10px] text-zinc-500">Jual barang baru</p>
                      </div>
                   </CardContent>
                </Card>
             </Link>
          </div>
        </div>

        {/* Panel Pembeli (Buyer) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-orange-600" /> Area Belanja
          </h3>
          <div className="grid grid-cols-2 gap-3">
             <Link href="/member/shop" className="block">
                <Card className="hover:border-orange-500 hover:shadow-md transition-all cursor-pointer h-full border-zinc-200">
                   <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                      <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                         <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-800">Marketplace</p>
                        <p className="text-[10px] text-zinc-500">Belanja di Koperasi</p>
                      </div>
                   </CardContent>
                </Card>
             </Link>
             <Link href="/member/orders" className="block">
                <Card className="hover:border-orange-500 hover:shadow-md transition-all cursor-pointer h-full border-zinc-200">
                   <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                      <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                         <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-800">Pesanan Saya</p>
                        <p className="text-[10px] text-zinc-500">Cek status paket</p>
                      </div>
                   </CardContent>
                </Card>
             </Link>
          </div>
        </div>

      </div>

      {/* SECTION 3: PRODUK TERBARU KOPERASI */}
      {recentProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-zinc-900">Produk Koperasi Terbaru</h3>
            <Link href="/member/shop" className="text-xs font-medium text-red-600 flex items-center gap-1 hover:underline">
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recentProducts.map((product) => (
              <Link key={product.id} href={`/member/shop/products/${product.id}`} className="group block">
                <Card className="overflow-hidden h-full hover:shadow-lg transition-all border-zinc-200 hover:border-red-200">
                  <div className="relative aspect-square bg-zinc-100 overflow-hidden">
                    {product.images?.[0] ? (
                      <Image 
                        src={product.images[0]} 
                        alt={product.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-300">
                         <Store className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h4 className="text-xs font-medium text-zinc-900 truncate mb-1 group-hover:text-red-600 transition-colors">
                        {product.name}
                    </h4>
                    <p className="text-sm font-bold text-red-600">{formatCurrency(product.price)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}