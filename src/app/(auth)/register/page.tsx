"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { cooperativeService } from "@/services/cooperative.service"; // Pastikan service ini ada
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldCheck, Building2 } from "lucide-react";
import { Cooperative } from "@/types/cooperative"; // Import tipe Cooperative

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loadingCoops, setLoadingCoops] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    nik: "",
    phone: "",
    address: "",
    coopId: "", // Field untuk menyimpan ID koperasi pilihan
    role: "member" as const,
  });

  // Fetch daftar koperasi saat komponen dimuat
  useEffect(() => {
    const fetchCoops = async () => {
      try {
        const coops = await cooperativeService.getAllCooperatives();
        setCooperatives(coops);
      } catch (error) {
        console.error("Gagal memuat daftar koperasi:", error);
        toast.error("Gagal memuat daftar unit koperasi");
      } finally {
        setLoadingCoops(false);
      }
    };
    fetchCoops();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCoopChange = (value: string) => {
    setFormData({ ...formData, coopId: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validasi
      if (formData.nik.length < 16) throw new Error("NIK harus 16 digit");
      if (!formData.coopId) throw new Error("Silakan pilih Unit Koperasi tujuan");

      // Cari nama koperasi untuk disimpan (opsional, tapi berguna)
      const selectedCoop = cooperatives.find(c => c.id === formData.coopId);

      await authService.register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: "member",
        phone: formData.phone,
        address: formData.address,
        nik: formData.nik,
        status: "pending",
        coopId: formData.coopId, // ID Koperasi yang dipilih user
        coopName: selectedCoop?.name || "Unknown Coop", // Nama koperasi
      });

      router.push("/pending"); 
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg shadow-xl border-red-100">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-700">Formulir Anggota Baru</CardTitle>
          <CardDescription>
            Bergabunglah dengan Unit Koperasi pilihan Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Pilihan Unit Koperasi - PENTING */}
            <div className="space-y-2">
              <Label htmlFor="coopId">Pilih Unit Koperasi <span className="text-red-500">*</span></Label>
              <Select onValueChange={handleCoopChange} disabled={loadingCoops}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingCoops ? "Memuat data..." : "Pilih Koperasi Terdekat"} />
                </SelectTrigger>
                <SelectContent>
                  {cooperatives.map((coop) => (
                    <SelectItem key={coop.id} value={coop.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-zinc-500" />
                        <span>{coop.name}</span>
                        {coop.city && <span className="text-xs text-zinc-400">({coop.city})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-zinc-500">
                Pilih unit koperasi tempat Anda akan melakukan aktivasi dan pembayaran simpanan pokok.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap (Sesuai KTP) <span className="text-red-500">*</span></Label>
              <Input
                id="fullName"
                name="fullName"
                required
                placeholder="Contoh: Budi Santoso"
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="nik">NIK (16 Digit) <span className="text-red-500">*</span></Label>
                <Input
                    id="nik"
                    name="nik"
                    required
                    placeholder="3372..."
                    maxLength={16}
                    onChange={handleChange}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="phone">No. WhatsApp <span className="text-red-500">*</span></Label>
                <Input
                    id="phone"
                    name="phone"
                    required
                    type="tel"
                    placeholder="0812..."
                    onChange={handleChange}
                />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat Domisili <span className="text-red-500">*</span></Label>
              <Textarea
                id="address"
                name="address"
                required
                placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="nama@email.com"
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Minimal 6 karakter"
                onChange={handleChange}
              />
            </div>

            <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold" 
                disabled={loading || loadingCoops}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mendaftarkan...
                </>
              ) : (
                "Buat Draft Anggota"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center">
          <p className="text-sm text-zinc-500">
            Sudah menjadi anggota?{" "}
            <Link href="/login" className="text-red-600 hover:underline font-medium">
              Masuk di sini
            </Link>
          </p>
          <Link href="/" className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-600">
            <ArrowLeft className="mr-2 h-3 w-3" /> Kembali ke Beranda
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}