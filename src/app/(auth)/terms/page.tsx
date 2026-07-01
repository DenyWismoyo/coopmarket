// File: src/app/(auth)/terms/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, Sparkles, ShieldCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

function TermsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "member";
  
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    // Mengarahkan ke halaman Visi Misi terlebih dahulu sebelum form registrasi
    router.push(`/vision?type=${type}`);
  };

  const isUnitRegistration = type === "unit";

  return (
    <Card className="w-full max-w-3xl shadow-xl border-blue-100">
      <CardHeader className="space-y-1 text-center border-b border-zinc-100 pb-6">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-blue-700">
          Syarat, Ketentuan & Keuntungan
        </CardTitle>
        <CardDescription>
          Harap pelajari keuntungan dan aturan main sebelum {isUnitRegistration ? "mendaftarkan unit / organisasi Anda" : "bergabung menjadi anggota"}.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        
        {/* BAGIAN KEUNTUNGAN */}
        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
           <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-600" /> Keuntungan {isUnitRegistration ? "Membuka Unit" : "Menjadi Anggota"}
           </h3>
           <ul className="space-y-2 text-sm text-zinc-700">
              {isUnitRegistration ? (
                 <>
                    <li className="flex items-start gap-2">
                       <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                       <span>Sistem manajemen terpusat untuk mengelola anggota, inventaris, dan pembukuan keuangan secara profesional.</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                       <span>Akses ke Sistem Kasir (POS) utama yang mampu melayani penjualan produk unit dan produk titipan anggota dalam satu keranjang belanja yang sama.</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                       <span>Pemisahan pembayaran otomatis (<strong>Multi-QRIS</strong>) yang menjamin pendapatan produk titipan masuk langsung ke anggota, dan pendapatan produk unit masuk ke kas unit.</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                       <span>Pengelolaan simpanan dan fitur perhitungan pembagian keuntungan berbasis data transaksi yang transparan.</span>
                    </li>
                 </>
              ) : (
                 <>
                    <li className="flex items-start gap-2">
                       <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                       <span>Mendapatkan akses Sistem Kasir (POS) mandiri secara gratis untuk mengelola penjualan dari toko Anda sendiri.</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                       <span>Akses promosi gratis melalui etalase <strong>marketplace</strong> komunitas yang terintegrasi langsung dengan pengguna lain.</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                       <span>Penerimaan pembayaran langsung ke rekening Anda (<strong>Direct Settlement</strong>) melalui sistem <strong>Multi-QRIS</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                       <span>Pelacakan riwayat belanja dan saldo simpanan yang tercatat secara digital dan transparan.</span>
                    </li>
                 </>
              )}
           </ul>
        </div>

        {/* BAGIAN SYARAT DAN KETENTUAN */}
        <div className="space-y-3">
           <h3 className="font-bold text-zinc-800 flex items-center gap-2 px-1">
              <ShieldCheck className="w-5 h-5 text-zinc-600" /> Syarat & Ketentuan Operasional
           </h3>
           <ScrollArea className="h-[280px] w-full rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
             <div className="text-sm text-zinc-600 space-y-5 leading-relaxed">
               
               <div>
                  <p className="font-bold text-zinc-900 mb-1">1. Sistem Transaksi dan Inventaris</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Platform menggunakan algoritma <strong>Atomic Transaction</strong> untuk memastikan sinkronisasi stok secara <strong>real-time</strong> dan mencegah terjadinya kelebihan penjualan (<strong>anti-overselling</strong>).</li>
                    <li>Stok produk akan terpotong secara otomatis oleh sistem segera setelah pesanan berhasil dibuat dan dibayar.</li>
                  </ul>
               </div>

               <div>
                  <p className="font-bold text-zinc-900 mb-1">2. Kebijakan Pembayaran (<strong>Multi-QRIS</strong>)</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Sistem <strong>Multi-QRIS</strong> memisahkan pembayaran pelanggan secara otomatis; dana untuk produk anggota akan masuk langsung ke QR Code milik anggota, sedangkan dana untuk produk unit akan masuk ke QR Code pengelola unit.</li>
                    <li>Pesanan <strong>online</strong> tidak boleh diproses atau dikemas sebelum status pembayaran terkonfirmasi lunas, kecuali menggunakan fitur Bayar di Tempat (COD).</li>
                  </ul>
               </div>

               {isUnitRegistration ? (
                 <div>
                    <p className="font-bold text-zinc-900 mb-1">3. Kewajiban Pengelola Unit</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Pengelola unit bertanggung jawab penuh untuk memproses, mengemas, dan memperbarui status (seperti "Diproses" atau "Selesai") pada setiap pesanan masuk yang berisi produk milik unit.</li>
                      <li>Data pendaftaran unit baru akan ditangguhkan (<em>suspended</em>) dan membutuhkan waktu proses tinjauan oleh pengelola pusat sebelum dapat beroperasi secara aktif.</li>
                    </ul>
                 </div>
               ) : (
                 <div>
                    <p className="font-bold text-zinc-900 mb-1">3. Kewajiban Anggota (Penjual Mandiri)</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Anggota yang membuka etalase wajib mengunggah gambar QRIS pribadinya di menu Pengaturan Toko agar dapat menerima pembayaran <strong>online</strong> maupun di kasir mandiri.</li>
                      <li>Anggota bertindak sebagai penjual mandiri dan bertanggung jawab penuh untuk memantau, mengemas, dan menyelesaikan pesanan pelanggannya sendiri.</li>
                    </ul>
                 </div>
               )}

               <div>
                  <p className="font-bold text-zinc-900 mb-1">4. Privasi & Keamanan</p>
                  <p>
                    Data pribadi yang Anda unggah dilindungi oleh enkripsi sistem. Kami tidak akan membagikan data transaksi atau kredensial Anda kepada pihak luar yang tidak berkepentingan.
                  </p>
               </div>

             </div>
           </ScrollArea>
        </div>

        {/* CHECKBOX PERSETUJUAN */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex gap-4 text-sm text-zinc-800 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => setAgreed(!agreed)}>
          <div className="mt-0.5 shrink-0">
            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${agreed ? 'bg-blue-600 border-blue-600' : 'bg-white border-zinc-300'}`}>
              {agreed && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
          </div>
          <div>
            <p className="font-bold mb-0.5 text-zinc-900">Pernyataan Persetujuan</p>
            <p className="text-zinc-600">Saya menyatakan bahwa saya telah membaca, memahami hak dan kewajiban saya, serta menyetujui seluruh syarat dan ketentuan platform di atas.</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4 border-t border-zinc-100 pt-6">
        <Button 
          onClick={handleContinue}
          disabled={!agreed}
          className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          Lanjutkan Pendaftaran
        </Button>
        <Button variant="link" onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-zinc-800">
          <ArrowLeft className="mr-2 h-3 w-3" /> Kembali
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="animate-pulse flex gap-2 items-center text-zinc-400 font-medium"><AlertTriangle className="w-5 h-5"/> Memuat dokumen legal...</div>}>
        <TermsContent />
      </Suspense>
    </div>
  );
}