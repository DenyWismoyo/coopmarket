"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { productService } from "@/services/product.service";
import { orderService } from "@/services/order.service";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Store, 
  Package, 
  ShoppingBag, 
  Plus, 
  Settings, 
  TrendingUp, 
  ArrowRight,
  Eye,
  ExternalLink
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function MemberShopDashboard() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    async function fetchData() {
      if (user) {
        try {
          const [products, orders] = await Promise.all([
            productService.getSellerProducts(user.uid),
            orderService.getOrdersBySeller(user.uid)
          ]);

          const activeProds = products.filter(p => p.status === 'active');
          const completedOrders = orders.filter(o => o.status === 'completed');
          const pendingOrders = orders.filter(o => o.status === 'pending');
          const revenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

          setStats({
            totalProducts: products.length,
            activeProducts: activeProds.length,
            totalSales: completedOrders.length,
            pendingOrders: pendingOrders.length,
            totalRevenue: revenue
          });
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* --- HERO HEADER (Store Identity) --- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-xl shadow-blue-900/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
               <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                 <Store className="w-4 h-4 text-blue-50" />
               </div>
               <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">Dashboard Toko Member</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
              {userData?.shopName || userData?.fullName || "Toko Saya"}
            </h1>
            <p className="text-blue-100 max-w-lg text-sm md:text-base leading-relaxed">
              Kelola produk, pantau penjualan, dan atur performa tokomu dalam satu tempat.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl min-w-[160px] text-center shadow-lg">
             <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider mb-1">Total Pendapatan</p>
             <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* --- STATISTIK UTAMA --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-orange-500 bg-white group cursor-default">
           <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Pesanan Baru</p>
                 <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                    <ShoppingBag className="w-4 h-4 text-orange-600" />
                 </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 mb-1">{stats.pendingOrders}</p>
              <p className="text-xs text-zinc-400">Menunggu diproses</p>
           </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500 bg-white group cursor-default">
           <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Produk Aktif</p>
                 <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Package className="w-4 h-4 text-blue-600" />
                 </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 mb-1">{stats.activeProducts}</p>
              <p className="text-xs text-zinc-400">Dari {stats.totalProducts} total produk</p>
           </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500 bg-white group cursor-default">
           <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Total Terjual</p>
                 <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                 </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 mb-1">{stats.totalSales}</p>
              <p className="text-xs text-zinc-400">Transaksi sukses</p>
           </CardContent>
        </Card>

        <Card 
            className="hover:shadow-lg transition-all border-l-4 border-l-purple-500 cursor-pointer group bg-white hover:bg-purple-50/30" 
            onClick={() => window.open('/marketplace', '_blank')}
        >
           <CardContent className="p-5 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Marketplace</p>
                 <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <Eye className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                 </div>
              </div>
              <div>
                 <div className="flex items-center gap-2 mt-2 text-purple-700 font-bold text-sm">
                    <span>Lihat Etalase</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                 </div>
                 <p className="text-xs text-zinc-400 mt-1">Cek tampilan publik</p>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* --- QUICK ACTIONS (GRID BESAR) --- */}
      <div>
        <div className="flex items-center gap-2 mb-4">
           <div className="h-6 w-1 bg-blue-600 rounded-full" />
           <h2 className="text-lg font-bold text-zinc-900">Menu Pengelolaan</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Action 1: Tambah Produk */}
          <Link href="/member/shop/products/new" className="group">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-900/5 transition-all h-full flex flex-col items-center text-center gap-4 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform z-10 shadow-sm">
                  <Plus className="w-8 h-8" />
               </div>
               <div className="z-10 relative">
                  <h3 className="font-bold text-zinc-900 mb-1 group-hover:text-blue-700 transition-colors">Jual Produk Baru</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">Upload foto dan deskripsi barang daganganmu untuk mulai berjualan.</p>
               </div>
            </div>
          </Link>

          {/* Action 2: Kelola Produk */}
          <Link href="/member/shop/products" className="group">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-900/5 transition-all h-full flex flex-col items-center text-center gap-4 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform z-10 shadow-sm">
                  <Package className="w-8 h-8" />
               </div>
               <div className="z-10 relative">
                  <h3 className="font-bold text-zinc-900 mb-1 group-hover:text-orange-700 transition-colors">Daftar Produk</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">Edit harga, stok, varian, atau hapus produk yang sudah ada.</p>
               </div>
            </div>
          </Link>

          {/* Action 3: Pengaturan */}
          <Link href="/member/shop/settings" className="group">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-400 hover:shadow-xl transition-all h-full flex flex-col items-center text-center gap-4 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="w-16 h-16 bg-zinc-100 text-zinc-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform z-10 shadow-sm">
                  <Settings className="w-8 h-8" />
               </div>
               <div className="z-10 relative">
                  <h3 className="font-bold text-zinc-900 mb-1">Pengaturan Toko</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">Sesuaikan nama toko, alamat, dan informasi kontak profilmu.</p>
               </div>
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}