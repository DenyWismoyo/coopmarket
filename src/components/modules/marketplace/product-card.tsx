"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Store, Package, Layers, ImageOff, User, Gift } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  // Hitung harga display (Jika ada varian, ambil harga terendah)
  const displayPrice = product.hasVariants && product.variants?.length 
    ? Math.min(...product.variants.map(v => v.price)) 
    : product.price;

  // Pastikan URL gambar valid
  const hasValidImage = product.images && product.images.length > 0 && product.images[0];

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 group border-zinc-200 hover:border-blue-200">
         
        {/* Image Container - Aspect Square */}
        <div className="relative aspect-square overflow-hidden bg-zinc-50 border-b border-zinc-100">
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

          {/* [BARU] Badge Paket Bundling */}
          {product.isBundle && (
            <Badge className="absolute top-2 left-2 bg-purple-600 hover:bg-purple-700 h-5 px-2 text-[10px] border-0 shadow-md">
              <Gift className="w-3 h-3 mr-1.5" /> Paket
            </Badge>
          )}
          
          {/* Badge Kondisi */}
          {product.condition === 'used' && !product.isBundle && (
            <Badge className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-600 h-5 px-1.5 text-[10px]">
              Bekas
            </Badge>
          )}

          {/* Badge Varian */}
          {product.hasVariants && (
            <div className="absolute bottom-2 left-2">
                <Badge className="bg-black/60 hover:bg-black/70 backdrop-blur-sm text-[9px] px-1.5 h-5 border-0">
                    <Layers className="w-3 h-3 mr-1" /> Varian
                </Badge>
            </div>
          )}
          
          {/* Overlay Stok Habis */}
          {product.stock <= 0 && !product.hasVariants && (
             <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold border-2 border-white px-3 py-1 rounded text-xs">HABIS</span>
             </div>
          )}
        </div>

        <CardContent className="p-3">
          {/* Info Toko / Pemilik */}
          <div className="text-[10px] text-zinc-500 mb-1 flex items-center gap-1.5 truncate">
            {product.sellerType === 'member' ? (
                <User className="w-3 h-3 shrink-0 text-blue-500" /> 
            ) : (
                <Store className="w-3 h-3 shrink-0 text-green-500" />
            )}
            <span 
               className="truncate font-medium text-zinc-600"
               title={product.sellerType === 'member' ? `${product.coopName} - ${product.sellerName}` : product.coopName}
            >
                {product.sellerType === 'member' && product.sellerName !== product.coopName
                    ? `${product.coopName || "Koperasi"} - ${product.sellerName}` 
                    : product.coopName || "Koperasi Unit"}
            </span>
          </div>
          
          {/* Nama Produk */}
          <h3 className="font-semibold text-zinc-900 truncate mb-1 group-hover:text-blue-600 transition-colors text-sm" title={product.name}>
            {product.name}
          </h3>
          
          {/* Harga */}
          <div className="flex flex-col">
            {product.hasVariants && <span className="text-[10px] text-zinc-400 leading-none mb-0.5">Mulai</span>}
            <span className="text-base font-bold text-blue-700">
              {formatCurrency(displayPrice)}
            </span>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400">
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