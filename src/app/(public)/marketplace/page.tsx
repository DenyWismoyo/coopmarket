"use client";

import { useState, useEffect } from "react";
import { productService } from "@/services/product.service";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/modules/marketplace/product-card";
import { MainNavbar } from "@/components/layout/main-navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { 
  Search, 
  ShoppingBag, 
  Utensils, 
  Coffee, 
  Palette, 
  Briefcase, 
  Package, 
  Shirt, 
  MoreHorizontal,
  Filter,
  Loader2,
  ArrowDown
} from "lucide-react";
import { DocumentSnapshot } from "firebase/firestore";

const CATEGORIES = [
  { id: "Semua", label: "Semua", icon: ShoppingBag },
  { id: "Makanan", label: "Makanan", icon: Utensils },
  { id: "Minuman", label: "Minuman", icon: Coffee },
  { id: "Fashion", label: "Fashion", icon: Shirt },
  { id: "Kerajinan", label: "Kerajinan", icon: Palette },
  { id: "Sembako", label: "Sembako", icon: Package },
  { id: "Jasa", label: "Jasa", icon: Briefcase },
  { id: "Lainnya", label: "Lainnya", icon: MoreHorizontal },
];

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination State
  const [products, setProducts] = useState<Product[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 1. Fetch Awal (Reset saat kategori berubah)
  useEffect(() => {
    async function fetchInitial() {
      setLoading(true);
      setProducts([]);
      setLastDoc(undefined);
      try {
        const res = await productService.getPublicProducts(
          activeCategory === "Semua" ? undefined : activeCategory, 
          12 // Page size awal
        );
        setProducts(res.data);
        setLastDoc(res.lastVisible);
        setHasMore(res.hasMore);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchInitial();
  }, [activeCategory]);

  // 2. Load More (Pagination)
  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await productService.getPublicProducts(
        activeCategory === "Semua" ? undefined : activeCategory, 
        8, // Page size berikutnya
        lastDoc
      );
      setProducts(prev => [...prev, ...res.data]);
      setLastDoc(res.lastVisible);
      setHasMore(res.hasMore);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Filter pencarian client-side (sementara, untuk UX cepat)
  // Idealnya search juga server-side jika data sangat besar
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50/50 font-sans pb-20">
      <MainNavbar />

      {/* --- HERO SECTION --- */}
      <div className="relative bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl pointer-events-none mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[400px] h-[400px] bg-red-900/40 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left space-y-6">
              <Badge className="bg-white/20 text-white border-white/20 backdrop-blur-sm px-4 py-1.5 text-sm font-medium tracking-wide uppercase hover:bg-white/30 transition-colors">
                Koperasi Indonesia Maju
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Bangga Buatan <br />
                <span className="text-red-100 drop-shadow-sm">Indonesia</span>
              </h1>
              <p className="text-red-100/90 text-lg max-w-xl mx-auto md:mx-0 leading-relaxed">
                Dukung ekonomi kerakyatan dengan membeli produk asli dari anggota koperasi di seluruh nusantara.
              </p>
              
              {/* Search Bar */}
              <div className="max-w-lg mx-auto md:mx-0 relative group pt-4">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-lg group-hover:bg-white/30 transition-all duration-500 transform translate-y-2" />
                <div className="relative flex items-center bg-white rounded-full p-1.5 shadow-2xl transition-transform hover:scale-[1.01]">
                  <div className="pl-4 text-red-500">
                    <Search className="w-5 h-5" />
                  </div>
                  <Input 
                    className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-zinc-900 placeholder:text-zinc-400 h-12 text-base w-full"
                    placeholder="Cari produk lokal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button className="rounded-full px-8 bg-red-600 hover:bg-red-700 text-white font-semibold h-10 transition-colors shadow-md">
                    Cari
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 hidden md:flex justify-center md:justify-end relative">
              <div className="relative w-[340px] h-[340px] lg:w-[480px] lg:h-[480px] flex items-center justify-center">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl transform scale-110 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-red-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 w-full h-full p-6 drop-shadow-2xl transition-transform duration-700 hover:scale-105">
                    <Image src="/icon.png" alt="Logo" fill className="object-contain" priority />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="container mx-auto px-4 py-12 -mt-8 relative z-20">
        
        {/* Kategori Pills */}
        <div className="bg-white rounded-xl shadow-lg shadow-zinc-200/50 border border-zinc-100 p-4 mb-10 sticky top-20 z-30 overflow-x-auto no-scrollbar backdrop-blur-xl bg-white/95">
          <div className="flex items-center gap-3 min-w-max">
            <div className="flex items-center gap-2 mr-4 text-sm font-bold text-red-800 border-r border-red-100 pr-4">
              <Filter className="w-4 h-4 text-red-600" /> Kategori
            </div>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 transform active:scale-95 ${
                    isActive 
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-600 ring-offset-2" 
                      : "bg-zinc-50 text-zinc-600 hover:bg-red-50 hover:text-red-700 border border-zinc-200 hover:border-red-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div>
                <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                {activeCategory === "Semua" ? "Rekomendasi Produk" : `Kategori: ${activeCategory}`}
                </h2>
                <p className="text-zinc-500 text-sm mt-1">Pilihan terbaik dari anggota koperasi untuk Anda.</p>
            </div>
            <span className="text-sm font-medium bg-zinc-100 px-3 py-1 rounded-full text-zinc-600">
              {filteredProducts.length} produk ditampilkan
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                 <div key={i} className="space-y-4">
                    <Skeleton className="h-[200px] w-full rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                 </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-2xl border border-dashed border-zinc-300">
               <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-50 text-zinc-400 mb-6">
                 <Search className="w-10 h-10 opacity-50" />
               </div>
               <h3 className="text-xl font-bold text-zinc-900 mb-2">Produk Tidak Ditemukan</h3>
               <p className="text-zinc-500 max-w-md mx-auto mb-6">
                 Maaf, kami tidak dapat menemukan produk dengan kata kunci <span className="font-semibold text-zinc-900">"{searchQuery}"</span>.
               </p>
               <Button 
                 variant="outline" 
                 className="text-red-600 border-red-200 hover:bg-red-50" 
                 onClick={() => { setActiveCategory("Semua"); setSearchQuery(""); }}
               >
                 Tampilkan Semua Produk
               </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Tombol Load More */}
              {hasMore && !searchQuery && (
                <div className="flex justify-center pt-8">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="bg-white border-zinc-200 hover:bg-zinc-50 hover:text-red-600 min-w-[200px]"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memuat...
                      </>
                    ) : (
                      <>
                        Tampilkan Lebih Banyak <ArrowDown className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}