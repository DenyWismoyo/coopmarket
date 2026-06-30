"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Store, Package, Layers, ImageOff, User, Gift, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

interface ProductCardProps {
  product: any; // Menggunakan any agar tidak konflik dengan typing lama yang belum ada memberPrice
}

export function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const { userData } = useAuth();
  
  // Cek apakah pengguna saat ini berhak mendapatkan harga member
  const isMemberEligible = ['member', 'unit_admin', 'super_admin'].includes(userData?.role || '');

  // Logika Harga Publik
  const publicPrice = product.hasVariants && product.variants?.length
    ? Math.min(...product.variants.map((v: any) => v.price))
    : product.price;

  // Logika Harga Anggota (Member)
  const memberPrice = product.hasVariants && product.variants?.length
    ? Math.min(...product.variants.map((v: any) => v.memberPrice || v.price))
    : (product.memberPrice || product.price);

  const hasValidImage = product.images && product.images.length > 0 && product.images[0];
  const hasMemberDiscount = isMemberEligible && memberPrice < publicPrice;

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 group border-zinc-200 hover:border-blue-200 flex flex-col">
        
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-zinc-50 border-b border-zinc-100 shrink-0">
          {hasValidImage && !imgError ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              priority={false}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-zinc-300 gap-2">
              {imgError ? <ImageOff className="h-10 w-10" /> : <Package className="h-12 w-12" />}
              {imgError && <span className="text-[10px]">Gagal memuat</span>}
            </div>
          )}

          {/* Badge Label Kiri Atas */}
          {product.isBundle ? (
            <Badge className="absolute top-2 left-2 bg-purple-600 hover:bg-purple-700 h-5 px-2 text-[10px] border-0 shadow-md">
              <Gift className="w-3 h-3 mr-1.5" /> Paket
            </Badge>
          ) : hasMemberDiscount ? (
            <Badge className="absolute top-2 left-2 bg-green-500 hover:bg-green-600 h-5 px-1.5 text-[9px] border-0 shadow-md flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Harga Anggota
            </Badge>
          ) : null}
          
          {product.condition === 'used' && !product.isBundle && (
            <Badge className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-600 h-5 px-1.5 text-[10px]">Bekas</Badge>
          )}

          {product.hasVariants && (
            <div className="absolute bottom-2 left-2">
                <Badge className="bg-black/60 hover:bg-black/70 backdrop-blur-sm text-[9px] px-1.5 h-5 border-0">
                    <Layers className="w-3 h-3 mr-1" /> Varian
                </Badge>
            </div>
          )}

          {product.stock <= 0 && !product.hasVariants && (
             <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold border-2 border-white px-3 py-1 rounded text-xs">HABIS</span>
             </div>
          )}
        </div>

        <CardContent className="p-3 flex flex-col flex-1">
          <div className="text-[10px] text-zinc-500 mb-1 flex items-center gap-1.5 truncate">
            {product.sellerType === 'member' ? <User className="w-3 h-3 shrink-0 text-blue-500" /> : <Store className="w-3 h-3 shrink-0 text-green-500" />}
            <span className="truncate font-medium text-zinc-600" title={product.sellerType === 'member' ? `${product.coopName} - ${product.sellerName}` : product.coopName}>
                {product.sellerType === 'member' && product.sellerName !== product.coopName ? `${product.coopName || "Koperasi"} - ${product.sellerName}` : product.coopName || "Koperasi Unit"}
            </span>
          </div>
          
          <h3 className="font-semibold text-zinc-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors text-sm flex-1" title={product.name}>
            {product.name}
          </h3>
          
          {/* Tampilan Harga Dinamis */}
          <div className="flex flex-col mt-auto">
            {hasMemberDiscount ? (
               <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 line-through decoration-red-400">{formatCurrency(publicPrice)}</span>
                  <span className="text-base font-black text-green-600 flex items-center gap-1">
                     {formatCurrency(memberPrice)}
                  </span>
               </div>
            ) : (
               <div className="flex flex-col">
                 {product.hasVariants && <span className="text-[10px] text-zinc-400 leading-none mb-0.5">Mulai</span>}
                 <span className="text-base font-bold text-blue-700">{formatCurrency(publicPrice)}</span>
               </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-100 text-[10px] text-zinc-400">
             <div className="flex items-center gap-0.5 text-yellow-600 bg-yellow-50 px-1 rounded">
                <span>⭐</span> {product.rating || 0}
             </div>
             <span>•</span>
             <div>Terjual {product.soldCount || 0}</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}