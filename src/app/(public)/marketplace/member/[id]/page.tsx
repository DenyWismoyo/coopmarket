"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { authService } from "@/services/auth.service";
import { productService } from "@/services/product.service";
import { UserProfile, Product } from "@/types";
import { ProductCard } from "@/components/modules/marketplace/product-card";
import { MainNavbar } from "@/components/layout/main-navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, MapPin, Share2, MessageCircle, ShoppingBag, User, Instagram, Facebook } from "lucide-react";
import { toast } from "sonner";

export default function MemberStorePage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    async function fetchData() {
      if (!params.id) return;
      try {
        const memberId = params.id as string;
        
        // PENGUBAHAN DISINI: Gunakan fungsi getPublicProductsBySeller
        const [memberData, memberProducts] = await Promise.all([
          authService.getUserProfile(memberId),
          productService.getPublicProductsBySeller(memberId) 
        ]);

        if (!memberData) {
          toast.error("Toko mitra tidak ditemukan");
          router.push("/marketplace");
          return;
        }

        setMember(memberData);
        setProducts(memberProducts); // Langsung set produk hasil query khusus
      } catch (error) {
        console.error("Error fetching member store:", error);
        toast.error("Gagal memuat profil toko mitra");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id, router]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Tautan etalase berhasil disalin!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <MainNavbar />
        <div className="h-48 bg-zinc-200 animate-pulse" />
        <div className="container mx-auto px-4 -mt-16 flex gap-6">
           <Skeleton className="w-32 h-32 rounded-2xl border-4 border-white" />
        </div>
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-20">
      <MainNavbar />

      {/* Header Banner */}
      <div className="relative h-48 bg-gradient-to-r from-blue-700 to-indigo-900" />

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Avatar / Foto Profil Toko */}
          <div className="relative w-32 h-32 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center overflow-hidden shrink-0">
            {member.photoURL ? (
              <Image src={member.photoURL} alt={member.fullName} fill className="object-cover" />
            ) : (
              <User className="w-12 h-12 text-zinc-300" />
            )}
          </div>

          {/* Info Utama Etalase */}
          <div className="flex-1 md:pt-20 text-zinc-900 w-full">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        {member.fullName}
                      </h1>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 shadow-sm">
                        Mitra {member.coopName?.replace(/Koperasi/gi, '').trim()}
                      </Badge>
                   </div>
                   
                   <div className="flex items-center gap-4 text-sm text-zinc-600 mt-2">
                      <div className="flex items-center gap-1">
                         <Store className="w-4 h-4 text-blue-600" /> Unit Induk: {member.coopName?.replace(/Koperasi/gi, '').trim()}
                      </div>
                      {member.address && (
                        <div className="flex items-center gap-1">
                           <MapPin className="w-4 h-4 text-red-600" /> {member.address}
                        </div>
                      )}
                   </div>

                   {/* Deskripsi Tentang Kami */}
                   {member.shopDescription && (
                       <p className="mt-4 text-sm text-zinc-600 max-w-2xl bg-white p-3 rounded-xl border border-zinc-200/60 shadow-sm whitespace-pre-line">
                          {member.shopDescription}
                       </p>
                   )}

                   {/* Tautan Media Sosial Pintar */}
                   {(member.instagramUrl || member.tiktokUrl || member.facebookUrl) && (
                      <div className="flex items-center gap-2 mt-4">
                         <span className="text-xs font-semibold text-zinc-400 mr-1">Ikuti kami:</span>
                         
                         {member.instagramUrl && (
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="w-8 h-8 rounded-full border-zinc-200 text-zinc-500 hover:text-pink-600 hover:bg-pink-50 hover:border-pink-200 transition-colors"
                              onClick={() => window.open(member.instagramUrl, '_blank')}
                              title="Instagram"
                            >
                               <Instagram className="w-4 h-4" />
                            </Button>
                         )}

                         {member.tiktokUrl && (
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="w-8 h-8 rounded-full border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 hover:border-zinc-400 transition-colors"
                              onClick={() => window.open(member.tiktokUrl, '_blank')}
                              title="TikTok"
                            >
                               <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.52-4.06-1.39-.77-.57-1.39-1.34-1.87-2.22-.02 1.63-.01 3.25-.02 4.88-.04 2.1-.47 4.21-1.48 6.04-1.2 2.14-3.4 3.73-5.83 4.17-2.6.47-5.4-.14-7.46-1.85-2.2-1.81-3.41-4.71-3.08-7.53.3-2.68 1.95-5.16 4.39-6.32 1.79-.86 3.84-1.12 5.81-.7v4.11c-1.14-.31-2.4-.19-3.41.42-1.21.72-1.95 2.07-1.95 3.5 0 1.25.6 2.45 1.59 3.17.96.71 2.22.95 3.4.67 1.25-.3 2.31-1.31 2.65-2.54.12-.46.16-.94.15-1.42-.01-4.08 0-8.17-.01-12.25z"/>
                               </svg>
                            </Button>
                         )}

                         {member.facebookUrl && (
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="w-8 h-8 rounded-full border-zinc-200 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                              onClick={() => window.open(member.facebookUrl, '_blank')}
                              title="Facebook"
                            >
                               <Facebook className="w-4 h-4" />
                            </Button>
                         )}
                      </div>
                   )}
                </div>

                {/* Tombol Kontak Utama */}
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                   <Button variant="outline" onClick={handleShare} className="flex-1 sm:flex-none border-zinc-300 text-zinc-700 bg-white">
                     <Share2 className="w-4 h-4 mr-2" /> Bagikan
                   </Button>
                   {member.phone && (
                       <Button className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-100" onClick={() => window.open(`https://wa.me/${member.phone?.replace(/\D/g,'')}`)}>
                         <MessageCircle className="w-4 h-4 mr-2" /> Hubungi WA
                       </Button>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* Daftar Etalase Produk */}
        <div className="mt-12">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-6">
                <ShoppingBag className="w-5 h-5 text-blue-600" /> Katalog Toko Mitra
            </h2>
            
            {products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-zinc-300 shadow-sm">
                    <Store className="w-12 h-12 text-zinc-300 mx-auto mb-3 opacity-60" />
                    <p className="text-zinc-500 text-sm">Mitra belum memiliki produk aktif di marketplace umum.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}