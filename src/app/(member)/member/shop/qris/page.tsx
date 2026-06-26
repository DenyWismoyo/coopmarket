"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Loader2, QrCode, Maximize2, X, Settings } from "lucide-react";

export default function MemberQrisPage() {
  const { userData } = useAuth();
  const [qrisUrl, setQrisUrl] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (userData?.qrisUrl) {
      setQrisUrl(userData.qrisUrl);
    }
  }, [userData]);

  if (!userData) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">QRIS Toko Saya</h1>
        <p className="text-zinc-500 text-sm">
           Tampilkan kode QR ini kepada pembeli saat transaksi tatap muka.
        </p>
      </div>

      <Card className="shadow-xl shadow-blue-900/5 border-blue-100 overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10">
            <QrCode className="w-14 h-14 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-extrabold tracking-tight">
               {userData.shopName || userData.fullName || "Toko Koperasi"}
            </h2>
            <p className="text-blue-100 text-sm mt-1.5 font-medium">Scan QRIS untuk melakukan pembayaran</p>
          </div>
        </div>

        <CardContent className="p-6 md:p-10 flex flex-col items-center bg-zinc-50/50">
          {qrisUrl ? (
            // --- TAMPILAN JIKA QRIS SUDAH ADA ---
            <div className="space-y-6 w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
              <div className="relative w-full max-w-xs md:max-w-sm aspect-[3/4] border-2 border-dashed border-blue-200 rounded-3xl p-2 bg-white shadow-lg group">
                <Image 
                  src={qrisUrl} 
                  alt="QRIS Toko" 
                  fill 
                  className="object-contain p-2 rounded-2xl" 
                />
                {/* Overlay Tombol Expand saat di-hover (Desktop) */}
                <div 
                   className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center backdrop-blur-sm cursor-pointer" 
                   onClick={() => setIsFullscreen(true)}
                >
                    <Button variant="secondary" className="rounded-full shadow-2xl font-bold pointer-events-none">
                        <Maximize2 className="w-5 h-5 mr-2 text-blue-600" /> Tampilkan Layar Penuh
                    </Button>
                </div>
              </div>
              
              {/* Tombol Ekstra untuk layar sentuh (mobile) */}
              <Button 
                 className="bg-blue-600 hover:bg-blue-700 font-bold shadow-md md:hidden" 
                 onClick={() => setIsFullscreen(true)}
              >
                 <Maximize2 className="w-4 h-4 mr-2" /> Layar Penuh
              </Button>
            </div>
          ) : (
            // --- TAMPILAN JIKA QRIS BELUM ADA (Redirect ke Profil) ---
            <div className="space-y-6 w-full flex flex-col items-center text-center animate-in fade-in duration-300 py-6">
               <div className="bg-blue-50 text-blue-800 p-5 rounded-xl border border-blue-100 max-w-md w-full">
                  <p className="text-sm font-bold">Anda belum menautkan QRIS Toko.</p>
                  <p className="text-xs mt-2 opacity-80 leading-relaxed">
                     Silakan unggah gambar poster QRIS toko Anda melalui menu pengaturan profil agar dapat ditampilkan di sini saat pembeli melakukan *checkout* POS offline.
                  </p>
               </div>
               
               <Link href="/member/profile">
                  <Button className="bg-blue-600 hover:bg-blue-700 font-bold shadow-md shadow-blue-200 h-11 px-6">
                     <Settings className="w-4 h-4 mr-2" /> Buka Profil & Unggah QRIS
                  </Button>
               </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- DIALOG MODAL LAYAR PENUH --- */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
         <DialogContent className="max-w-md md:max-w-lg w-[95vw] h-[85vh] p-0 overflow-hidden bg-zinc-900 border-none shadow-2xl rounded-3xl flex flex-col">
            <DialogTitle className="sr-only">Layar Penuh QRIS</DialogTitle>
            
            <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-zinc-800">
               <div className="font-bold text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-400" />
                  <span className="truncate max-w-[200px]">{userData?.shopName || userData?.fullName}</span>
               </div>
               <DialogClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700">
                     <X className="w-4 h-4" />
                  </Button>
               </DialogClose>
            </div>

            <div className="relative flex-1 w-full bg-black p-4 flex items-center justify-center">
               <div className="relative w-full h-full max-w-md aspect-[3/4]">
                  <Image 
                     src={qrisUrl} 
                     alt="QRIS Fullscreen" 
                     fill 
                     quality={100}
                     className="object-contain" 
                  />
               </div>
            </div>
            
            <div className="p-4 bg-zinc-900 text-center border-t border-zinc-800">
               <p className="text-zinc-400 text-sm font-medium">Silakan scan kode QR di atas untuk membayar</p>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}