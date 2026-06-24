"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { memberService } from "@/services/member.service";
import { productService } from "@/services/product.service";
import { orderService } from "@/services/order.service";
import { financeService } from "@/services/finance.service"; // IMPORT FINANCE SERVICE
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Package, 
  ShoppingBag, 
  Wallet, 
  TrendingUp, 
  ArrowUpRight,
  Store,
  CheckCircle2,
  PlusCircle,
  FileText
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
// Import Firestore langsung untuk query total anggota real-time
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";

export default function AdminDashboard() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalSavings: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      if (userData?.coopId) {
        try {
          // 1. Fetch Total Anggota (Real Count dari Firestore)
          const membersQuery = query(
            collection(db, "users"),
            where("coopId", "==", userData.coopId),
            where("role", "==", "member")
          );
          const membersSnapshot = await getCountFromServer(membersQuery);
          const realTotalMembers = membersSnapshot.data().count;

          // 2. Fetch Data Lainnya (Produk, Order, Aset) secara PARALLEL
          const [products, orders, totalAssets] = await Promise.all([
            productService.getPublicProductsByCoop(userData.coopId),
            orderService.getOrdersByCoop(userData.coopId),
            financeService.getCoopTotalAssets(userData.coopId) // FETCH TOTAL ASET REAL
          ]);

          // 3. Update State Statistik
          setStats({
            totalMembers: realTotalMembers,
            totalProducts: products.length,
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            totalSavings: totalAssets // DATA REAL
          });
        } catch (error) {
          console.error("Gagal memuat statistik:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    
    // Panggil fungsi fetch hanya jika userData sudah siap
    if (userData) {
        fetchStats();
    }
  }, [userData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-zinc-200 rounded-xl w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-zinc-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* --- HERO HEADER --- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-800 via-red-700 to-red-900 text-white shadow-xl shadow-red-900/20">
        {/* Dekorasi Latar Belakang */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-medium border border-white/10 backdrop-blur-sm">
                Dashboard Admin
              </span>
              {userData?.role === 'super_admin' && (
                <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-200 text-xs font-medium border border-yellow-500/30">
                  Super Admin
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
              Halo, {userData?.fullName?.split(" ")[0]}! 👋
            </h1>
            <p className="text-red-100/90 text-sm md:text-base flex items-center gap-2">
              <Store className="w-4 h-4" /> 
              {userData?.coopName || "Koperasi Merah Putih"}
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
             <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex-1 md:flex-none text-center min-w-[100px]">
                <p className="text-xs text-red-200 mb-1">Tanggal</p>
                <p className="font-semibold text-sm">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
             </div>
             <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex-1 md:flex-none text-center min-w-[100px]">
                <p className="text-xs text-red-200 mb-1">Pesanan</p>
                <p className="font-semibold text-sm">{stats.pendingOrders} Baru</p>
             </div>
          </div>
        </div>
      </div>

      {/* --- STATISTIK UTAMA (GRID) --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Card 1: Anggota */}
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-blue-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Anggota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-900">{stats.totalMembers}</span>
              <span className="text-xs text-green-600 font-medium flex items-center bg-green-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-1" /> +Aktif
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">Data terdaftar di unit</p>
          </CardContent>
        </Card>

        {/* Card 2: Pesanan */}
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="w-16 h-16 text-orange-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Pesanan Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-900">{stats.pendingOrders}</span>
              {stats.pendingOrders > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-2">Menunggu konfirmasi</p>
          </CardContent>
        </Card>

        {/* Card 3: Produk */}
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="w-16 h-16 text-purple-600" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-900">{stats.totalProducts}</span>
              <span className="text-xs text-zinc-500">Item</span>
            </div>
            <p className="text-xs text-zinc-400 mt-2">Aktif di etalase</p>
          </CardContent>
        </Card>

        {/* Card 4: Aset (Simpanan) */}
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-zinc-900 to-zinc-800 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-16 h-16 text-white" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Aset Simpanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold truncate">{formatCurrency(stats.totalSavings)}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Akumulasi unit</p>
          </CardContent>
        </Card>
      </div>

      {/* --- QUICK ACTIONS (FULL WIDTH) --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-red-600" /> Akses Cepat
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/orders" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100 hover:border-red-200 hover:shadow-md transition-all text-center h-full flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div>
                <span className="block text-sm font-bold text-zinc-800 group-hover:text-red-700">Cek Pesanan</span>
                <span className="text-xs text-zinc-500">Kelola order masuk</span>
              </div>
            </div>
          </Link>

          <Link href="/admin/approvals" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100 hover:border-red-200 hover:shadow-md transition-all text-center h-full flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="block text-sm font-bold text-zinc-800 group-hover:text-red-700">Validasi Produk</span>
                <span className="text-xs text-zinc-500">Review barang member</span>
              </div>
            </div>
          </Link>

          <Link href="/admin/products/new" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100 hover:border-red-200 hover:shadow-md transition-all text-center h-full flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlusCircle className="w-7 h-7" />
              </div>
              <div>
                <span className="block text-sm font-bold text-zinc-800 group-hover:text-red-700">Tambah Produk</span>
                <span className="text-xs text-zinc-500">Jual barang koperasi</span>
              </div>
            </div>
          </Link>

          <Link href="/admin/savings" className="group">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100 hover:border-red-200 hover:shadow-md transition-all text-center h-full flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <span className="block text-sm font-bold text-zinc-800 group-hover:text-red-700">Input Simpanan</span>
                <span className="text-xs text-zinc-500">Setor/tarik tunai</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Banner Info */}
        <div className="bg-gradient-to-r from-zinc-50 to-white border border-zinc-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-900">Butuh Bantuan Operasional?</h3>
              <p className="text-sm text-zinc-500">Pelajari cara mengelola simpanan dan SHU dengan efektif.</p>
            </div>
            <Button variant="outline" className="shrink-0 border-red-200 text-red-700 hover:bg-red-50">
              <FileText className="w-4 h-4 mr-2" /> Lihat Panduan
            </Button>
        </div>
      </div>
    </div>
  );
}