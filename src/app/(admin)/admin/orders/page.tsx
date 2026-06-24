"use client";

import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DocumentSnapshot } from "firebase/firestore";
import { 
  Search, 
  Loader2, 
  ChevronDown, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  Package,
  Clock,
  Printer
} from "lucide-react";
import { toast } from "sonner";

import { orderService } from "@/services/order.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default function AdminOrdersPage() {
  const { userData } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // 1. QUERY: Fetch Orders Pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['adminOrders', userData?.coopId],
    queryFn: async ({ pageParam }) => {
      if (!userData?.coopId) return { data: [], hasMore: false, lastVisible: undefined };
      return await orderService.getOrdersByCoopWithPagination(
        userData.coopId, 
        20, 
        pageParam as DocumentSnapshot | undefined
      );
    },
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    enabled: !!userData?.coopId,
  });

  const orders = data?.pages.flatMap((page: any) => page.data) || [];

  // Filter Search Sederhana (Client Side)
  const filteredOrders = orders.filter((o: any) => 
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.buyerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. MUTATION: Update Status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      await orderService.updateOrderStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.success("Status pesanan diperbarui");
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Helper Badge Color
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <Badge className="bg-green-600 hover:bg-green-700">Selesai</Badge>;
      case 'processing': return <Badge className="bg-blue-600 hover:bg-blue-700">Diproses</Badge>;
      case 'shipped': return <Badge className="bg-purple-600 hover:bg-purple-700">Dikirim</Badge>;
      case 'cancelled': return <Badge variant="destructive">Batal</Badge>;
      default: return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Menunggu</Badge>;
    }
  };

  // --- RENDER ---

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
           {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  if (isError) return <div className="p-8 text-center text-red-500">Error: {(error as Error).message}</div>;

  return (
    <div className="space-y-6 p-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Manajemen Pesanan</h1>
        <p className="text-sm text-zinc-500">Kelola transaksi masuk, proses pengiriman, dan status pembayaran.</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm max-w-md">
         <Search className="w-4 h-4 text-zinc-400 ml-2" />
         <Input 
           placeholder="Cari No. Order atau Nama Pembeli..." 
           className="border-none shadow-none focus-visible:ring-0 h-9"
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
         />
      </div>

      {/* Table Content */}
      <Card className="overflow-hidden border-zinc-200 shadow-sm">
         <div className="overflow-x-auto">
           <Table>
             <TableHeader className="bg-zinc-50">
               <TableRow>
                 <TableHead>Order ID</TableHead>
                 <TableHead>Pembeli</TableHead>
                 <TableHead>Tanggal</TableHead>
                 <TableHead>Total & Metode</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead className="text-right">Aksi</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredOrders.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                      Tidak ada pesanan ditemukan.
                   </TableCell>
                 </TableRow>
               ) : (
                 filteredOrders.map((order: any) => (
                   <TableRow key={order.id} className="hover:bg-zinc-50/50">
                     <TableCell className="font-mono font-medium">
                        {order.orderNumber}
                     </TableCell>
                     <TableCell>
                        <div className="font-medium text-zinc-900">{order.buyerName || 'Guest'}</div>
                        <div className="text-xs text-zinc-500">ID: {order.buyerId?.slice(0, 8)}...</div>
                     </TableCell>
                     <TableCell className="text-zinc-600 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                           day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                     </TableCell>
                     <TableCell>
                        <div className="font-bold text-blue-700">{formatCurrency(order.totalAmount || order.total)}</div>
                        <div className="text-xs text-zinc-500 uppercase flex items-center gap-1">
                           {order.paymentMethod === 'pos_cash' ? 'Tunai (Kasir)' : order.paymentMethod}
                        </div>
                     </TableCell>
                     <TableCell>
                        {getStatusBadge(order.status)}
                     </TableCell>
                     <TableCell className="text-right">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                             <MoreVertical className="w-4 h-4 text-zinc-400" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                           
                           <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'processing' })}>
                              <Package className="w-4 h-4 mr-2 text-blue-500" /> Proses Pesanan
                           </DropdownMenuItem>
                           
                           <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'shipped' })}>
                              <Truck className="w-4 h-4 mr-2 text-purple-500" /> Kirim Barang
                           </DropdownMenuItem>
                           
                           <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'completed' })}>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Selesai
                           </DropdownMenuItem>

                           <DropdownMenuSeparator />
                           
                           <DropdownMenuItem onClick={() => window.print()}>
                              <Printer className="w-4 h-4 mr-2" /> Cetak Struk
                           </DropdownMenuItem>
                           
                           <DropdownMenuSeparator />
                           
                           <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'cancelled' })}
                           >
                              <XCircle className="w-4 h-4 mr-2" /> Batalkan Pesanan
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>
      </Card>
      
      {/* Load More */}
      <div className="flex justify-center pt-4">
         {hasNextPage ? (
            <Button 
               variant="outline" 
               onClick={() => fetchNextPage()} 
               disabled={isFetchingNextPage}
            >
               {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
               Muat Lebih Banyak
            </Button>
         ) : (
            <p className="text-xs text-zinc-400">Total {orders.length} pesanan ditampilkan.</p>
         )}
      </div>
    </div>
  );
}