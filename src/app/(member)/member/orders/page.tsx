"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberService } from "@/services/member.service";
import { orderService } from "@/services/order.service"; // Tambahkan import ini
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Package, ShoppingBag, ChevronDown, CheckCircle, Truck, Store } from "lucide-react";
import Link from "next/link";
import { DocumentSnapshot } from "firebase/firestore";
import { toast } from "sonner";

export default function MemberOrdersPage() {
  const { userData } = useAuth();
  const queryClient = useQueryClient();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['myOrders', userData?.uid],
    queryFn: async ({ pageParam }) => {
      if (!userData?.uid) return { data: [], hasMore: false, lastVisible: undefined };
      return await memberService.getMyOrdersPaginated(userData.uid, 10, pageParam as DocumentSnapshot | undefined);
    },
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.lastVisible : undefined;
    },
    enabled: !!userData?.uid,
  });

  const orders = data?.pages.flatMap((page: any) => page.data) || [];

  // Mutation: Konfirmasi Terima Barang
  const confirmOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await orderService.updateOrderStatus(orderId, 'completed');
    },
    onSuccess: () => {
      toast.success("Pesanan selesai! Terima kasih telah berbelanja.");
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
    },
    onError: () => toast.error("Gagal mengonfirmasi pesanan.")
  });

  // --- KOMPONEN LOADING ---
  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  // --- RENDER UTAMA ---
  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Pesanan Saya</h1>
          <p className="text-zinc-500 text-sm">Riwayat belanja Anda di koperasi</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="text-center py-12 border-dashed bg-zinc-50/50 shadow-none">
           <CardContent className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Belum ada pesanan</h3>
                <p className="text-zinc-500 text-sm mb-4">Yuk mulai belanja kebutuhanmu di Marketplace!</p>
                <Link href="/member/shop">
                  <Button variant="default">Mulai Belanja</Button>
                </Link>
              </div>
           </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id} className="border-zinc-200 overflow-hidden hover:border-blue-300 transition-all">
              <CardHeader className="pb-3 border-b bg-zinc-50/30 py-3 px-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-semibold text-zinc-700">{order.sellerName || "Koperasi"}</span>
                  </div>
                  <Badge 
                    variant={order.status === 'completed' ? 'default' : 'secondary'}
                    className={
                        order.status === 'completed' ? 'bg-green-600' : 
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                        'bg-blue-50 text-blue-700'
                    }
                  >
                    {order.status === 'pending' ? 'Menunggu Konfirmasi' : 
                     order.status === 'processing' ? 'Diproses Penjual' :
                     order.status === 'shipped' ? 'Sedang Dikirim' :
                     order.status === 'ready_for_pickup' ? 'Siap Diambil' :
                     order.status === 'completed' ? 'Selesai' : 
                     order.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 px-4 pb-4">
                <div className="flex gap-4">
                  {/* Thumbnail Produk Pertama */}
                  <div className="w-16 h-16 bg-zinc-100 rounded-md border border-zinc-100 flex items-center justify-center shrink-0">
                     {order.items?.[0]?.image ? (
                        <img src={order.items[0].image} alt="Product" className="w-full h-full object-cover rounded-md" />
                     ) : (
                        <Package className="w-6 h-6 text-zinc-300" />
                     )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">
                        {order.items?.[0]?.productName}
                    </p>
                    {order.items.length > 1 && (
                        <p className="text-xs text-zinc-500 mt-0.5">+ {order.items.length - 1} produk lainnya</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-zinc-500">Total Belanja</p>
                        <p className="text-sm font-bold text-zinc-900">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Action Footer: Hanya muncul jika status Dikirim/Siap Diambil */}
              {(order.status === 'shipped' || order.status === 'ready_for_pickup') && (
                  <CardFooter className="bg-blue-50/50 px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs text-blue-700">
                          <Truck className="w-4 h-4" />
                          <span>Pesanan sudah sampai?</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 h-8"
                        onClick={() => confirmOrderMutation.mutate(order.id)}
                        disabled={confirmOrderMutation.isPending}
                      >
                        {confirmOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pesanan Diterima"}
                      </Button>
                  </CardFooter>
              )}
            </Card>
          ))}

          {hasNextPage && (
            <div className="text-center pt-4">
               <Button variant="ghost" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                 {isFetchingNextPage ? "Memuat..." : "Lihat Lebih Banyak"}
               </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}