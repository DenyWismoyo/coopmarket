// File: src/app/(auth)/register-unit/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cooperativeService } from "@/services/cooperative.service";
import { userService } from "@/services/user.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Building2 } from "lucide-react";

export default function RegisterUnitPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Mengirimkan pendaftaran unit ke database dengan status 'suspended' (Menunggu approval)
      await cooperativeService.createCooperative({
        ...formData,
        status: "suspended",
      });
      
      // 2. Ubah status user saat ini menjadi pending agar navbar dan profil bisa menyesuaikan tampilannya
      if (user) {
        await userService.updateUserProfile(user.uid, { status: "pending" });
      }
      
      toast.success("Pendaftaran Unit / Organisasi berhasil dikirim!");
      
      // Mengarahkan customer ke halaman sukses/tunggu
      router.push("/pending-unit");
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mengirim pendaftaran unit");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-zinc-50 flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-zinc-400" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg shadow-xl border-blue-100">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-700">
            Daftarkan Unit / Organisasi
          </CardTitle>
          <CardDescription>
            Lengkapi profil unit organisasi komunitas Anda untuk didaftarkan ke dalam sistem. Data akan ditinjau oleh pengelola pusat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="name">Nama Unit / Organisasi <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Contoh: Komunitas Kreatif Solo"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Kota / Kabupaten <span className="text-red-500">*</span></Label>
                  <Input
                      id="city"
                      name="city"
                      required
                      placeholder="Surakarta"
                      value={formData.city}
                      onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">No. WhatsApp Admin <span className="text-red-500">*</span></Label>
                  <Input
                      id="phone"
                      name="phone"
                      required
                      type="tel"
                      placeholder="0812..."
                      value={formData.phone}
                      onChange={handleChange}
                  />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Organisasi <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="admin@organisasi.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat Kantor / Sekretariat <span className="text-red-500">*</span></Label>
              <Textarea
                id="address"
                name="address"
                required
                placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Singkat</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Ceritakan fokus dan visi misi organisasi Anda"
                value={formData.description}
                onChange={handleChange}
                className="h-24"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white mt-4" 
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim Pengajuan...</>
              ) : (
                "Kirim Pengajuan Pendaftaran"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => router.back()} className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-800">
            <ArrowLeft className="mr-2 h-3 w-3" /> Kembali
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}