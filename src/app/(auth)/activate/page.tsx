// File: src/app/(auth)/activate/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ActivatePage() {
  const [step, setStep] = useState(1);
  const [nik, setNik] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckNIK = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulasi Cek NIK ke Server
    setTimeout(() => {
      setLoading(false);
      setStep(2); // Anggap NIK ditemukan
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <Link 
          href="/login" 
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Login
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktivasi Akun Anggota</CardTitle>
          <CardDescription>
            Khusus anggota Unit / Organisasi yang sudah terdaftar secara offline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleCheckNIK} className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm text-yellow-800 mb-4">
                Pastikan data diri Anda sudah didaftarkan oleh Admin Unit / Organisasi sebelum melakukan aktivasi.
              </div>
              <div className="space-y-2">
                <Label htmlFor="nik">Masukkan NIK</Label>
                <Input 
                  id="nik" 
                  placeholder="Nomor Induk Kependudukan (16 digit)" 
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g,''))}
                  maxLength={16}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || nik.length < 16}>
                {loading ? "Memeriksa Data..." : "Cari Data Anggota"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">Data Ditemukan!</h3>
                <p className="text-zinc-500 text-sm">
                  Halo, <span className="font-bold text-zinc-900">Budi Santoso</span>. Silakan buat password untuk akun digital Anda.
                </p>
              </div>

              <form className="space-y-4">
                 <div className="space-y-2">
                  <Label>Email (Opsional)</Label>
                  <Input placeholder="email@anda.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Buat Password Baru</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Aktifkan Akun Saya
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}