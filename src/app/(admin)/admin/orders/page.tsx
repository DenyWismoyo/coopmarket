// File: src/app/(admin)/admin/orders/page.tsx
"use client";

import { useState, useMemo } from "react";
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
  Printer,
  Calendar,
  DollarSign,
  Clock,
  Store,
  User,
  Building2
} from "lucide-react";
import { toast } from "sonner";

import { orderService } from "@/services/order.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

export default function AdminOrdersPage() {
  const { userData } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Setup Default Bulan Ini (YYYY-MM)
  const currentDate = new Date();
  const currentMonthValue = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [filterMonth, setFilterMonth] = useState<string>(currentMonthValue);

  // 1. QUERY: Fetch Orders dengan Pagination
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
        50, // Mengambil entri lebih banyak agar filter bulanan client-side optimal
        pageParam as DocumentSnapshot | undefined
      );
    },
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    enabled: !!userData?.coopId,
  });

  const orders = data?.pages.flatMap((page: any) => page.data) || [];

  // Filter Pencarian & Bulan (Client Side)
  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => {
      const matchSearch = 
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.sellerName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const orderMonth = new Date(o.createdAt).toISOString().slice(0, 7);
      const matchMonth = filterMonth === "all" || orderMonth === filterMonth;
      
      return matchSearch && matchMonth;
    });
  }, [orders, searchQuery, filterMonth]);

  // Hitung Statistik Dashboard Atas
  const stats = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
      acc.total += 1;
      acc.nominal += (order.totalAmount || order.total || 0);
      if (order.status === 'completed') acc.completed += 1;
      else if (order.status === 'cancelled') acc.cancelled += 1;
      else acc.active += 1;
      return acc;
    }, { total: 0, nominal: 0, completed: 0, active: 0, cancelled: 0 });
  }, [filteredOrders]);

  // Opsi Dropdown Seleksi Bulan (4 Bulan ke Belakang)
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      options.push({ value: val, label });
    }
    return options;
  }, []);

  // 2. MUTATION: Update Status Operasional Order
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

  // Komponen Label Status Warna
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <Badge className="bg-green-600 hover:bg-green-700">Selesai</Badge>;
      case 'processing': return <Badge className="bg-blue-600 hover:bg-blue-700">Diproses</Badge>;
      case 'shipped': return <Badge className="bg-purple-600 hover:bg-purple-700">Dikirim</Badge>;
      case 'cancelled': return <Badge variant="destructive">Batal</Badge>;
      default: return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Menunggu</Badge>;
    }
  };

  // Helper untuk menentukan label jalur pesanan
  const getChannelLabel = (order: any) => {
    if (order.isOffline) return 'POS / Kasir';
    if (order.paymentMethod === 'manual_wa') return 'Manual WA';
    return 'Marketplace';
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <div className="space-y-2">
           {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  if (isError) return <div className="p-8 text-center text-red-500">Error: {(error as Error).message}</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Title */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Manajemen Pesanan</h1>
        <p className="text-sm text-zinc-500">Pantau operasional pengiriman barang dan logistik toko koperasi.</p>
      </div>

      {/* Filter & Kontrol Pencarian */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border shadow-sm">
         <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input 
               placeholder="Cari Order ID, Pembeli, atau Penjual..." 
               className="pl-9 bg-zinc-50/50"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="w-full sm:w-56 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500 hidden sm:block shrink-0" />
            <Select value={filterMonth} onValueChange={setFilterMonth}>
               <SelectTrigger className="w-full bg-zinc-50/50">
                  <SelectValue placeholder="Pilih Periode" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">Semua Periode</SelectItem>
                  {monthOptions.map(opt => (
                     <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>
      </div>

      {/* Baris Kartu Ringkasan Statistik Bulanan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-4">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-xs text-zinc-500 font-medium">Nominal Order</p>
                     <p className="text-lg sm:text-xl font-bold text-zinc-900 mt-1">{formatCurrency(stats.nominal)}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><DollarSign className="w-5 h-5"/></div>
               </div>
            </CardContent>
         </Card>
         <Card className="border-l-4 border-l-zinc-400 shadow-sm">
            <CardContent className="p-4">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-xs text-zinc-500 font-medium">Total Pesanan</p>
                     <p className="text-lg sm:text-xl font-bold text-zinc-900 mt-1">{stats.total} Trx</p>
                  </div>
                  <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600"><Package className="w-5 h-5"/></div>
               </div>
            </CardContent>
         </Card>
         <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="p-4">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-xs text-zinc-500 font-medium">Aktif / Proses</p>
                     <p className="text-lg sm:text-xl font-bold text-zinc-900 mt-1">{stats.active} Trx</p>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Clock className="w-5 h-5"/></div>
               </div>
            </CardContent>
         </Card>
         <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="p-4">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-xs text-zinc-500 font-medium">Pesanan Selesai</p>
                     <p className="text-lg sm:text-xl font-bold text-zinc-900 mt-1">{stats.completed} Trx</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg text-green-600"><CheckCircle2 className="w-5 h-5"/></div>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* List Main Container */}
      <Card className="overflow-hidden border-zinc-200 shadow-sm bg-white">
         
         {/* DESKTOP RESPONSIVE DESIGN (Table Layout) */}
         <div className="hidden md:block overflow-x-auto">
           <Table>
             <TableHeader className="bg-zinc-50">
               <TableRow>
                 <TableHead>Order ID</TableHead>
                 <TableHead>Pembeli</TableHead>
                 <TableHead className="w-[300px]">Rincian Transaksi & Pemilik Produk</TableHead>
                 <TableHead>Total & Metode</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead className="text-right">Aksi</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredOrders.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                      Tidak ada rekaman transaksi pada kriteria filter ini.
                   </TableCell>
                 </TableRow>
               ) : (
                 filteredOrders.map((order: any) => (
                   <TableRow key={order.id} className="hover:bg-zinc-50/50">
                     <TableCell className="font-mono text-sm font-medium">
                        {order.orderNumber}
                        <div className="text-zinc-500 text-xs mt-1 font-sans">
                           {new Date(order.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                           })}
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="font-medium text-zinc-900">{order.buyerName || 'Umum'}</div>
                        <div className="text-xs text-zinc-500">ID: {order.buyerId?.slice(0, 8)}...</div>
                     </TableCell>
                     
                     {/* ========================================================== */}
                     {/* PERBAIKAN: KOLOM PENJUAL & RINCIAN PEMILIK BARANG          */}
                     {/* ========================================================== */}
                     <TableCell>
                        <div className="flex flex-col gap-3 py-1">
                           {/* Info Kasir Pemroses (Root Order) */}
                           <div className="flex flex-col items-start gap-1">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                 Pemroses Transaksi:
                              </span>
                              <div className="flex items-center gap-1.5 text-zinc-900">
                                 <Store className="w-4 h-4 text-zinc-400 shrink-0" />
                                 <span className="font-medium text-sm truncate">{order.sellerName || 'Koperasi'}</span>
                                 <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-medium bg-zinc-50 text-zinc-600 border-zinc-200">
                                    Kasir Unit
                                 </Badge>
                              </div>
                           </div>

                           {/* Info Detail per Produk */}
                           <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-100">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                 Barang yang dibeli:
                              </span>
                              {order.items?.map((item: any, idx: number) => {
                                 // LOGIKA AKURAT UNTUK MENENTUKAN PEMILIK PRODUK
                                 // Cek apakah item ini milik member (baik dari sellerType maupun dari ID yang berbeda dari root order)
                                 const isMemberProduct = item.sellerType === 'member' || (item.sellerId && item.sellerId !== order.sellerId);
                                 
                                 // Ambil nama. Jika data lama kosong, gunakan fallback pintar.
                                 let ownerName = item.sellerName;
                                 if (!ownerName) {
                                    ownerName = isMemberProduct ? `Anggota (ID: ${item.sellerId?.slice(0,5)})` : (order.sellerName || 'Unit Koperasi');
                                 }

                                 return (
                                    <div key={idx} className="bg-zinc-50/80 rounded-md p-2 flex flex-col gap-1 border border-zinc-100">
                                       <span className="text-xs font-semibold text-zinc-800 line-clamp-1">
                                          {item.quantity}x {item.productName}
                                       </span>
                                       <div className="flex items-center gap-1.5 text-[10px]">
                                          {isMemberProduct ? (
                                             <User className="w-3 h-3 text-purple-600" />
                                          ) : (
                                             <Building2 className="w-3 h-3 text-teal-600" />
                                          )}
                                          <span className="text-zinc-500">Milik:</span>
                                          <span className={`font-semibold ${isMemberProduct ? 'text-purple-700' : 'text-teal-700'}`}>
                                             {ownerName}
                                          </span>
                                          <span className="ml-auto text-[8px] uppercase tracking-widest bg-white px-1.5 py-0.5 rounded shadow-sm border border-zinc-200">
                                             {isMemberProduct ? 'Member' : 'Unit'}
                                          </span>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     </TableCell>
                     {/* ========================================================== */}

                     <TableCell>
                        <div className="font-bold text-blue-700">{formatCurrency(order.totalAmount || order.total)}</div>
                        <div className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">
                           {order.paymentMethod === 'pos_cash' ? 'Tunai Kasir' : order.paymentMethod?.replace('_', ' ')}
                        </div>
                        <div className="mt-1">
                           <Badge variant="secondary" className="text-[9px] px-1 h-4 bg-zinc-100 text-zinc-500 font-medium">
                              {getChannelLabel(order)}
                           </Badge>
                        </div>
                     </TableCell>
                     <TableCell>
                        {getStatusBadge(order.status)}
                     </TableCell>
                     <TableCell className="text-right">
                       <OrderActionMenu order={order} updateStatusMutation={updateStatusMutation} />
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>

         {/* MOBILE RESPONSIVE DESIGN (Card List Layout) */}
         <div className="md:hidden flex flex-col divide-y divide-zinc-100">
            {filteredOrders.length === 0 ? (
               <div className="p-8 text-center text-zinc-400 text-sm">
                  Tidak ada rekaman transaksi pada kriteria filter ini.
               </div>
            ) : (
               filteredOrders.map((order: any) => (
                  <div key={order.id} className="p-4 space-y-3 bg-white hover:bg-zinc-50 transition-colors">
                     <div className="flex justify-between items-start gap-2">
                        <div>
                           <p className="font-mono text-xs font-semibold text-zinc-400">{order.orderNumber}</p>
                           <p className="font-bold text-base text-zinc-900 mt-0.5">{order.buyerName || 'Umum'}</p>
                        </div>
                        {getStatusBadge(order.status)}
                     </div>
                     
                     {/* MOBILE: KASIR DAN RINCIAN BARANG */}
                     <div className="pt-3 border-t border-zinc-100">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Pemroses:</span>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-700 mt-1">
                           <Store className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                           <span className="truncate font-medium max-w-[160px]">{order.sellerName || 'Koperasi'}</span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-dashed border-zinc-200 space-y-2">
                           <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Daftar Barang:</span>
                           {order.items?.map((item: any, idx: number) => {
                              const isMemberProduct = item.sellerType === 'member' || (item.sellerId && item.sellerId !== order.sellerId);
                              let ownerName = item.sellerName;
                              if (!ownerName) {
                                 ownerName = isMemberProduct ? `Anggota (${item.sellerId?.slice(0,5)})` : (order.sellerName || 'Koperasi');
                              }

                              return (
                                 <div key={idx} className="bg-zinc-50 rounded p-2 flex flex-col gap-1 border border-zinc-100 shadow-sm">
                                    <span className="text-xs font-semibold text-zinc-800">{item.quantity}x {item.productName}</span>
                                    <div className="flex items-center gap-1 text-[10px]">
                                       {isMemberProduct ? <User className="w-3 h-3 text-purple-600 shrink-0" /> : <Building2 className="w-3 h-3 text-teal-600 shrink-0" />}
                                       <span className="text-zinc-500">Milik:</span>
                                       <span className={`font-semibold truncate max-w-[120px] ${isMemberProduct ? 'text-purple-700' : 'text-teal-700'}`}>
                                          {ownerName}
                                       </span>
                                       <span className="ml-auto text-[8px] uppercase tracking-widest bg-white px-1 py-0.5 rounded border border-zinc-200 shadow-sm">
                                          {isMemberProduct ? 'Member' : 'Unit'}
                                       </span>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>

                     <div className="flex justify-between items-end pt-3 border-t border-zinc-100">
                        <div className="space-y-1">
                           <p className="text-xs text-zinc-500">
                              {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                 day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                           </p>
                           <div className="flex flex-col gap-0.5">
                              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                                 Metode: {order.paymentMethod === 'pos_cash' ? 'Tunai' : order.paymentMethod?.replace('_', ' ')}
                              </p>
                              <Badge variant="secondary" className="text-[8px] px-1.5 h-4 w-fit bg-zinc-100 text-zinc-600 font-medium">
                                 {getChannelLabel(order)}
                              </Badge>
                           </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                           <p className="font-extrabold text-blue-700 text-base">{formatCurrency(order.totalAmount || order.total)}</p>
                           <OrderActionMenu order={order} updateStatusMutation={updateStatusMutation} />
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>

      </Card>
      
      {/* Pagination Load More */}
      <div className="flex justify-center pt-4">
         {hasNextPage ? (
            <Button 
                variant="outline" 
                onClick={() => fetchNextPage()} 
                disabled={isFetchingNextPage}
                className="shadow-sm"
            >
               {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
               Muat Lebih Banyak
            </Button>
         ) : (
            <p className="text-xs text-zinc-400">Seluruh data order pada halaman ini sudah dimuat.</p>
         )}
      </div>
    </div>
  );
}

// Sub-Komponen Dropdown Menu Aksi Operasional
function OrderActionMenu({ order, updateStatusMutation }: { order: any, updateStatusMutation: any }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 md:w-8 md:p-0 px-2.5 text-zinc-600 bg-white shadow-sm border-zinc-200">
          <span className="md:hidden text-xs font-semibold mr-1">Aksi</span>
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Opsi Operasional</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'processing' })}>
           <Package className="w-4 h-4 mr-2 text-blue-500" /> Proses Order
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'shipped' })}>
           <Truck className="w-4 h-4 mr-2 text-purple-500" /> Kirim Barang
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'completed' })}>
           <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Selesaikan Trx
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => window.print()}>
           <Printer className="w-4 h-4 mr-2 text-zinc-600" /> Cetak Nota
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
           className="text-red-600 focus:text-red-600 focus:bg-red-50"
           onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'cancelled' })}
        >
           <XCircle className="w-4 h-4 mr-2" /> Batalkan Transaksi
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}