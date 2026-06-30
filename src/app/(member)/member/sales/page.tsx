"use client";

import { useState, useMemo } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { DocumentSnapshot } from "firebase/firestore";
import { 
  Loader2, Package, ShoppingCart, ChevronDown, Calendar, User, 
  Truck, CheckCircle2, Clock, AlertCircle, TrendingUp, BarChart3 
} from "lucide-react";
import { toast } from "sonner";
import { memberService } from "@/services/member.service";
import { orderService } from "@/services/order.service"; 
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type TimeFilter = 'harian' | 'mingguan' | 'bulanan' | 'semua';

export default function MemberSalesPage() {
  const { userData } = useAuth();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('semua');

  // Query Agregasi
  const { data: allOrders, isLoading: isLoadingStats } = useQuery({
    queryKey: ['sellerTotalSales', userData?.uid],
    queryFn: async () => await orderService.getOrdersBySeller(userData!.uid),
    enabled: !!userData?.uid,
  });

  // Kalkulasi Dinamis berdasarkan Filter Waktu (KHUSUS OMSET BARANG MEMBER)
  const salesStats = useMemo(() => {
    if (!allOrders) return { total: 0, count: 0 };
    const now = new Date();
    
    const filtered = allOrders.filter(order => {
      if (order.status === 'cancelled') return false;
      
      // Ambil barang-barang yang khusus milik member ini
      const myItems = order.items?.filter((i: any) => i.sellerId === userData?.uid || (!i.sellerId && order.sellerId === userData?.uid)) || [];
      if (myItems.length === 0) return false;

      const orderDate = new Date(order.createdAt);
      if (timeFilter === 'harian') {
        return orderDate.toDateString() === now.toDateString();
      } else if (timeFilter === 'mingguan') {
        const diffInTime = now.getTime() - orderDate.getTime();
        const diffInDays = diffInTime / (1000 * 3600 * 24);
        return diffInDays <= 7;
      } else if (timeFilter === 'bulanan') {
        return orderDate.getMonth() === now.getMonth() &&
               orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    return {
      total: filtered.reduce((acc, order) => {
         // Hanya hitung subtotal barang milik member
         const myItems = order.items?.filter((i: any) => i.sellerId === userData?.uid || (!i.sellerId && order.sellerId === userData?.uid)) || [];
         const myTotal = myItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
         return acc + myTotal;
      }, 0),
      count: filtered.length
    };
  }, [allOrders, timeFilter, userData]);

  // Infinite Query
  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading
  } = useInfiniteQuery({
    queryKey: ['mySales', userData?.uid],
    queryFn: async ({ pageParam }) => {
      if (!userData?.uid) return { data: [], hasMore: false, lastVisible: undefined };
      return await memberService.getMySalesPaginated(
        userData.uid, 
        10, 
        pageParam as DocumentSnapshot | undefined
      );
    },
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    enabled: !!userData?.uid,
  });

  const sales = data?.pages.flatMap((page: any) => page.data) || [];

  // Mutation: Update Status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await orderService.updateOrderStatus(id, status);
    },
    onMutate: (variables) => setUpdatingId(variables.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySales'] });
      queryClient.invalidateQueries({ queryKey: ['sellerTotalSales'] });
      toast.success("Status pesanan berhasil diperbarui!");
    },
    onError: (err: any) => toast.error("Gagal memperbarui: " + err.message),
    onSettled: () => setUpdatingId(null)
  });

  const handleUpdate = (id: string, status: string, confirmMessage?: string) => {
      if (confirmMessage && !window.confirm(confirmMessage)) return;
      updateStatusMutation.mutate({ id, status });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <Badge className="bg-green-600">Transaksi Selesai</Badge>;
      case 'processing': return <Badge className="bg-blue-600">Sedang Anda Proses</Badge>;
      case 'shipped': return <Badge className="bg-purple-600">Dalam Pengiriman</Badge>;
      case 'ready_for_pickup': return <Badge className="bg-indigo-600">Menunggu Diambil</Badge>;
      case 'cancelled': return <Badge variant="destructive">Pesanan Dibatalkan</Badge>;
      case 'pending': return <Badge className="bg-orange-500 animate-pulse">Pesanan Baru!</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusHelperText = (status: string) => {
    switch(status) {
      case 'pending': return "Pesanan baru masuk. Segera terima pesanan.";
      case 'processing': return "Siapkan barangnya dan pilih pengiriman.";
      case 'shipped': return "Barang sedang dikirim. Tunggu konfirmasi pembeli.";
      case 'ready_for_pickup': return "Barang siap diambil. Tunggu pembeli datang.";
      case 'completed': return "Dana sudah masuk. Transaksi berhasil diselesaikan.";
      case 'cancelled': return "Pesanan ini telah dibatalkan.";
      default: return "";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 max-w-3xl mx-auto">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="space-y-2 mt-8">
           <Skeleton className="h-8 w-48" />
           <Skeleton className="h-4 w-64" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-zinc-100">
             <CardHeader className="pb-3 border-b bg-zinc-50/50"><Skeleton className="h-5 w-32" /></CardHeader>
             <CardContent className="pt-4"><Skeleton className="h-20 w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Penjualan Saya</h1>
        <p className="text-zinc-500 text-sm">Kelola pesanan masuk dan pantau performa toko.</p>
      </div>

      {/* DASHBOARD STATISTIK PENJUALAN */}
      <Card className="relative overflow-hidden bg-zinc-900 text-white shadow-2xl shadow-zinc-200/50 border-none rounded-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        <CardContent className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-widest">Estimasi Pendapatan</span>
              </div>
              <div className="flex items-baseline gap-2">
                {isLoadingStats ? (
                  <Skeleton className="h-10 w-48 bg-white/10 rounded-lg" />
                ) : (
                  <motion.h2 
                    key={salesStats.total}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-bold tracking-tight"
                  >
                    {formatCurrency(salesStats.total)}
                  </motion.h2>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Dari <strong className="text-white">{salesStats.count} pesanan masuk</strong>
              </p>
            </div>

            <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/10">
              {(['harian', 'mingguan', 'bulanan', 'semua'] as TimeFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`
                    px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-300
                    ${timeFilter === filter 
                       ? 'bg-white text-zinc-900 shadow-sm' 
                       : 'text-zinc-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {sales.length === 0 ? (
        <Card className="text-center py-16 border-dashed border-2 shadow-none bg-zinc-50/50">
           <CardContent className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-300">
                <ShoppingCart className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Belum ada pesanan</h3>
                <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                  Terus promosikan toko dan produkmu agar mendapatkan pesanan pertama!
                </p>
              </div>
           </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {sales.map((order: any) => {
              const isUpdatingThis = updatingId === order.id;
              
              // Filter agar UI HANYA menampilkan rincian barang milik member
              const myItems = order.items?.filter((item: any) => item.sellerId === userData?.uid || (!item.sellerId && order.sellerId === userData?.uid)) || [];
              const myTotalAmount = myItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
              
              if (myItems.length === 0) return null; // Hide if no items belong to this member

              return (
              <motion.div 
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`overflow-hidden transition-all duration-300 shadow-sm ${order.status === 'pending' ? 'border-orange-300 shadow-orange-100 ring-1 ring-orange-100' : 'border-zinc-200 hover:border-blue-200'}`}>
                   
                   <CardHeader className={`pb-3 border-b px-4 py-3 ${order.status === 'pending' ? 'bg-orange-50/50' : 'bg-zinc-50/50'}`}>
                     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                       <div className="flex items-center gap-2">
                          {getStatusBadge(order.status)}
                       </div>
                       <div className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                             day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                       </div>
                     </div>
                   </CardHeader>
                   
                   <CardContent className="pt-4 px-4 pb-4 space-y-4">
                      
                      <div className="flex justify-between items-center bg-white p-3 border rounded-xl shadow-sm">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                               <User className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-xs text-zinc-500 font-medium">Pembeli</p>
                               <p className="text-sm font-bold text-zinc-900">{order.buyerName}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-xs text-zinc-500 font-medium">Omset Anda</p>
                            <p className="text-lg font-extrabold text-blue-700">{formatCurrency(myTotalAmount)}</p>
                         </div>
                      </div>

                      {/* TAMPILAN BARANG HANYA MILIK MEMBER */}
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-sm">
                         <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-200">
                             <Package className="w-4 h-4 text-zinc-400" />
                             <span className="font-semibold text-zinc-700">Barang Anda yang terjual ({myItems.length})</span>
                         </div>
                         <div className="space-y-1.5">
                             {myItems.map((item: any, idx: number) => (
                                 <div key={idx} className="flex justify-between items-start text-zinc-700">
                                     <span>{item.quantity}x {item.productName} {item.variant?.name ? `(${item.variant.name})` : ''}</span>
                                     <span className="font-medium text-zinc-900">{formatCurrency(item.price * item.quantity)}</span>
                                 </div>
                             ))}
                         </div>
                      </div>
                      
                      <div className="flex items-start gap-2 bg-blue-50/50 p-3 rounded-lg text-sm text-blue-800">
                         <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                         <p>{getStatusHelperText(order.status)}</p>
                      </div>

                   </CardContent>

                   <CardFooter className={`px-4 py-4 flex flex-col gap-3 border-t ${order.status === 'pending' ? 'bg-orange-50' : 'bg-white'}`}>
                      {/* PENTING: Tombol Aksi di Hide Jika Member Hanya Numpang Di POS Admin */}
                      {order.sellerId === userData?.uid ? (
                         <>
                           {order.status === 'pending' && (
                              <div className="flex flex-col sm:flex-row gap-3 w-full">
                                 <Button 
                                     className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 text-base font-bold transition-transform active:scale-[0.98]"
                                    onClick={() => handleUpdate(order.id, 'processing')}
                                    disabled={isUpdatingThis}
                                 >
                                    {isUpdatingThis ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Terima Pesanan</>}
                                 </Button>
                                 
                                 <Button 
                                     variant="outline"
                                    className="sm:w-32 h-11 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold"
                                    onClick={() => handleUpdate(order.id, 'cancelled', 'Yakin ingin menolak pesanan ini?')}
                                    disabled={isUpdatingThis}
                                 >
                                    Tolak
                                 </Button>
                              </div>
                           )}
                           {order.status === 'processing' && (
                              <div className="flex flex-col sm:flex-row gap-3 w-full">
                                 <Button 
                                     className="flex-1 bg-purple-600 hover:bg-purple-700 h-11 font-bold"
                                    onClick={() => handleUpdate(order.id, 'shipped')}
                                    disabled={isUpdatingThis}
                                 >
                                    {isUpdatingThis ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Truck className="w-5 h-5 mr-2" /> Kirim Barang via Kurir</>}
                                 </Button>
                                 <Button 
                                     className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-11 font-bold"
                                    onClick={() => handleUpdate(order.id, 'ready_for_pickup')}
                                    disabled={isUpdatingThis}
                                 >
                                    {isUpdatingThis ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Package className="w-5 h-5 mr-2" /> Barang Siap Diambil</>}
                                 </Button>
                              </div>
                           )}
                           {(order.status === 'shipped' || order.status === 'ready_for_pickup') && (
                               <Button 
                                   variant="outline"
                                  className="w-full text-green-700 border-green-200 hover:bg-green-50"
                                  onClick={() => handleUpdate(order.id, 'completed', 'PENTING: Lanjutkan hanya jika pembeli lupa menekan tombol konfirmasi.')}
                                  disabled={isUpdatingThis}
                               >
                                  {isUpdatingThis ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                  Selesaikan Secara Paksa
                               </Button>
                           )}
                         </>
                      ) : (
                         <div className="text-center w-full">
                            <span className="text-[10px] text-zinc-400 font-medium">Transaksi ini diproses melalui Kasir Admin Unit</span>
                         </div>
                      )}
                   </CardFooter>
                </Card>
              </motion.div>
              );
            })}
          </AnimatePresence>
          
          {hasNextPage && (
            <div className="flex justify-center pt-4">
               <Button 
                   variant="secondary" 
                   onClick={() => fetchNextPage()} 
                   disabled={isFetchingNextPage}
                  className="shadow-sm rounded-full px-8 hover:bg-zinc-200 transition-colors"
               >
                 {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <ChevronDown className="w-4 h-4 mr-2"/>}
                 Tampilkan Pesanan Lama
               </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}