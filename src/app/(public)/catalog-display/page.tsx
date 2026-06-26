// File: src/app/admin/catalog-display/page.tsx
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

import { Loader2, ArrowLeft, MonitorPlay, Sparkles, Package, ScanLine } from "lucide-react";

const ITEMS_PER_PAGE = 3;
const PAGE_DURATION = 10000;

export default function CatalogDisplayPage() {
  const { user, userData, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [coopData, setCoopData] = useState<Cooperative | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);

  // Fetch Data Produk & Data Koperasi Secara Paralel
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
    if (pages.length <= 1) return;
    const timer = setInterval(() => setPageIndex((prev) => (prev + 1) % pages.length), PAGE_DURATION);
    return () => clearInterval(timer);
  }, [pages.length]);

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

        <button 
          onClick={() => router.push('/admin')}
          className="group flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium hover:bg-white hover:text-black hover:border-white transition-all duration-500"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Tutup Display
        </button>
      </header>

      {/* PROGRESS BAR LINE */}
      <div className="w-full h-1 bg-zinc-900 relative z-50">
        <div 
          key={`progress-${pageIndex}`}
          className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-[fill-progress_10s_linear_forwards]"
        />
      </div>

      {/* MAIN CONTENT */}
      {/* Menggunakan padding responsif dan min-h-0 agar flex child tidak meluap */}
      <main className="relative z-10 flex-1 flex flex-row p-4 sm:p-6 lg:p-8 xl:p-10 gap-4 lg:gap-8 overflow-hidden min-h-0">
        
        {/* GALERI PRODUK */}
        {/* min-w-0 untuk mencegah overflow horizontal */}
        <section className="relative flex-1 rounded-3xl h-full flex items-center min-w-0">
          {products.length === 0 ? (
            <div className="w-full text-center">
              <Package className="w-24 h-24 text-zinc-800 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-zinc-600 mb-2">Etalase Kosong</h2>
            </div>
          ) : (
            <div className="relative w-full h-full py-4 sm:py-6">
              {/* Mengubah h-[90%] menjadi h-full dengan padding vertikal agar proporsional di semua layar */}
              {pages.map((page, pIdx) => {
                const isActive = pIdx === pageIndex;

                return (
                  <div 
                    key={`page-wrap-${pIdx}`} 
                    className={`absolute inset-0 flex items-center justify-between gap-4 lg:gap-6 transition-opacity duration-[1200ms] ease-in-out
                      ${isActive ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}
                    `}
                  >
                    {page.map((product, idx) => (
                      <div 
                        key={`prod-${pIdx}-${idx}`} 
                        className={`relative h-full flex-1 rounded-[2.2rem] p-[3px] group overflow-hidden transition-all duration-[1200ms] ease-out
                          ${isActive ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}
                        `}
                        style={{ transitionDelay: isActive ? `${idx * 150}ms` : '0ms' }}
                      >
                        
                        {/* EFEK GARIS JALAN */}
                        {isActive && (
                          <div 
                            className="absolute inset-0 z-0 opacity-0"
                            style={{ animation: `fade-seq-${idx} 10s linear forwards` }}
                          >
                            <div className="absolute top-1/2 left-1/2 w-[250%] h-[250%] bg-[conic-gradient(from_0deg,transparent_0_280deg,rgba(220,38,38,1)_360deg)] animate-[spin-border_4s_linear_infinite]" />
                          </div>
                        )}

                        <div className="relative z-10 w-full h-full bg-zinc-950 rounded-[2rem] overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <Image 
                              src={product.images[0]} 
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
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
                          
                          <div className="absolute top-6 right-6 z-20">
                            {product.stock <= 0 ? (
                              <div className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-sm">Habis</div>
                            ) : product.stock <= 5 ? (
                              <div className="px-4 py-1.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-sm animate-pulse">
                                Sisa {product.stock}
                              </div>
                            ) : null}
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mb-3">
                              {product.category}
                            </p>
                            <h3 className="text-2xl xl:text-3xl font-bold text-white leading-tight line-clamp-2 mb-6 drop-shadow-lg">
                              {product.name}
                            </h3>
                            <div>
                              <p className="text-[10px] text-red-400 font-black mb-1 tracking-widest uppercase">Harga Spesial</p>
                              <p className="text-3xl xl:text-4xl font-light text-white drop-shadow-md tracking-tight">
                                {formatCurrency(product.price).replace("Rp", "Rp ")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* KOLOM TETAP QR CODE (TERHUBUNG KE DATABASE) */}
        {/* Menggunakan lebar persentase dengan batasan min/max width */}
        <section className="w-[28vw] min-w-[260px] max-w-[380px] h-full flex flex-col justify-center flex-shrink-0">
          
          {/* h-full, max-h-full, dan flex-col agar isi bisa merapat jika layar pendek */}
          <div className="h-full max-h-[800px] flex flex-col bg-zinc-900/60 border border-white/10 rounded-[2.5rem] p-6 lg:p-8 backdrop-blur-xl relative overflow-hidden group hover:border-red-500/50 transition-colors duration-700 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-amber-600/5 pointer-events-none" />
            
            {/* Header QR */}
            <div className="relative z-10 flex flex-col items-center text-center flex-shrink-0">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mb-4 lg:mb-6 animate-pulse">
                <ScanLine className="w-6 h-6 lg:w-8 lg:h-8" />
              </div>
              
              <h2 className="text-xl lg:text-2xl font-black text-white mb-2 tracking-tight">Belanja Sekarang</h2>
              <p className="text-xs lg:text-sm text-zinc-400 mb-4 lg:mb-8 leading-relaxed line-clamp-2 md:line-clamp-none">
                Scan kode QR ini menggunakan kamera ponsel Anda untuk membeli produk yang sedang tampil.
              </p>
            </div>

            {/* QR Code Container Dinamis. Menggunakan flex-1 dan min-h-0 agar BISA MENYUSUT mengikuti tinggi layar! */}
            <div className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center mb-4 lg:mb-8">
              {/* Gambar dipaksa mengikuti ruang tersisa, bukan memaksakan ruang */}
              <div className="relative w-full h-full max-w-[250px] max-h-[250px] aspect-square bg-white rounded-3xl p-3 lg:p-4 shadow-[0_0_40px_rgba(220,38,38,0.2)] transform transition-transform duration-500 group-hover:scale-105">
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
            
            {/* Footer QR */}
            <div className="relative z-10 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-widest text-zinc-300 text-center flex-shrink-0">
              Official Marketplace
            </div>
          </div>
        </section>
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