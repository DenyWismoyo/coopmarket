"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/modules/auth/login-form";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Tombol Kembali */}
      <div className="text-center">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-zinc-500 hover:text-red-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Beranda
        </Link>
      </div>

      {/* Container Login */}
      <div className="bg-white rounded-xl shadow-xl shadow-zinc-200/50 border border-white ring-1 ring-zinc-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Selamat Datang</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Masuk untuk mengakses layanan koperasi digital.
            </p>
          </div>
          
          {/* [FIX] Suspense Boundary ditambahkan di sini */}
          <Suspense fallback={
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
        
        {/* Footer Card */}
        <div className="bg-zinc-50 px-6 py-4 text-center border-t border-zinc-100">
          <p className="text-xs text-zinc-500">
            Belum menjadi anggota?{" "}
            <Link href="/register" className="font-bold text-red-600 hover:underline">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}