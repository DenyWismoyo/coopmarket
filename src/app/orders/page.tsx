// File: src/app/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";
import { orderService } from "@/services/order.service";
import { authService } from "@/services/auth.service"; // Tambahkan ini
import { cooperativeService } from "@/services/cooperative.service"; // Tambahkan ini
import { Order } from "@/types/order";
import { formatCurrency } from "@/lib/utils";
import { MainNavbar } from "@/components/layout/main-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingBag, 
  Store, 
  ChevronRight, 
  MessageCircle,
  PackageX,
  Loader2 // Tambahkan Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChatting, setIsChatting] = useState<string | null>(null); // State untuk loading button chat

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login?redirect=/orders");
      return;
    }

    if (userData?.role === 'admin' || userData?.role === 'super_admin' || userData?.role === 'unit_admin') {
        router.push("/admin/orders");
        return;
    }
    
    if (userData?.role === 'member') {
        router.push("/member/orders");
        return;
    }

    const fetchMyOrders = async () => {
      try {
        const myOrders = await orderService.getMyOrders(user.uid);
        setOrders(myOrders);
      } catch (error) {
        console.error("Gagal memuat pesanan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [user, userData, authLoading, router]);

  // Fungsi untuk mengarahkan pembeli ke WhatsApp Penjual
  const handleChatSeller = async (order: Order) => {
    setIsChatting(order.id);
    try {
      let sellerPhone = order.sellerPhone || "";

      // Jika nomor HP tidak tersimpan langsung di order, fetch dari service
      if (!sellerPhone) {
        if (order.sellerType === 'coop') {
          const coop = await cooperativeService.getCooperativeById(order.coopId);
          sellerPhone = coop?.phone || "";
        } else {
          const sellerProfile = await authService.getUserProfile(order.sellerId);
          sellerPhone = sellerProfile?.phone || "";
        }
      }

      if (!sellerPhone) {
        toast.error("Nomor WhatsApp penjual belum ditambahkan oleh penjual.");
        setIsChatting(null);
        return;
      }

      // Format Nomor HP (08 -> 628)
      sellerPhone = sellerPhone.replace(/\D/g, ''); 
      if (sellerPhone.startsWith('0')) {
        sellerPhone = '62' + sellerPhone.slice(1);
      }

      // Susun list barang
      const itemsList = order.items.map((item: any) => 
        `- ${item.productName} (${item.quantity}x) ${item.variant ? `[${item.variant.name}]` : ''}`
      ).join('\n');

      // Susun pesan WA (Mirip di checkout tapi untuk menanyakan pesanan yang sudah ada)
      const message = encodeURIComponent(`Halo, saya ingin menanyakan pesanan saya dari Aplikasi Koperasi:
      
*No. Pesanan:* ${order.orderNumber || order.id}
*Pembeli:* ${order.buyerName}
*Status Pesanan:* ${order.status}
*Total Belanja:* ${formatCurrency(order.totalAmount)}

*Rincian Barang:*
${itemsList}

Mohon infonya ya. Terima kasih.`);

      const waLink = `https://wa.me/${sellerPhone}?text=${message}`;
      window.open(waLink, '_blank');
      
    } catch (error) {
      console.error("Gagal membuka chat:", error);
      toast.error("Terjadi kesalahan saat memuat kontak penjual.");
    } finally {
      setIsChatting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': 
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Menunggu Proses</Badge>;
      case 'processing': 
        return <Badge className="bg-blue-500 hover:bg-blue-600">Diproses</Badge>;
      case 'shipped': 
        return <Badge className="bg-purple-500 hover:bg-purple-600">Dikirim</Badge>;
      case 'completed': 
        return <Badge className="bg-green-600 hover:bg-green-700">Selesai</Badge>;
      case 'cancelled': 
        return <Badge className="bg-red-500 hover:bg-red-600">Dibatalkan</Badge>;
      default: 
        return <Badge className="bg-zinc-500">{status}</Badge>;
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
           <Skeleton className="h-8 w-48 mb-6" />
           {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-20">
      <MainNavbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 leading-tight">Pesanan Saya</h1>
            <p className="text-sm text-zinc-500">Pantau semua transaksi dan belanjaan Anda di sini</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-300">
            <PackageX className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Belum ada pesanan</h3>
            <p className="text-zinc-500 mb-6">Sepertinya Anda belum melakukan transaksi apapun.</p>
            <Button onClick={() => router.push("/marketplace")} className="bg-red-600 hover:bg-red-700">
              Mulai Belanja Sekarang
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const firstItem = order.items[0];
              const remainingItems = order.items.length - 1;

              return (
                <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow border-zinc-200">
                  <CardHeader className="bg-zinc-50 border-b border-zinc-100 px-4 py-3 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Store className="w-4 h-4 text-zinc-500" />
                        <span className="font-bold text-zinc-900">{order.sellerName}</span>
                        <span className="hidden sm:inline text-zinc-300">|</span>
                        <span className="text-zinc-500 text-xs sm:text-sm">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                      
                      {/* Gambar Produk Pertama */}
                      <div className="relative w-20 h-20 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-200">
                        {firstItem?.image ? (
                           <Image src={firstItem.image} alt={firstItem.productName} fill className="object-cover" />
                        ) : (
                           <div className="flex items-center justify-center h-full"><ShoppingBag className="w-8 h-8 text-zinc-300"/></div>
                        )}
                      </div>

                      {/* Info Item */}
                      <div className="flex-1 min-w-0 w-full">
                        <h4 className="font-bold text-zinc-900 truncate mb-1">{firstItem?.productName}</h4>
                        {firstItem?.variant && (
                           <p className="text-xs text-zinc-500 mb-1">Varian: {firstItem.variant.name}</p>
                        )}
                        <p className="text-sm text-zinc-600 mb-2">
                          {firstItem?.quantity} barang x {formatCurrency(firstItem?.price || 0)}
                        </p>
                        
                        {remainingItems > 0 && (
                          <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                            + {remainingItems} barang lainnya
                          </div>
                        )}
                      </div>

                      {/* Total & Action */}
                      <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-zinc-100 pt-4 sm:pt-0 sm:pl-6 mt-2 sm:mt-0 gap-4">
                        <div className="text-left sm:text-right">
                           <p className="text-xs text-zinc-500 mb-0.5">Total Belanja</p>
                           <p className="font-bold text-red-600 text-lg leading-none">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        
                        {/* Tombol hubungi penjual via WA */}
                        <Button 
                           variant="outline" 
                           size="sm" 
                           className="border-green-600 text-green-600 hover:bg-green-50 w-full sm:w-auto"
                           onClick={() => handleChatSeller(order)}
                           disabled={isChatting === order.id}
                        >
                           {isChatting === order.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                           ) : (
                              <MessageCircle className="w-4 h-4 mr-2" />
                           )}
                           Chat Penjual
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}