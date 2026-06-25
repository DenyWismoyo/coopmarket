// File: src/app/marketplace/page.tsx
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
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import Image from "next/image";
import { 
  Search, 
  ShoppingBag, 
  Utensils, 
  Shirt, 
  Sparkles,
  Monitor,
  Home,
  HeartPulse,
  Gamepad2,
  Car,
  Wrench,
  MoreHorizontal,
  Filter,
  Loader2,
  ArrowDown,
  LayoutList
} from "lucide-react";
import { DocumentSnapshot } from "firebase/firestore";

const CATEGORIES = [
  { id: "Semua", label: "Semua Kategori", icon: ShoppingBag },
  { id: "Makanan & Minuman", label: "Makanan & Minuman", icon: Utensils },
  { id: "Fashion Pria", label: "Fashion Pria", icon: Shirt },
  { id: "Fashion Wanita", label: "Fashion Wanita", icon: Sparkles },
  { id: "Elektronik", label: "Elektronik", icon: Monitor },
  { id: "Kebutuhan Rumah", label: "Kebutuhan Rumah", icon: Home },
  { id: "Kesehatan", label: "Kesehatan", icon: HeartPulse },
  { id: "Hobi & Koleksi", label: "Hobi & Koleksi", icon: Gamepad2 },
  { id: "Otomotif", label: "Otomotif", icon: Car },
  { id: "Jasa & Layanan", label: "Jasa & Layanan", icon: Wrench },
  { id: "Lainnya", label: "Lainnya", icon: MoreHorizontal },
];

