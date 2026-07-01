// File: src/app/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MainNavbar } from "@/components/layout/main-navbar";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="h-screen bg-white font-sans selection:bg-red-100 selection:text-red-900 overflow-hidden flex flex-col">
      <MainNavbar />
      
      <section className="flex-1 relative bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white flex items-center">
        
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl pointer-events-none mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[500px] h-[500px] bg-red-900/40 rounded-full blur-3xl pointer-events-none" />
        
        {/* GUNAKAN CLASS INI (Pastikan class .bg-grid-pattern sudah ada di globals.css) */}
        <div className="absolute inset-0 bg-center opacity-10 bg-grid-pattern" />

        <div className="container px-4 mx-auto relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
            
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/30 border border-red-400/30 text-red-50 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Revolusi Unit / Organisasi Industri Kreatif Indonesia
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-100">
                Transformasi Digital <br />
                <span className="text-red-100 drop-shadow-md">Ekonomi Kerakyatan</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-red-50/90 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                Membangun ekosistem unit / organisasi industri kreatif masa depan yang modern, transparan, dan inklusif. Kami menghadirkan teknologi untuk memberdayakan potensi lokal, memperluas akses pasar, dan menciptakan kesejahteraan bersama yang berkelanjutan.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-7 duration-1000 delay-300">
                <Link href="/marketplace">
                  <Button size="lg" className="bg-white text-red-700 hover:bg-red-50 font-bold text-base h-12 px-8 shadow-lg shadow-red-900/20 w-full sm:w-auto transform hover:-translate-y-1 transition-transform duration-300">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Mulai Belanja
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="border-red-300 text-white hover:bg-white/10 hover:text-white bg-transparent font-medium text-base h-12 px-8 w-full sm:w-auto backdrop-blur-sm transition-all duration-300">
                    Pelajari Misi Kami <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="flex-1 relative w-full max-w-[450px] lg:max-w-[500px] animate-in zoom-in duration-1000 delay-200 hidden lg:block">
              <div className="relative aspect-square w-full">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl transform scale-90 pointer-events-none" />
                
                {/* Main Icon */}
                <div className="relative z-10 w-full h-full p-8 transition-transform duration-700 hover:scale-105 drop-shadow-2xl flex items-center justify-center">
                   <div className="relative w-full h-full p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
                      <Image 
                          src="/icon.png" 
                          alt="Ilustrasi Unit / Organisasi Digital" 
                          fill
                          className="object-contain p-4"
                          priority
                      />
                   </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 bg-zinc-900 text-center text-zinc-500 text-xs border-t border-zinc-800">
        <div className="container mx-auto px-4 flex justify-between items-center">
            <span>&copy; {new Date().getFullYear()} Hak Cipta Dilindungi.</span>
            <div className="flex gap-4">
                <Link href="#" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
                <Link href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
            </div>
        </div>
      </footer>
    </div>
  );
}