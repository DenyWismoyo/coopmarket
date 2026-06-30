// File: src/app/(admin)/admin/members/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/components/auth/auth-provider";
import { authService } from "@/services/auth.service";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { UserProfile, Order, Product } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { 
  ArrowLeft, User, Phone, Mail, MapPin, 
  ShoppingBag, Store, Calendar, CreditCard, Package 
} from "lucide-react";
import { toast } from "sonner";

export default function Member360ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  
  const [member, setMember] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMemberData() {
      if (!params.id || !userData?.coopId) return;
      
      try {
        const memberId = params.id as string;
        
        // 1. Ambil Profil Member
        const profileData = await authService.getUserProfile(memberId);
        if (!profileData) throw new Error("Member tidak ditemukan");
        setMember(profileData);

        // 2. Ambil Riwayat Belanja (Sebagai Pembeli di Unit Koperasi Ini)
        const qOrders = query(
          collection(db, "orders"),
          where("buyerId", "==", memberId),
          where("coopId", "==", userData.coopId), 
          orderBy("createdAt", "desc")
        );
        const snapOrders = await getDocs(qOrders);
        const ordersData = snapOrders.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        
        const completedOrders = ordersData.filter(o => o.status === 'completed' || o.paymentStatus === 'paid');
        setOrders(completedOrders);

        // 3. Ambil Produk Titipan (Sebagai Penjual di Unit Koperasi Ini)
        const qProducts = query(
          collection(db, "products"), 
          where("sellerId", "==", memberId),
          where("coopId", "==", userData.coopId) 
        );
        const snapProducts = await getDocs(qProducts);
        setProducts(snapProducts.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));

      } catch (error: any) {
        toast.error(error.message || "Gagal memuat data member");
      } finally {
        setLoading(false);
      }
    }
    
    fetchMemberData();
  }, [params.id, userData]);

  const totalBelanja = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  if (loading) return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
       <Skeleton className="h-10 w-48" />
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl md:col-span-2" />
       </div>
    </div>
  );

  if (!member) return <div className="p-8 text-center text-zinc-500">Member tidak ditemukan.</div>;

  return (
    <div className="space-y-6 p-4 md:p-8 pb-20 max-w-6xl mx-auto">
      {/* Header Mobile Responsive */}
      <div className="flex items-start md:items-center gap-3 md:gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl border-zinc-200 shrink-0 shadow-sm bg-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight leading-tight">Profil 360°</h1>
          <p className="text-xs md:text-sm text-zinc-500 mt-1 truncate">Buku induk digital & analitik performa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: Kartu Nama & KTA */}
        <div className="space-y-6">
           <Card className="bg-gradient-to-br from-blue-700 to-blue-900 text-white shadow-xl overflow-hidden relative border-0 rounded-2xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
             <CardContent className="p-6 md:p-8 flex flex-col items-center justify-center text-center relative z-10">
                <h3 className="font-black text-xl mb-1 tracking-tight">KARTU ANGGOTA</h3>
                <p className="text-blue-200 text-[9px] md:text-[10px] mb-5 md:mb-6 uppercase tracking-widest leading-snug px-4">{member.coopName || "Unit Koperasi"}</p>
                
                <div className="bg-white p-2.5 md:p-3 rounded-2xl shadow-inner mb-4 md:mb-5">
                   <QRCodeSVG value={member.uid} size={130} level="H" />
                </div>
                
                <p className="font-bold text-base md:text-lg leading-tight w-full truncate px-2">{member.fullName}</p>
                <p className="font-mono text-blue-300 text-[10px] md:text-xs mt-1.5 bg-black/20 px-2.5 py-1 rounded-md">ID: {member.uid.slice(0, 10).toUpperCase()}</p>
             </CardContent>
           </Card>

           <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
             <CardHeader className="pb-3 border-b border-zinc-100 bg-zinc-50/50">
                <CardTitle className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                   <User className="w-4 h-4 text-blue-600" /> Biodata Lengkap
                </CardTitle>
             </CardHeader>
             <CardContent className="p-4 space-y-4">
                <div>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Status Keanggotaan</p>
                   <Badge className={member.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-sm' : 'bg-red-100 text-red-700 hover:bg-red-200 shadow-sm'}>
                      {member.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                   </Badge>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Phone className="w-3 h-3"/> No. Handphone / WA</p>
                   <p className="text-xs md:text-sm font-medium text-zinc-800">{member.phone || "-"}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Mail className="w-3 h-3"/> Email</p>
                   <p className="text-xs md:text-sm font-medium text-zinc-800 break-all">{member.email}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Alamat Domisili</p>
                   <p className="text-xs md:text-sm font-medium text-zinc-800 leading-relaxed">{member.address || "Belum diisi"}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3"/> Bergabung Sejak</p>
                   <p className="text-xs md:text-sm font-medium text-zinc-800">
                      {new Date(member.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                   </p>
                </div>
             </CardContent>
           </Card>
        </div>

        {/* KOLOM KANAN: Analitik & Riwayat */}
        <div className="lg:col-span-2 space-y-6">
           {/* Row Statistik Cepat */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <Card className="border-zinc-200 shadow-sm rounded-xl">
                 <CardContent className="p-4 md:p-5 flex flex-col items-center text-center justify-center">
                    <div className="p-2.5 md:p-3 bg-blue-50 text-blue-600 rounded-full mb-2 md:mb-3 shadow-sm"><CreditCard className="w-5 h-5 md:w-6 md:h-6" /></div>
                    <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5 md:mb-1">Total Kontribusi</p>
                    <p className="text-lg md:text-xl font-black text-zinc-900 tracking-tight">{formatCurrency(totalBelanja)}</p>
                 </CardContent>
              </Card>
              <Card className="border-zinc-200 shadow-sm rounded-xl">
                 <CardContent className="p-4 md:p-5 flex flex-col items-center text-center justify-center">
                    <div className="p-2.5 md:p-3 bg-emerald-50 text-emerald-600 rounded-full mb-2 md:mb-3 shadow-sm"><ShoppingBag className="w-5 h-5 md:w-6 md:h-6" /></div>
                    <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5 md:mb-1">Transaksi Beli</p>
                    <p className="text-lg md:text-xl font-black text-zinc-900">{orders.length} <span className="text-[10px] md:text-sm font-medium text-zinc-500">Trx</span></p>
                 </CardContent>
              </Card>
              <Card className="border-zinc-200 shadow-sm rounded-xl">
                 <CardContent className="p-4 md:p-5 flex flex-col items-center text-center justify-center">
                    <div className="p-2.5 md:p-3 bg-purple-50 text-purple-600 rounded-full mb-2 md:mb-3 shadow-sm"><Store className="w-5 h-5 md:w-6 md:h-6" /></div>
                    <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-0.5 md:mb-1">Produk Titipan</p>
                    <p className="text-lg md:text-xl font-black text-zinc-900">{products.length} <span className="text-[10px] md:text-sm font-medium text-zinc-500">Item</span></p>
                 </CardContent>
              </Card>
           </div>

           {/* Tab Riwayat (Dioptimasi Untuk Mobile: Bisa di scroll horizontal) */}
           <Card className="border-zinc-200 shadow-sm overflow-hidden rounded-2xl">
             <Tabs defaultValue="history" className="w-full">
               <div className="border-b border-zinc-100 bg-zinc-50/50">
                  {/* overflow-x-auto agar tidak bertumpuk di HP */}
                  <TabsList className="bg-transparent w-full flex justify-start rounded-none h-auto p-0 overflow-x-auto no-scrollbar">
                    <TabsTrigger value="history" className="text-xs font-bold py-3.5 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none whitespace-nowrap">
                       Riwayat Belanja
                    </TabsTrigger>
                    <TabsTrigger value="products" className="text-xs font-bold py-3.5 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none whitespace-nowrap">
                       Etalase Titipan
                    </TabsTrigger>
                  </TabsList>
               </div>
               
               <TabsContent value="history" className="m-0 bg-white">
                  <ScrollArea className="h-[350px] md:h-[400px]">
                     {orders.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center text-zinc-400 h-[300px]">
                           <ShoppingBag className="w-10 h-10 mb-3 opacity-20" />
                           <p className="font-medium text-xs md:text-sm">Anggota ini belum pernah bertransaksi.</p>
                        </div>
                     ) : (
                        <div className="divide-y divide-zinc-100">
                           {orders.map((order) => (
                              <div key={order.id} className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:bg-zinc-50 transition-colors">
                                 <div>
                                    <div className="flex items-center gap-2 mb-1">
                                       <span className="font-mono text-[10px] md:text-xs font-bold text-blue-600">{order.orderNumber}</span>
                                       <Badge variant="secondary" className="text-[8px] md:text-[9px] h-4 px-1.5 font-bold tracking-wider uppercase bg-zinc-100">
                                          {order.paymentMethod === 'pos_cash' ? 'POS / Offline' : 'Online'}
                                       </Badge>
                                    </div>
                                    <p className="text-xs md:text-sm font-semibold text-zinc-800 line-clamp-2 leading-tight">
                                       {order.items?.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                                    </p>
                                    <p className="text-[9px] md:text-[10px] text-zinc-400 font-medium mt-1.5 flex items-center gap-1">
                                       <Calendar className="w-3 h-3" />
                                       {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                 </div>
                                 <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                                    <p className="text-xs md:text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5 hidden sm:block">Nominal</p>
                                    <p className="font-black text-sm md:text-base text-zinc-900">{formatCurrency(order.totalAmount)}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </ScrollArea>
               </TabsContent>

               <TabsContent value="products" className="m-0 bg-white">
                  <ScrollArea className="h-[350px] md:h-[400px]">
                     {products.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center text-zinc-400 h-[300px]">
                           <Package className="w-10 h-10 mb-3 opacity-20" />
                           <p className="font-medium text-xs md:text-sm">Tidak ada barang yang dititipkan.</p>
                        </div>
                     ) : (
                        <div className="divide-y divide-zinc-100">
                           {products.map((product) => (
                              <div key={product.id} className="p-3 md:p-4 flex flex-row items-center gap-3 md:gap-4 hover:bg-zinc-50 transition-colors">
                                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 relative shadow-sm">
                                    {product.images?.[0] ? (
                                       <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                       <Package className="w-5 h-5 md:w-6 md:h-6 m-auto mt-2.5 md:mt-3 text-zinc-300" />
                                    )}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="font-bold text-xs md:text-sm text-zinc-900 truncate">{product.name}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                       <p className="font-black text-xs text-blue-700">{formatCurrency(product.price)}</p>
                                       <Badge variant="outline" className="text-[8px] md:text-[9px] h-4 px-1.5 bg-white font-semibold">Stok: {product.hasVariants ? 'Varian' : product.stock}</Badge>
                                    </div>
                                 </div>
                                 <div className="shrink-0 hidden xs:block">
                                    <Badge className={product.status === 'active' ? 'bg-green-100 text-green-700 border-0 shadow-none' : 'bg-zinc-100 text-zinc-500 border-0 shadow-none'}>
                                       {product.status === 'active' ? 'Tayang' : 'Draft'}
                                    </Badge>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </ScrollArea>
               </TabsContent>
             </Tabs>
           </Card>
        </div>
      </div>
    </div>
  );
}