export default function MarketplacePage() {
  // STATE BARU: Menggunakan array untuk multi-select
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State untuk Laci Filter (Drawer)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempCategories, setTempCategories] = useState<string[]>([]); // Menyimpan pilihan sebelum klik 'Terapkan'
  
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
        // Jika tidak ada kategori dipilih ATAU semua kategori dipilih (10 kategori), fetch tanpa filter kategori
        const isAllSelected = activeCategories.length === 0 || activeCategories.length === CATEGORIES.length - 1;
        const payload = isAllSelected ? undefined : activeCategories;

        const res = await productService.getPublicProducts(payload, 12);
        
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
  }, [activeCategories]);

  // 2. Load More (Pagination)
  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const isAllSelected = activeCategories.length === 0 || activeCategories.length === CATEGORIES.length - 1;
      const payload = isAllSelected ? undefined : activeCategories;

      const res = await productService.getPublicProducts(payload, 8, lastDoc);
      setProducts(prev => [...prev, ...res.data]);
      setLastDoc(res.lastVisible);
      setHasMore(res.hasMore);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handler untuk mengubah Checkbox Kategori
  const toggleCategory = (catId: string, isTemp = false) => {
    const targetList = isTemp ? tempCategories : activeCategories;
    const setTarget = isTemp ? setTempCategories : setActiveCategories;

    if (catId === "Semua") {
      setTarget([]); // Reset array jika klik Semua
      return;
    }

    if (targetList.includes(catId)) {
      setTarget(targetList.filter(id => id !== catId));
    } else {
      setTarget([...targetList, catId]);
    }
  };

  // Handler membuka laci filter (Sinkronisasi kategori)
  const handleOpenFilter = () => {
    setTempCategories(activeCategories);
    setIsFilterOpen(true);
  };

  // Handler menerapkan filter dari laci
  const applyFilter = () => {
    setActiveCategories(tempCategories);
    setIsFilterOpen(false);
  };

  // Filter pencarian teks
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
              <Badge className="bg-white/20 text-white border-white/20 backdrop-blur-sm px-4 py-1.5 text-xs md:text-sm font-medium tracking-wide uppercase hover:bg-white/30 transition-colors">
                Revolusi koperasi / komunitas industri Kreatif Indonesia
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Bangga Buatan <br />
                <span className="text-red-100 drop-shadow-sm">Indonesia</span>
              </h1>
              <p className="text-red-100/90 text-base md:text-lg max-w-xl mx-auto md:mx-0 leading-relaxed">
                Dukung ekonomi kerakyatan dengan membeli produk asli dari anggota koperasi / komunitas di seluruh nusantara.
              </p>
              
              <div className="max-w-lg mx-auto md:mx-0 relative group pt-4">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-lg group-hover:bg-white/30 transition-all duration-500 transform translate-y-2" />
                <div className="relative flex items-center bg-white rounded-full p-1.5 shadow-2xl transition-transform hover:scale-[1.01]">
                  <div className="pl-4 text-red-500">
                    <Search className="w-5 h-5" />
                  </div>
                  <Input 
                    className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-zinc-900 placeholder:text-zinc-400 h-10 md:h-12 text-sm md:text-base w-full"
                    placeholder="Cari produk lokal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button className="rounded-full px-6 md:px-8 bg-red-600 hover:bg-red-700 text-white font-semibold h-9 md:h-10 transition-colors shadow-md text-sm md:text-base">
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
      <div className="container mx-auto px-4 py-8 md:py-12 -mt-4 md:-mt-8 relative z-20">
        
        {/* --- STICKY CATEGORY & FILTER BAR --- */}
        <div className="sticky top-16 z-30 pb-6 pointer-events-none -mx-4 md:mx-0">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/95 via-zinc-50/80 to-transparent -z-10" />

          <div className="pointer-events-auto bg-white/95 backdrop-blur-xl md:rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-y md:border border-zinc-200/80 py-2 md:p-1.5 flex items-center overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            <div className="flex items-center min-w-max px-2 md:px-0">
              
              <button 
                onClick={handleOpenFilter}
                className="relative flex items-center gap-2 px-4 md:px-5 py-2 text-xs md:text-sm font-bold text-red-800 border-r border-zinc-200 mr-2 md:mr-3 sticky left-0 bg-white/95 backdrop-blur-xl z-20 shadow-[10px_0_15px_-10px_rgba(0,0,0,0.05)] hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer group"
              >
                <Filter className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" /> 
                <span className="hidden sm:inline">Filter</span>
                
                {/* Indikator Titik Merah jika ada filter kustom yang aktif */}
                {activeCategories.length > 0 && (
                  <span className="absolute top-1.5 right-2 md:right-3 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 text-[8px] font-bold text-white items-center justify-center">
                       {activeCategories.length}
                    </span>
                  </span>
                )}
              </button>
              
              {/* KATEGORI HORIZONTAL (Bisa multi-select langsung dari sini) */}
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isAll = cat.id === "Semua";
                const isActive = isAll ? activeCategories.length === 0 : activeCategories.includes(cat.id);

                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id, false)}
                    className={`flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-5 md:py-2.5 mx-1 rounded-full text-xs md:text-sm font-medium transition-all duration-300 transform active:scale-95 whitespace-nowrap ${
                      isActive 
                        ? "bg-red-600 text-white shadow-md shadow-red-600/20" 
                        : "bg-zinc-50 md:bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-100 md:border-transparent"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    {cat.id === "Semua" ? "Semua" : cat.id}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="space-y-6 md:space-y-8 mt-2 md:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-zinc-200 pb-4 gap-3 px-2">
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 flex items-center gap-2">
                   {activeCategories.length === 0 
                      ? "Rekomendasi Produk" 
                      : activeCategories.length === 1 
                         ? `Kategori: ${activeCategories[0]}` 
                         : `${activeCategories.length} Kategori Dipilih`}
                </h2>
                <p className="text-zinc-500 text-xs md:text-sm mt-1">
                  Pilihan terbaik dari komunitas untuk Anda.
                </p>
            </div>
            <span className="text-xs md:text-sm font-medium bg-zinc-100 px-3 py-1 rounded-full text-zinc-600 w-fit">
              {filteredProducts.length} produk ditampilkan
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                 <div key={i} className="space-y-4">
                    <Skeleton className="h-[160px] md:h-[200px] w-full rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                 </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-24 md:py-32 bg-white rounded-2xl border border-dashed border-zinc-300 mx-0 md:mx-4 shadow-sm">
               <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-50 text-zinc-400 mb-6">
                 <Search className="w-8 h-8 md:w-10 md:h-10 opacity-50" />
               </div>
               <h3 className="text-lg md:text-xl font-bold text-zinc-900 mb-2">Produk Tidak Ditemukan</h3>
               <p className="text-sm md:text-base text-zinc-500 max-w-md mx-auto mb-6 px-4">
                 Maaf, tidak ada produk yang cocok dengan pencarian atau kategori ini.
               </p>
               <Button 
                 variant="outline" 
                 className="text-red-600 border-red-200 hover:bg-red-50 rounded-full" 
                 onClick={() => { 
                    setActiveCategories([]); 
                    setSearchQuery(""); 
                 }}
               >
                 Tampilkan Semua Produk
               </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {hasMore && !searchQuery && (
                <div className="flex justify-center pt-8">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="bg-white border-zinc-200 hover:bg-zinc-50 hover:text-red-600 min-w-[200px] rounded-full shadow-sm text-sm md:text-base"
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

      {/* --- LACI MENU KATEGORI MULTIPLE SELECT (CHECKBOX) --- */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 flex flex-col">
          <SheetHeader className="p-6 border-b border-zinc-100 bg-white z-10 shadow-sm">
            <SheetTitle className="flex items-center gap-2 text-xl font-bold">
              <Filter className="w-5 h-5 text-red-600" /> Filter Kategori
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50/30">
             <div className="space-y-4">
                <h4 className="font-bold text-zinc-400 text-xs uppercase tracking-widest flex items-center gap-2 px-1">
                   <LayoutList className="w-4 h-4" /> Kategori Tersedia
                </h4>
                
                {/* List Kategori dengan Checkbox */}
                <div className="space-y-1.5">
                   {CATEGORIES.filter(c => c.id !== "Semua").map((cat) => {
                      const Icon = cat.icon;
                      const isChecked = tempCategories.includes(cat.id);
                      return (
                         <label
                            key={cat.id}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                               isChecked 
                                 ? "bg-red-50 border-2 border-red-200 shadow-sm" 
                                 : "bg-white border-2 border-transparent hover:border-zinc-200 hover:bg-zinc-50"
                            }`}
                         >
                            <div className="flex items-center gap-3">
                               <div className={`p-2.5 rounded-lg ${isChecked ? "bg-white text-red-600 shadow-sm" : "bg-zinc-100 text-zinc-400"}`}>
                                  <Icon className="w-4 h-4" />
                               </div>
                               <span className={`text-sm ${isChecked ? "font-bold text-red-700" : "font-medium text-zinc-600"}`}>
                                  {cat.label}
                               </span>
                            </div>
                            
                            {/* Checkbox Asli Tailwind */}
                            <input 
                               type="checkbox" 
                               className="w-5 h-5 rounded border-zinc-300 text-red-600 focus:ring-red-600 focus:ring-offset-0 cursor-pointer shadow-sm"
                               checked={isChecked}
                               onChange={() => toggleCategory(cat.id, true)}
                            />
                         </label>
                      )
                   })}
                </div>
             </div>
          </div>

          <div className="p-4 border-t border-zinc-100 flex gap-3 bg-white z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
             <Button 
                variant="outline" 
                className="flex-1 rounded-xl bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 font-semibold" 
                onClick={() => setTempCategories([])}
             >
                Hapus Semua
             </Button>
             <Button 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md shadow-red-100 font-bold" 
                onClick={applyFilter}
             >
                Terapkan Filter
             </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}