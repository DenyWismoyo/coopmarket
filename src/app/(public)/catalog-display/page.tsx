"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";
import { productService } from "@/services/product.service";
import { cooperativeService } from "@/services/cooperative.service";
import { Product } from "@/types/product";
import { Cooperative } from "@/types/cooperative";
import { formatCurrency } from "@/lib/utils";
import { Loader2, ArrowLeft, MonitorPlay, Sparkles, Package, LayoutGrid } from "lucide-react";

const ITEMS_PER_PAGE = 3;
const PAGE_DURATION = 10000; // Layar pindah setiap 10 detik

// ============================================================================
// KOMPONEN: KARTU PRODUK DENGAN ANIMASI 3D FLIP (AUTO-ROTASI GAMBAR)
// ============================================================================
const ProductCard = ({ product, isActive, idx }: { product: Product; isActive: boolean; idx: number }) => {
  const images = product.images && product.images.length > 0 ? product.images : [];
  const hasMultiple = images.length > 1;
  
  // State untuk mengelola gambar sisi Depan dan Belakang kartu 3D
  const [frontIndex, setFrontIndex] = useState(0);
  const [backIndex, setBackIndex] = useState(hasMultiple ? 1 : 0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    // Jika sedang tidak tampil di layar atau gambarnya hanya 1, hentikan putaran
    if (!isActive || !hasMultiple) return;
    
    // Auto-flip setiap 4 detik
    const timer = setInterval(() => {
      setIsFlipped(prev => {
        const nextFlipped = !prev;
        
        // Setelah kartu membalik, kita siapkan gambar baru untuk sisi yang sedang tersembunyi
        // Timeout 600ms disesuaikan dengan durasi animasi CSS transition-transform
        if (nextFlipped) {
          setTimeout(() => setFrontIndex((backIndex + 1) % images.length), 600);
        } else {
          setTimeout(() => setBackIndex((frontIndex + 1) % images.length), 600);
        }
        return nextFlipped;
      });
    }, 4000); 

    return () => clearInterval(timer);
  }, [isActive, hasMultiple, frontIndex, backIndex, images.length]);

  return (
    <div 
      className={`relative h-full flex-1 rounded-[2.2rem] p-[3px] group overflow-hidden transition-all duration-[1200ms] ease-out 
        ${isActive ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}
      `}
      style={{ transitionDelay: isActive ? `${idx * 150}ms` : '0ms' }}
    >
      {/* Efek Border Berjalan Merah-Emas */}
      {isActive && (
        <div className="absolute inset-0 z-0 opacity-0" style={{ animation: `fade-seq-${idx} 10s linear forwards` }}>
          <div className="absolute top-1/2 left-1/2 w-[250%] h-[250%] bg-[conic-gradient(from_0deg,transparent_0_280deg,rgba(220,38,38,1)_360deg)] animate-[spin-border_4s_linear_infinite]" />
        </div>
      )}

      {/* Kontainer Utama */}
      <div className="relative z-10 w-full h-full bg-zinc-950 rounded-[2rem] overflow-hidden" style={{ perspective: '1000px' }}>
        
        {/* CONTAINER YANG BERPUTAR 3D */}
        <div 
          className="relative w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ 
            transformStyle: 'preserve-3d', 
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
          }}
        >
          {/* WAJAH DEPAN (FRONT FACE) */}
          <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
            {images.length > 0 ? (
              <Image 
                src={images[frontIndex]} 
                alt={product.name}
                fill
                className={`object-cover transition-transform duration-[10000ms] ease-linear ${isActive ? 'scale-110' : 'scale-100'}`}
                sizes="33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                <Package className="w-20 h-20 text-zinc-700" />
              </div>
            )}
          </div>

          {/* WAJAH BELAKANG (BACK FACE) */}
          <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            {images.length > 0 && (
              <Image 
                src={images[backIndex]} 
                alt={product.name}
                fill
                className={`object-cover transition-transform duration-[10000ms] ease-linear ${isActive ? 'scale-110' : 'scale-100'}`}
                sizes="33vw"
              />
            )}
          </div>
        </div>

        {/* LAYER OVERLAY & TEXT (Diletakkan terpisah dari kontainer 3D agar text tidak ikut terbalik/tetap statis!) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500 z-20 pointer-events-none" />
        
        <div className="absolute top-6 right-6 z-30 pointer-events-none">
          {product.stock <= 0 ? (
            <div className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-sm shadow-xl">Habis</div>
          ) : product.stock <= 5 ? (
            <div className="px-4 py-1.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-sm animate-pulse shadow-xl">
              Sisa {product.stock}
            </div>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 z-30 pointer-events-none">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mb-3 drop-shadow-md">
            {product.category}
          </p>
          <h3 className="text-2xl xl:text-3xl font-bold text-white leading-tight line-clamp-2 mb-6 drop-shadow-lg">
            {product.name}
          </h3>
          <div>
            <p className="text-[10px] text-red-400 font-black mb-1 tracking-widest uppercase drop-shadow-md">Harga Spesial</p>
            <p className="text-3xl xl:text-4xl font-light text-white drop-shadow-md tracking-tight">
              {formatCurrency(product.price).replace("Rp", "Rp ")}
            </p>
          </div>
          
          {/* Indikator Varian (Dots) */}
          {hasMultiple && (
             <div className="absolute bottom-4 right-8 flex gap-1.5 shadow-xl">
                {images.map((_, i) => {
                   const isCurrent = isFlipped ? i === backIndex : i === frontIndex;
                   return (
                     <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${isCurrent ? 'w-5 bg-red-500' : 'w-1.5 bg-white/40'}`} />
                   )
                })}
             </div>
          )}
        </div>

      </div>
    </div>
  );
};


// ============================================================================
// KOMPONEN UTAMA (PAGE)
// ============================================================================
export default function CatalogDisplayPage() {
  const { user, userData, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [coopData, setCoopData] = useState<Cooperative | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  
  const [activeView, setActiveView] = useState<"catalog" | "video">("catalog");

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      router.push("/");
      return;
    }
    const fetchData = async () => {
      try {
        if (userData?.coopId) {
          const [productsRes, coopRes] = await Promise.all([
            productService.getPOSProducts(userData.coopId),
            cooperativeService.getCooperativeById(userData.coopId)
          ]);
          setProducts(productsRes);
          setCoopData(coopRes);
        }
      } catch (error) {
        console.error("Gagal memuat data pameran:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, userData, authLoading, isAdmin, router]);

  // Ekstrak ID YouTube dan ubah menjadi URL Embed yang Bersih
  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      const videoId = match[2];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${videoId}`;
    }
    return url;
  };

  const paddedProducts = [...products];
  if (products.length > 0) {
    while (paddedProducts.length % ITEMS_PER_PAGE !== 0) {
      paddedProducts.push(products[paddedProducts.length % products.length]);
    }
  }

  const pages = [];
  for (let i = 0; i < paddedProducts.length; i += ITEMS_PER_PAGE) {
    pages.push(paddedProducts.slice(i, i + ITEMS_PER_PAGE));
  }

  useEffect(() => {
    if (pages.length <= 1 || activeView !== "catalog") return;
    const timer = setInterval(() => setPageIndex((prev) => (prev + 1) % pages.length), PAGE_DURATION);
    return () => clearInterval(timer);
  }, [pages.length, activeView]);

  if (authLoading || loading) {
    return (
      <div className="h-screen w-screen bg-[#030303] flex flex-col items-center justify-center text-white overflow-hidden">
        <MonitorPlay className="w-20 h-20 text-red-600 animate-pulse mb-6 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]" />
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        <p className="mt-4 text-zinc-500 tracking-widest uppercase text-sm font-bold">Menyiapkan Etalase Premium...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#030303] text-white selection:bg-red-600 overflow-hidden font-sans flex flex-col relative">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute top-[-30%] left-[-10%] w-[60%] h-[60%] rounded-full bg-red-900/15 blur-[180px]" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[60%] h-[60%] rounded-full bg-amber-900/10 blur-[180px]" />
      </div>

      {/* HEADER */}
      <header className="relative z-50 w-full px-10 py-5 flex items-center justify-between bg-black/50 backdrop-blur-xl border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-5">
          <div className="relative w-12 h-12 bg-white rounded-2xl p-1 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <Image src="/icon.png" alt="Logo" fill className="object-contain p-1.5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Katalog Digital <Sparkles className="w-5 h-5 text-amber-500/80" />
            </h1>
            <p className="text-sm text-zinc-400 font-bold uppercase tracking-[0.2em]">{userData?.coopName}</p>
          </div>
        </div>

        {/* SWITCH TOGGLE: KATALOG VS VIDEO */}
        {coopData?.promoVideoUrl && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md shadow-2xl">
            <button
              onClick={() => setActiveView("catalog")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeView === "catalog" 
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Katalog Produk
            </button>
            <button
              onClick={() => setActiveView("video")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeView === "video" 
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <MonitorPlay className="w-4 h-4" /> Video Promo
            </button>
          </div>
        )}

        <button 
          onClick={() => router.push('/')}
          className="group flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white hover:text-black hover:border-white transition-all duration-500"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Tutup Display
        </button>
      </header>

      {/* PROGRESS BAR LINE */}
      {activeView === "catalog" && (
        <div className="w-full h-1 bg-zinc-900 relative z-50">
          <div 
            key={`progress-${pageIndex}`}
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-[fill-progress_10s_linear_forwards]"
          />
        </div>
      )}

      {/* MAIN CONTENT AREA MENGGUNAKAN CSS GRID */}
      <main className="relative z-10 flex-1 grid p-4 sm:p-6 lg:p-8 xl:p-10 min-h-0">
        
        {/* ============================================================== */}
        {/* LAYER 1: KATALOG */}
        {/* ============================================================== */}
        <div className={`col-start-1 row-start-1 flex flex-row gap-4 lg:gap-8 w-full h-full transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${activeView === 'catalog' ? 'opacity-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'}`}>
            
            <section className="relative flex-1 rounded-3xl h-full flex items-center min-w-0">
              {products.length === 0 ? (
                <div className="w-full text-center">
                  <Package className="w-24 h-24 text-zinc-800 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-zinc-600 mb-2">Etalase Kosong</h2>
                </div>
              ) : (
                <div className="relative w-full h-full py-4 sm:py-6">
                  {pages.map((page, pIdx) => {
                    const isActive = pIdx === pageIndex;
                    return (
                      <div 
                        key={`page-wrap-${pIdx}`} 
                        className={`absolute inset-0 flex items-center justify-between gap-4 lg:gap-6 transition-opacity duration-[1200ms] ease-in-out 
                          ${isActive ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}
                        `}
                      >
                        {/* PANGGIL KOMPONEN PRODUCT CARD DENGAN ANIMASI FLIP */}
                        {page.map((product, idx) => (
                          <ProductCard 
                            key={`prod-${pIdx}-${idx}`} 
                            product={product} 
                            isActive={isActive} 
                            idx={idx} 
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            
            {/* Tempat kosong penyangga Sidebar Katalog */}
            <section className="w-[28vw] min-w-[260px] max-w-[380px] h-full flex-shrink-0" />
        </div>

        {/* ============================================================================== */}
        {/* LAYER 2: INTERAKTIF VIDEO & QR WIDGET */}
        {/* ============================================================================== */}
        <div className="col-start-1 row-start-1 w-full h-full flex flex-row justify-end pointer-events-none z-20">
           
           <section className={`h-full flex flex-col justify-center transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto
              ${activeView === 'catalog' ? 'w-[28vw] min-w-[260px] max-w-[380px]' : 'w-full'}
           `}>

              {/* SINGLE VIDEO PLAYER (TIDAK PERNAH UNMOUNT) */}
              {coopData?.promoVideoUrl && (
                <div 
                  onClick={() => activeView === "catalog" && setActiveView("video")}
                  className={`bg-black border border-white/10 overflow-hidden relative transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${activeView === 'catalog' 
                      ? 'w-full aspect-video rounded-[2rem] shadow-[0_0_30px_rgba(0,0,0,0.5)] cursor-pointer flex-shrink-0' 
                      : 'w-full h-full flex-1 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)]'
                    }
                  `}
                >
                  <iframe 
                    src={getYoutubeEmbedUrl(coopData.promoVideoUrl) || ""} 
                    className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                    allow="autoplay; fullscreen; encrypted-media"
                  />
                  <div className="absolute inset-0 bg-transparent pointer-events-auto"></div>
                </div>
              )}

              {/* WIDGET QR CODE */}
              <div className={`flex flex-col bg-zinc-900/60 border border-white/10 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl
                 ${activeView === 'catalog'
                   ? 'flex-1 opacity-100 p-6 lg:p-8 mt-6'
                   : 'flex-none h-0 opacity-0 p-0 mt-0 border-transparent'
                 }
              `}>
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-amber-600/5 pointer-events-none" />
                <div className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center mb-4 lg:mb-8">
                  <div className="relative w-full h-full max-w-[250px] max-h-[250px] aspect-square bg-white rounded-3xl p-3 lg:p-4 shadow-[0_0_40px_rgba(220,38,38,0.2)]">
                    <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-dashed border-zinc-200">
                      <Image 
                        src={coopData?.qrStoreUrl || "/qrtechnopard.png"} 
                        alt="QR Code Koperasi"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  </div>
                </div>
                <div className="relative z-10 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-widest text-zinc-300 text-center flex-shrink-0">
                  Official Marketplace
                </div>
              </div>
           </section>
        </div>
      </main>

      {/* FOOTER MARQUEE */}
      <footer className="relative z-50 w-full bg-[#0a0a0a] border-t border-white/5 py-3 flex-shrink-0">
        <div className="whitespace-nowrap flex items-center animate-[marquee_30s_linear_infinite]">
          <span className="text-sm font-medium tracking-[0.3em] uppercase mx-16 text-zinc-400">DAPATKAN HARGA SPESIAL SELAMA PAMERAN</span>
          <span className="text-sm font-medium tracking-[0.3em] uppercase mx-16 text-amber-500/80">SCAN QR CODE DI STAN KAMI UNTUK PEMESANAN</span>
          <span className="text-sm font-medium tracking-[0.3em] uppercase mx-16 text-zinc-400">BANGGA BUATAN INDONESIA</span>
          <span className="text-sm font-medium tracking-[0.3em] uppercase mx-16 text-zinc-400">DAPATKAN HARGA SPESIAL SELAMA PAMERAN</span>
          <span className="text-sm font-medium tracking-[0.3em] uppercase mx-16 text-amber-500/80">SCAN QR CODE DI STAN KAMI UNTUK PEMESANAN</span>
        </div>
      </footer>

      {/* KEYFRAMES */}
      <style jsx global>{`
        @keyframes fill-progress { 0% { width: 0%; } 100% { width: 100%; } }
        @keyframes spin-border { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes fade-seq-0 { 0% { opacity: 0; } 2% { opacity: 1; } 32% { opacity: 1; } 34% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes fade-seq-1 { 0% { opacity: 0; } 32% { opacity: 0; } 34% { opacity: 1; } 65% { opacity: 1; } 67% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes fade-seq-2 { 0% { opacity: 0; } 65% { opacity: 0; } 67% { opacity: 1; } 98% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}