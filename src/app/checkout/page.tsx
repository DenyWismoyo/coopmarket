// File: src/app/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/lib/store/use-cart-store";
import { useAuth } from "@/components/auth/auth-provider";
import { orderService } from "@/services/order.service";
import { authService } from "@/services/auth.service";
import { cooperativeService } from "@/services/cooperative.service";
import { MainNavbar } from "@/components/layout/main-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, MapPin, MessageCircle, ShoppingBag, ArrowLeft, Store, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { items, totalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const isMemberEligible = ['member', 'unit_admin', 'super_admin'].includes(userData?.role || '');

  useEffect(() => {
    if (userData?.address) setAddress(userData.address);
  }, [userData]);

  useEffect(() => {
    if (items.length === 0) router.push("/marketplace");
  }, [items, router]);

  const shippingCost = 0; 
  const grandTotal = totalPrice() + shippingCost;

  const createWAMessage = (order: any, orderId: string, orderNumber: string) => {
    const itemsList = order.items.map((item: any) => 
       `- ${item.productName} (${item.quantity}x) ${item.variant ? `[${item.variant.name}]` : ''}`
    ).join('\n');
    return `Halo, saya ingin konfirmasi pesanan baru dari Aplikasi Koperasi:\n\n*No. Pesanan:* ${orderNumber}\n*Pembeli:* ${order.buyerName}\n*Total:* ${formatCurrency(order.totalAmount)}\n\n*Rincian Barang:*\n${itemsList}\n\n*Alamat/Lokasi:* ${order.shippingAddress}\n*Catatan:* ${order.notes || '-'}\n\nMohon info untuk pembayaran dan pengambilannya. Terima kasih.`;
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Silakan login untuk melanjutkan checkout");
      router.push("/login?redirect=/checkout");
      return;
    }
    if (!address.trim()) {
      toast.error("Alamat pengiriman/lokasi wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const ordersBySeller = items.reduce((acc, item) => {
        if (!acc[item.sellerId]) {
          acc[item.sellerId] = {
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            sellerType: item.sellerType,
            coopId: item.coopId,
            items: [],
            subtotal: 0
          };
        }
        acc[item.sellerId].items.push({
          productId: item.id,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: item.selectedVariant || null,
          image: item.images?.[0] || ""
        });
        acc[item.sellerId].subtotal += item.price * item.quantity;
        return acc;
      }, {} as Record<string, any>);

      const sellerIds = Object.keys(ordersBySeller);
      let waLink = "";

      for (const sellerId of sellerIds) {
        const orderData = ordersBySeller[sellerId];
        
        const { id: orderId, orderNumber } = await orderService.createOrder({
          buyerId: user.uid,
          buyerName: userData?.fullName || "Pembeli",
          sellerId: orderData.sellerId,
          sellerName: orderData.sellerName,
          coopId: orderData.coopId,
          items: orderData.items,
          totalAmount: orderData.subtotal,
          shippingAddress: address,
          paymentMethod: "manual_wa",
          status: "pending",
          notes: notes
        });

        let sellerPhone = "";
        
        if (orderData.sellerType === 'coop') {
          const coop = await cooperativeService.getCooperativeById(orderData.coopId);
          sellerPhone = coop?.phone || "";
        } else {
          const sellerProfile = await authService.getUserProfile(sellerId);
          sellerPhone = sellerProfile?.phone || "";
        }

        if (sellerPhone) {
          sellerPhone = sellerPhone.replace(/\D/g, ''); 
          if (sellerPhone.startsWith('0')) {
            sellerPhone = '62' + sellerPhone.slice(1);
          }
          
          if (!waLink) {
            const message = encodeURIComponent(createWAMessage(
              { ...orderData, buyerName: userData?.fullName, totalAmount: orderData.subtotal, shippingAddress: address, notes },
              orderId,
              orderNumber
            ));
            waLink = `https://wa.me/${sellerPhone}?text=${message}`;
          }
        }
      }

      toast.success("Pesanan berhasil dibuat!");
      clearCart();

      if (waLink) {
        window.open(waLink, '_blank');
        router.push("/orders");
      } else {
        router.push("/orders");
        toast.info("Silakan cek menu 'Pesanan Saya' untuk status pesanan.");
      }
      
    } catch (error) {
      console.error(error);
      toast.error("Gagal memproses pesanan");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <MainNavbar />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-zinc-900">Konfirmasi Pesanan</h1>
        </div>

        {isMemberEligible && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 shadow-sm">
                <div className="p-2 bg-green-100 rounded-full text-green-700">
                   <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                   <p className="font-bold text-green-900 text-sm">Anda menikmati Harga Khusus Anggota!</p>
                   <p className="text-xs text-green-700 mt-0.5">Potongan harga mitra otomatis diterapkan pada barang yang Anda beli.</p>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* KOLOM KIRI */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="w-4 h-4 text-red-600" /> Informasi Pengiriman / Pengambilan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nama Penerima</Label>
                        <Input value={userData?.fullName || ""} disabled className="bg-zinc-50" />
                    </div>
                    <div className="space-y-2">
                        <Label>Nomor Telepon</Label>
                        <Input value={userData?.phone || ""} disabled className="bg-zinc-50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Alamat Lengkap / Lokasi COD <span className="text-red-500">*</span></Label>
                    <Textarea 
                      placeholder="Contoh: Ambil di Kantor Koperasi, atau Alamat Rumah Lengkap..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBag className="w-4 h-4 text-red-600" /> Rincian Barang
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {items.map((item) => (
                  <div key={item.cartId} className="flex gap-4">
                    <div className="relative w-20 h-20 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0 border">
                      {item.images?.[0] && <Image src={item.images[0]} alt={item.name} fill className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-medium text-zinc-900 truncate">{item.name}</h4>
                            <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                                <Store className="w-3 h-3" /> {item.sellerName}
                            </div>
                        </div>
                        <p className="font-bold text-zinc-900">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                      
                      {item.selectedVariant && (
                        <p className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded w-fit mt-1">
                          Varian: {item.selectedVariant.name}
                        </p>
                      )}
                      <p className="text-sm text-zinc-500 mt-1">{item.quantity} x {formatCurrency(item.price)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* KOLOM KANAN */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg border-t-4 border-t-green-600">
              <CardHeader><CardTitle>Total Tagihan</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Harga Barang</span>
                  <span className="font-medium">{formatCurrency(totalPrice())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Ongkos Kirim</span>
                  <span className="font-medium text-green-600">Diskusikan via WA</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total Estimasi</span>
                  <span className="font-bold text-xl text-red-600">{formatCurrency(grandTotal)}</span>
                </div>
                
                <div className="space-y-2 pt-4">
                    <Label>Catatan Tambahan</Label>
                    <Textarea 
                         placeholder="Pesan khusus untuk penjual..." 
                         className="resize-none h-20 text-sm"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                     className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-bold shadow-lg shadow-green-100"
                     onClick={handleCheckout}
                    disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses...</>
                  ) : (
                    <div className="flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2" /> Hubungi Penjual & Pesan
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}