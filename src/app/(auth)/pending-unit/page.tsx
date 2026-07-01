// File: src/app/(auth)/pending-unit/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Building2, Clock, PhoneCall } from "lucide-react";

export default function PendingUnitPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-blue-600">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-900">Pengajuan Berhasil!</CardTitle>
          <p className="text-zinc-500 mt-2">
            Data unit / organisasi Anda telah masuk ke dalam sistem dengan status <strong>Menunggu Tinjauan</strong>.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 leading-relaxed text-center">
            Terima kasih telah mendaftarkan komunitas atau organisasi Anda. Tim pengelola pusat akan segera memproses pengajuan ini.
          </div>
          
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">Tinjauan Admin Pusat</h4>
                <p className="text-sm text-zinc-500 mt-1">Data Anda sedang diverifikasi untuk memastikan kesesuaian dengan kebijakan platform. Proses ini biasanya memakan waktu 1-2 hari kerja.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0">
                <PhoneCall className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">Verifikasi Lanjutan</h4>
                <p className="text-sm text-zinc-500 mt-1">
                  Kami mungkin akan menghubungi nomor WhatsApp / Email yang Anda daftarkan jika diperlukan informasi tambahan.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3">
          <Link href="/" className="w-full">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
              Kembali ke Beranda
            </Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full text-zinc-500 hover:text-zinc-900">
              Masuk ke Akun Anda
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}