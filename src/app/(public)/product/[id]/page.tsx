"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { productService } from "@/services/product.service";
import { Product, ProductVariant } from "@/types/product";
import { useCartStore } from "@/lib/store/use-cart-store";
import { MainNavbar } from "@/components/layout/main-navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { 
   ShoppingCart, 
   Minus, 
   Plus, 
   Store, 
   ShieldCheck, 
   Package, 
   Weight, 
   User,
   Gift // [BARU] Icon untuk bundling
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // State Interaksi
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function fetchProduct() {
      if (params.id) {
        try {
          const data = await productService.getProductById(params.id as string);
          setProduct(data);
          if (data?.minOrder) setQuantity(data.minOrder);
        } catch (error) {
          toast.error("Gagal memuat produk");
        } finally {
          setLoading(false);
        }
      }
    }
    fetchProduct();
  }, [params.id]);

  const currentPrice = selectedVariant ? selectedVariant.price : (product?.price || 0);
  const currentStock = selectedVariant ? selectedVariant.stock : (product?.stock || 0);
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.hasVariants && !selectedVariant) {
      toast.error("Silakan pilih varian terlebih dahulu");
      return;
    }

    if (quantity > currentStock) {
        toast.error("Stok tidak mencukupi");
        return;
    }

    addItem(product, quantity, selectedVariant || undefined);
    toast.success("Produk masuk keranjang!");
  };

  const handleQuantityChange = (type: 'plus' | 'minus') => {
    if (type === 'plus') {
        if (quantity < currentStock) setQuantity(prev => prev + 1);
    } else {
        if (quantity > (product?.minOrder || 1)) setQuantity(prev => prev - 1);
    }
  };

  if (loading) return <div className="min-h-screen bg-white"><MainNavbar /><div className="container mx-auto py-10 px-4"><Skeleton className="h-[500px] w-full rounded-xl" /></div></div>;
  if (!product) return <div className="min-h-screen bg-white flex items-center justify-center">Produk tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-white font-sans pb-24 md:pb-10">
      <MainNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* --- LEFT: GALLERY --- */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100">
              {product.images && product.images.length > 0 ? (
                <Image 
                   src={product.images[activeImage]} 
                   alt={product.name} 
                   fill 
                   className="object-contain"
                   priority={true} 
                   sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-300">
                    <Package className="w-20 h-20" />
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {product.images.map((img, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setActiveImage(idx)}
                            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${activeImage === idx ? 'border-blue-600' : 'border-transparent'}`}
                        >
                            <Image 
                                 src={img} 
                                 alt={`thumb-${idx}`} 
                                 fill 
                                 className="object-cover" 
                                 sizes="80px"
                            />
                        </button>
                    ))}
                </div>
            )}
          </div>

          {/* --- RIGHT: INFO & ACTIONS --- */}
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-6">
                  
                {/* Header */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2 leading-tight flex items-center gap-3">
                       {product.name}
                       {product.isBundle && <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 tracking-widest text-[10px]">BUNDLE</Badge>}
                    </h1>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-yellow-500 font-medium">
                              ⭐ {product.rating || 0}
                        </div>
                        <span className="text-zinc-300">|</span>
                        <div className="text-zinc-500">Terjual {product.soldCount || 0}</div>
                        <span className="text-zinc-300">|</span>
                        <Badge variant="secondary" className="font-normal capitalize">{product.condition === 'new' ? 'Baru' : 'Bekas'}</Badge>
                    </div>
                </div>

                {/* Price */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-3xl font-bold text-blue-700">
                        {formatCurrency(currentPrice)}
                    </p>
                    {product.hasVariants && !selectedVariant && (
                        <p className="text-xs text-blue-500 mt-1">*Pilih varian untuk harga pas</p>
                    )}
                </div>

                {/* [BARU] Rincian Isi Paket Bundling */}
                {product.isBundle && product.bundleItems && product.bundleItems.length > 0 && (
                    <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                        <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                            <Gift className="w-4 h-4 text-purple-600" /> Isi Paket Bundling:
                        </h3>
                        <div className="space-y-2">
                            {product.bundleItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-purple-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-zinc-50 rounded-md">
                                           <Package className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <div>
                                           <span className="text-sm font-medium text-zinc-800 line-clamp-1">{item.name}</span>
                                           <span className="text-[10px] text-zinc-500">Oleh: {item.sellerName}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md shrink-0">
                                        {item.qty} pcs
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Variants Selector */}
                {product.hasVariants && product.variants && (
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-zinc-900">Pilih Varian:</label>
                        <div className="flex flex-wrap gap-2">
                            {product.variants.map((variant) => (
                                <button
                                    key={variant.id}
                                    onClick={() => {
                                        setSelectedVariant(variant);
                                        setQuantity(product.minOrder || 1);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                                        selectedVariant?.id === variant.id
                                            ? "border-blue-600 bg-blue-600 text-white font-medium shadow-md"
                                            : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                                    } ${variant.stock <= 0 ? "opacity-50 cursor-not-allowed bg-zinc-100" : ""}`}
                                    disabled={variant.stock <= 0}
                                >
                                    {variant.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Detail */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 rounded-full text-zinc-500"><Weight className="w-4 h-4" /></div>
                        <div>
                            <p className="text-xs text-zinc-500">Berat Satuan</p>
                            <p className="font-medium text-sm text-zinc-900">{product.weight} gram</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 rounded-full text-zinc-500"><Package className="w-4 h-4" /></div>
                        <div>
                            <p className="text-xs text-zinc-500">Stok Total</p>
                            <p className="font-medium text-sm text-zinc-900">
                                {currentStock > 0 ? `${currentStock} tersedia` : "Habis"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Deskripsi */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-zinc-900">Deskripsi {product.isBundle ? 'Paket' : 'Produk'}</h3>
                    <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                        {product.description}
                    </p>
                </div>

                {/* Info Toko / Pemilik */}
                <div 
                   className="flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-xl shadow-sm mt-4 hover:border-blue-200 transition-colors cursor-pointer"
                   onClick={() => window.location.href=`/marketplace/store/${product.coopId}`}
                >
                    <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center border shrink-0">
                        {product.sellerType === 'member' ? (
                            <User className="w-6 h-6 text-zinc-500" />
                        ) : (
                            <Store className="w-6 h-6 text-zinc-500" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">
                            {product.sellerName || product.coopName}
                        </p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 truncate">
                            {product.sellerType === 'member' ? (
                                <><ShieldCheck className="w-3 h-3 text-blue-600 shrink-0" /> Mitra Resmi ({product.coopName})</>
                            ) : (
                                <><ShieldCheck className="w-3 h-3 text-green-600 shrink-0" /> Official Partner</>
                            )}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-blue-600 shrink-0 hidden sm:flex">
                        Kunjungi Toko
                    </Button>
                </div>

            </div>

            {/* --- ACTION BAR (Sticky Bottom on Mobile) --- */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200 md:static md:p-0 md:border-0 md:bg-transparent md:mt-8 z-50">
                <div className="container mx-auto flex gap-4 items-center max-w-5xl">
                    
                    {/* Quantity */}
                    <div className="flex items-center gap-3 bg-zinc-100 rounded-xl px-3 py-2 border border-zinc-200">
                        <button 
                            onClick={() => handleQuantityChange('minus')}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-blue-600 disabled:opacity-50"
                            disabled={quantity <= (product.minOrder || 1) || isOutOfStock}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-mono font-bold w-8 text-center">{quantity}</span>
                        <button 
                            onClick={() => handleQuantityChange('plus')}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-blue-600 disabled:opacity-50"
                            disabled={quantity >= currentStock || isOutOfStock}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Add to Cart */}
                    <Button 
                        className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-base shadow-lg shadow-blue-100 rounded-xl"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock || (product.hasVariants && !selectedVariant)}
                    >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {isOutOfStock ? "Stok Habis" : "Masukkan Keranjang"}
                    </Button>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}