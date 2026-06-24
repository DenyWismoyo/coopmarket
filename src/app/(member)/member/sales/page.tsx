"use client";

import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DocumentSnapshot } from "firebase/firestore";
import { 
  Loader2, 
  Package, 
  ShoppingCart, 
  ChevronDown, 
  DollarSign, 
  Calendar, 
  User,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { memberService } from "@/services/member.service";
import { orderService } from "@/services/order.service"; // Perlu import ini
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MemberSalesPage() {
  const { userData } = useAuth();
  const queryClient = useQueryClient();
  
  // 1. Setup Infinite Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
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

  // 2. Mutation: Update Status Pesanan
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await orderService.updateOrderStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySales'] });
      // Juga invalidate dashboard stats jika perlu
      toast.success("Status pesanan diperbarui");
    },
    onError: (err: any) => toast.error("Gagal update: " + err.message)
  });

  // Helper Badge Warna
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <Badge className="bg-green-600 hover:bg-green-700">Selesai</Badge>;
      case 'processing': return <Badge className="bg-blue-600 hover:bg-blue-700">Diproses</Badge>;
      case 'shipped': return <Badge className="bg-purple-600 hover:bg-purple-700">Dikirim</Badge>;
      case 'ready_for_pickup': return <Badge className="bg-indigo-600 hover:bg-indigo-700">Siap Diambil</Badge>;
      case 'cancelled': return <Badge variant="destructive">Dibatalkan</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Menunggu Konfirmasi</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // --- SKELETON LOADING ---
  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="space-y-2">
           <Skeleton className="h-8 w-48" />
           <Skeleton className="h-4 w-64" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-zinc-100">
             <CardHeader className="pb-3 border-b bg-zinc-50/50">
               <Skeleton className="h-5 w-32" />
             </CardHeader>
             <CardContent className="pt-4">
               <Skeleton className="h-12 w-full" />
             </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Penjualan Saya</h1>
          <p className="text-zinc-500 text-sm">Kelola pesanan masuk dari pelanggan.</p>
        </div>
      </div>

      {/* Empty State */}
      {sales.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-2 shadow-none bg-zinc-50/50">
           <CardContent className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-zinc-300 shadow-sm">
                <DollarSign className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Belum ada penjualan</h3>
                <p className="text-zinc-500 text-sm max-w-sm">
                  Promosikan produkmu agar mendapatkan pesanan pertamamu!
                </p>
              </div>
           </CardContent>
        </Card>
      ) : (
        /* Sales List */
        <div className="space-y-4">
          {sales.map((order: any) => (
            <Card key={order.id} className="hover:border-blue-300 transition-colors duration-200">
              <CardHeader className="pb-3 border-b bg-zinc-50/30 px-4 py-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                     <Badge variant="outline" className="font-mono text-[10px] bg-white">
                        {order.orderNumber}
                     </Badge>
                     {getStatusBadge(order.status)}
                  </div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                     <Calendar className="w-3 h-3" />
                     {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                     })}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 px-4 pb-3">
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                          <User className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-sm font-semibold text-zinc-900">{order.buyerName}</p>
                          <p className="text-xs text-zinc-500">Pembeli</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-zinc-900">{formatCurrency(order.totalAmount)}</p>
                       <p className="text-xs text-zinc-500">{order.items?.length || 0} Barang</p>
                    </div>
                 </div>

                 {/* Ringkasan Item Pertama */}
                 {order.items && order.items.length > 0 && (
                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 text-sm text-zinc-600 mb-3">
                        <span className="font-medium text-zinc-900">{order.items[0].productName}</span>
                        {order.items.length > 1 && <span className="text-xs ml-1 italic">+ {order.items.length - 1} lainnya</span>}
                    </div>
                 )}
              </CardContent>

              <CardFooter className="px-4 py-3 bg-zinc-50/50 border-t flex justify-between items-center">
                 {/* Detail Pembayaran Sederhana */}
                 <div className="text-xs text-zinc-500">
                    Metode: <span className="font-medium capitalize">{order.paymentMethod?.replace('_', ' ')}</span>
                 </div>

                 {/* Tombol Aksi (Hanya muncul jika bukan cancelled/completed) */}
                 {['pending', 'processing', 'ready_for_pickup', 'shipped'].includes(order.status) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2">
                          Atur Status <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Update Pesanan</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {order.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({id: order.id, status: 'processing'})}>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" /> Terima & Proses
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({id: order.id, status: 'cancelled'})} className="text-red-600">
                              <XCircle className="w-4 h-4 mr-2" /> Tolak Pesanan
                            </DropdownMenuItem>
                          </>
                        )}

                        {order.status === 'processing' && (
                          <>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({id: order.id, status: 'shipped'})}>
                              <Truck className="w-4 h-4 mr-2 text-purple-600" /> Kirim Barang (Kurir)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({id: order.id, status: 'ready_for_pickup'})}>
                              <Package className="w-4 h-4 mr-2 text-indigo-600" /> Siap Diambil (Pickup)
                            </DropdownMenuItem>
                          </>
                        )}

                        {(order.status === 'shipped' || order.status === 'ready_for_pickup') && (
                           <DropdownMenuItem onClick={() => updateStatusMutation.mutate({id: order.id, status: 'completed'})}>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Selesaikan Pesanan
                           </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                 )}
                 
                 {/* Jika selesai */}
                 {order.status === 'completed' && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                       Transaksi Sukses
                    </Badge>
                 )}
              </CardFooter>
            </Card>
          ))}
          
          {hasNextPage && (
            <div className="flex justify-center pt-4">
               <Button 
                 variant="ghost" 
                 onClick={() => fetchNextPage()} 
                 disabled={isFetchingNextPage}
                 className="text-xs text-zinc-500"
               >
                 {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : "Muat lebih banyak..."}
               </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}