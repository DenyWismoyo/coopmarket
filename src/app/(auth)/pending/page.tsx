// File: src/app/(auth)/pending/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, MapPin, Banknote } from "lucide-react";

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-yellow-500">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-900">Pendaftaran Berhasil!</CardTitle>
          <p className="text-zinc-500 mt-2">
            Akun Anda saat ini berstatus <strong>Draft / Pending</strong>.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
            Untuk mengaktifkan status keanggotaan Anda, silakan selesaikan langkah berikut:
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-zinc-600" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">Hubungi / Kunjungi Unit Terkait</h4>
                <p className="text-sm text-zinc-500">Silakan hubungi pengurus atau datang ke sekretariat unit / organisasi yang Anda pilih untuk verifikasi identitas (KTP).</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                <Banknote className="w-4 h-4 text-zinc-600" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900">Selesaikan Administrasi</h4>
                <p className="text-sm text-zinc-500">
                  Lakukan pembayaran administrasi atau iuran pendaftaran awal sesuai dengan kebijakan unit / organisasi Anda.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              Kembali ke Halaman Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}