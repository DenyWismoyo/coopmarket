"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useInfiniteQuery } from "@tanstack/react-query";
import { financeService } from "@/services/finance.service";
import { orderService } from "@/services/order.service";
import { Order } from "@/types/order";
import { SavingTransaction } from "@/types/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  Download, 
  ShoppingBag, 
  Wallet, 
  Printer, 
  Store, 
  User, 
  Globe, 
  ArrowDown,
  ChevronDown
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ReceiptDialog } from "@/components/modules/orders/receipt-dialog";
import { DocumentSnapshot } from "firebase/firestore";

export default function AdminHistoryPage() {
  const { userData } = useAuth();
  
  // Filter Client-Side (Search pada data yang sudah dimuat)
  const [search, setSearch] = useState("");

  // Cetak Struk
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // ----------------------------------------------------------------------
  // 1. QUERY: Orders (Belanja)
  // ----------------------------------------------------------------------
  const {
    data: ordersData,
    fetchNextPage: fetchNextOrders,
    hasNextPage: hasNextOrders,
    isFetchingNextPage: loadingMoreOrders,
    isLoading: loadingOrdersInitial
  } = useInfiniteQuery({
    queryKey: ['adminHistoryOrders', userData?.coopId],
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

  const orders = ordersData?.pages.flatMap((page) => page.data) || [];

  // ----------------------------------------------------------------------
  // 2. QUERY: Savings (Simpanan)
  // ----------------------------------------------------------------------
  const {
    data: savingsData,
    fetchNextPage: fetchNextSavings,
    hasNextPage: hasNextSavings,
    isFetchingNextPage: loadingMoreSavings,
    isLoading: loadingSavingsInitial
  } = useInfiniteQuery({
    queryKey: ['adminHistorySavings', userData?.coopId],
    queryFn: async ({ pageParam }) => {
      if (!userData?.coopId) return { data: [], hasMore: false, lastVisible: undefined };
      return await financeService.getTransactionsByCoopPaginated(
        userData.coopId, 
        20, 
        pageParam as DocumentSnapshot | undefined
      );
    },
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    enabled: !!userData?.coopId,
  });

  const savings = savingsData?.pages.flatMap((page) => page.data) || [];

  // ----------------------------------------------------------------------
  // FILTERING (Client-side Search on Loaded Data)
  // ----------------------------------------------------------------------
  const filteredOrders = orders.filter((o: Order) => 
    o.buyerName.toLowerCase().includes(search.toLowerCase()) || 
    o.orderNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSavings = savings.filter((s: SavingTransaction) => 
    (s.userName || "").toLowerCase().includes(search.toLowerCase())
  );

  const handlePrintReceipt = (order: any) => {
    setSelectedOrder(order);
    setIsReceiptOpen(true);
  };

  // Helper Badge Kasir/Channel
  const getChannelBadge = (order: Order) => {
    if (order.isOffline) {
        if (order.sellerType === 'coop') {
            return (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 w-fit">
                    <Store className="w-3 h-3" /> Kasir Koperasi
                </Badge>
            );
        } else {
            return (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 w-fit">
                    <User className="w-3 h-3" /> Kasir Member
                </Badge>
            );
        }
    } else {
        return (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 w-fit">
                <Globe className="w-3 h-3" /> Marketplace
            </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Riwayat Transaksi Unit</h1>
          <p className="text-zinc-500">Laporan lengkap aktivitas belanja dan simpanan anggota.</p>
        </div>
        <Button variant="outline" className="text-zinc-600">
           <Download className="w-4 h-4 mr-2" /> Export Data (CSV)
        </Button>
      </div>

      <div className="relative max-w-md">
         <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
         <Input 
            placeholder="Cari Nama Anggota / No. Order..." 
            className="pl-9 bg-white shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
         />
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2 bg-zinc-100 p-1 rounded-lg">
          <TabsTrigger value="orders">Transaksi Belanja</TabsTrigger>
          <TabsTrigger value="savings">Mutasi Simpanan</TabsTrigger>
        </TabsList>

        {/* ======================= TAB BELANJA ======================= */}
        <TabsContent value="orders" className="mt-4 space-y-4">
           <Card className="border-zinc-200 shadow-sm">
              <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-3">
                 <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-base text-zinc-700">
                        <ShoppingBag className="w-4 h-4" /> Log Pesanan
                    </CardTitle>
                    <span className="text-xs text-zinc-500 bg-white px-2 py-1 rounded border">
                        {orders.length} Dimuat
                    </span>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[140px]">Tanggal</TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Anggota</TableHead>
                            <TableHead>Kasir / Channel</TableHead> 
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right w-[80px]">Aksi</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {loadingOrdersInitial ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-zinc-400"/></TableCell></TableRow>
                        ) : filteredOrders.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-zinc-500">Tidak ada data transaksi.</TableCell></TableRow>
                        ) : (
                            filteredOrders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-zinc-50/80">
                                    <TableCell className="text-xs text-zinc-500">
                                        {new Date(order.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-zinc-600 font-medium">{order.orderNumber}</TableCell>
                                    <TableCell className="font-medium text-sm text-zinc-900">{order.buyerName}</TableCell>
                                    <TableCell>
                                        {getChannelBadge(order)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className={`text-[10px] h-5 ${order.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-0' : ''}`}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-zinc-700">{formatCurrency(order.totalAmount)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            title="Cetak Struk"
                                            className="h-8 w-8 text-zinc-400 hover:text-blue-600"
                                            onClick={() => handlePrintReceipt(order)}
                                        >
                                            <Printer className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                        </TableBody>
                    </Table>
                 </div>
                 
                 {/* Load More Orders */}
                 {hasNextOrders && (
                    <div className="flex justify-center py-4 border-t border-zinc-100">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => fetchNextOrders()}
                            disabled={loadingMoreOrders}
                            className="text-zinc-500 hover:text-blue-600"
                        >
                            {loadingMoreOrders ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                            Muat Lebih Banyak
                        </Button>
                    </div>
                 )}
              </CardContent>
           </Card>
        </TabsContent>

        {/* ======================= TAB SIMPANAN ======================= */}
        <TabsContent value="savings" className="mt-4">
           <Card className="border-zinc-200 shadow-sm">
              <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-3">
                 <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-base text-zinc-700">
                        <Wallet className="w-4 h-4" /> Log Keuangan
                    </CardTitle>
                    <span className="text-xs text-zinc-500 bg-white px-2 py-1 rounded border">
                        {savings.length} Dimuat
                    </span>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader>
                       <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[140px]">Tanggal</TableHead>
                          <TableHead>Anggota</TableHead>
                          <TableHead>Tipe</TableHead>
                          <TableHead>Ket.</TableHead>
                          <TableHead className="text-right">Nominal</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingSavingsInitial ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-zinc-400"/></TableCell></TableRow>
                        ) : filteredSavings.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-10 text-zinc-500">Tidak ada data simpanan.</TableCell></TableRow>
                        ) : (
                          filteredSavings.map((tx) => (
                             <TableRow key={tx.id} className="hover:bg-zinc-50/80">
                                <TableCell className="text-xs text-zinc-500">
                                   {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-'}
                                </TableCell>
                                <TableCell className="font-medium text-sm text-zinc-900">{tx.userName || "Anggota"}</TableCell>
                                <TableCell>
                                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                                        tx.type === 'wajib' ? 'bg-blue-100 text-blue-700' :
                                        tx.type === 'pokok' ? 'bg-purple-100 text-purple-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {tx.type}
                                    </span>
                                </TableCell>
                                <TableCell className="text-xs text-zinc-500 truncate max-w-[200px]">{tx.notes}</TableCell>
                                <TableCell className={`text-right font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                   {formatCurrency(tx.amount)}
                                </TableCell>
                             </TableRow>
                          ))
                       )}
                    </TableBody>
                 </Table>

                 {/* Load More Savings */}
                 {hasNextSavings && (
                    <div className="flex justify-center py-4 border-t border-zinc-100">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => fetchNextSavings()}
                            disabled={loadingMoreSavings}
                            className="text-zinc-500 hover:text-blue-600"
                        >
                            {loadingMoreSavings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                            Muat Lebih Banyak
                        </Button>
                    </div>
                 )}
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

      {/* STRUK DIALOG REUSABLE */}
      <ReceiptDialog 
        open={isReceiptOpen} 
        onOpenChange={setIsReceiptOpen} 
        order={selectedOrder}
        coopName={userData?.coopName || "KOPERASI UNIT"}
        cashierName={userData?.fullName}
      />
    </div>
  );
}