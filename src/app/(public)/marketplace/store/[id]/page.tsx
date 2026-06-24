"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cooperativeService } from "@/services/cooperative.service";
import { productService } from "@/services/product.service";
import { Cooperative, Product } from "@/types";
import { ProductCard } from "@/components/modules/marketplace/product-card";
import { MainNavbar } from "@/components/layout/main-navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Store, 
  Share2, 
  Calendar,
  CheckCircle2,
  MessageCircle,
  ShoppingBag,
  Map, // Icon Maps
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export default function StoreProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [coop, setCoop] = useState<Cooperative | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!params.id) return;
      try {
        const coopId = params.id as string;
        const [coopData, productsData] = await Promise.all([
          cooperativeService.getCooperativeById(coopId),
          productService.getPublicProductsByCoop(coopId)
        ]);

        if (!coopData) {
          toast.error("Toko tidak ditemukan");
          router.push("/marketplace");
          return;
        }

        setCoop(coopData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching store data:", error);
        toast.error("Gagal memuat data koperasi");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id, router]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link profil koperasi disalin ke clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <MainNavbar />
        <div className="h-48 bg-zinc-200 animate-pulse" />
        <div className="container mx-auto px-4 -mt-16">
           <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="w-32 h-32 rounded-2xl border-4 border-white" />
              <div className="pt-4 md:pt-16 space-y-2">
                 <Skeleton className="h-8 w-64" />
                 <Skeleton className="h-4 w-48" />
              </div>
           </div>
           <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
           </div>
        </div>
      </div>
    );
  }

  if (!coop) return null;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-20">
      <MainNavbar />

      {/* --- HERO HEADER BACKGROUND --- */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-red-700 to-red-900 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-900/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-16 md:-mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Logo Koperasi */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white rounded-2xl border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
            {coop.logoUrl ? (
              <Image 
                src={coop.logoUrl} 
                alt={coop.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 128px, 160px"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-300 bg-zinc-50">
                  <Store className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Info Utama */}
          <div className="flex-1 text-white md:pt-20 pt-4 md:text-zinc-900">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 drop-shadow-md md:drop-shadow-none">{coop.name}</h1>
                      <Badge className="bg-blue-600 hover:bg-blue-700 border-white shadow-sm flex items-center gap-1">
                         <CheckCircle2 className="w-3 h-3" /> Official Unit
                      </Badge>
                   </div>
                   <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
                      <div className="flex items-center gap-1.5">
                         <MapPin className="w-4 h-4 text-red-600" />
                         {coop.city}
                      </div>
                      <div className="flex items-center gap-1.5">
                         <Calendar className="w-4 h-4 text-blue-600" />
                         Bergabung {new Date(coop.createdAt).getFullYear()}
                      </div>
                   </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-2 md:mt-0">
                   <Button 
                      variant="outline" 
                      onClick={handleShare}
                      className="bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-300"
                   >
                     <Share2 className="w-4 h-4 mr-2" /> Bagikan
                   </Button>
                   <Button 
                      className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-100"
                      onClick={() => window.open(`https://wa.me/${coop.phone?.replace(/\D/g,'')}`, '_blank')}
                   >
                     <MessageCircle className="w-4 h-4 mr-2" /> Chat Admin
                   </Button>
                </div>
             </div>
          </div>
        </div>

        {/* --- CONTENT TABS --- */}
        <div className="mt-8">
           <Tabs defaultValue="products" className="w-full">
              <TabsList className="w-full md:w-auto grid grid-cols-2 md:inline-flex bg-zinc-100 p-1 rounded-lg">
                 <TabsTrigger value="products" className="px-6">Produk</TabsTrigger>
                 <TabsTrigger value="about" className="px-6">Tentang Koperasi</TabsTrigger>
              </TabsList>

              {/* TAB PRODUK */}
              <TabsContent value="products" className="mt-6">
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                       <ShoppingBag className="w-5 h-5 text-red-600" /> Etalase ({products.length})
                    </h2>
                 </div>

                 {products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                       <Store className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                       <p className="text-zinc-500">Belum ada produk di etalase ini.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                       {products.map((product) => (
                          <ProductCard key={product.id} product={product} />
                       ))}
                    </div>
                 )}
              </TabsContent>

              {/* TAB TENTANG KOPERASI */}
              <TabsContent value="about" className="mt-6">
                 <div className="grid md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                       <CardContent className="p-6 space-y-4">
                          <h3 className="font-bold text-lg text-zinc-900">Profil & Deskripsi</h3>
                          <div className="text-zinc-600 leading-relaxed whitespace-pre-line">
                             {coop.description ? (
                                coop.description
                             ) : (
                                <p className="text-zinc-400 italic">
                                   Deskripsi koperasi belum ditambahkan oleh admin.
                                </p>
                             )}
                          </div>
                       </CardContent>
                    </Card>

                    <Card>
                       <CardContent className="p-6 space-y-4">
                          <h3 className="font-bold text-lg text-zinc-900">Kontak & Lokasi</h3>
                          <div className="space-y-3 text-sm">
                             <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-50 rounded-full text-red-600 mt-0.5">
                                   <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                   <p className="font-medium text-zinc-900 mb-1">Alamat Kantor</p>
                                   <p className="text-zinc-600">{coop.address}</p>
                                   
                                   {/* Tombol Maps */}
                                   {coop.mapsUrl && (
                                       <Button 
                                         variant="link" 
                                         className="p-0 h-auto text-blue-600 hover:no-underline mt-1 text-xs flex items-center gap-1"
                                         onClick={() => window.open(coop.mapsUrl, '_blank')}
                                       >
                                         <Map className="w-3 h-3" /> Buka di Google Maps <ExternalLink className="w-3 h-3" />
                                       </Button>
                                   )}
                                </div>
                             </div>
                             
                             <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-50 rounded-full text-green-600 mt-0.5">
                                   <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                   <p className="font-medium text-zinc-900 mb-1">WhatsApp / Telepon</p>
                                   <p className="text-zinc-600">{coop.phone}</p>
                                </div>
                             </div>

                             {coop.email && (
                                <div className="flex items-start gap-3">
                                   <div className="p-2 bg-blue-50 rounded-full text-blue-600 mt-0.5">
                                      <Mail className="w-4 h-4" />
                                   </div>
                                   <div>
                                      <p className="font-medium text-zinc-900 mb-1">Email Resmi</p>
                                      <p className="text-zinc-600">{coop.email}</p>
                                   </div>
                                </div>
                             )}
                          </div>
                       </CardContent>
                    </Card>
                 </div>
              </TabsContent>
           </Tabs>
        </div>
      </div>
    </div>
  );
}