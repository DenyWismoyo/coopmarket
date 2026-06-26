// File: src/app/(auth)/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { cooperativeService } from "@/services/cooperative.service";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

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
import { Loader2, ArrowLeft, ShieldCheck, Building2, UserPlus } from "lucide-react";
import { Cooperative } from "@/types/cooperative";

export default function RegisterPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  
  // Tentukan apakah ini mode "Upgrade" (Customer yang sedang login ingin jadi Member)
  const isUpgradeMode = userData?.role === 'customer';

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
    coopId: "",
  });

  // Fetch daftar Unit / Organisasi
  useEffect(() => {
    const fetchCoops = async () => {
      try {
        const coops = await cooperativeService.getAllCooperatives();
        setCooperatives(coops);
      } catch (error) {
        console.error("Gagal memuat daftar Unit / Organisasi:", error);
        toast.error("Gagal memuat daftar unit Unit / Organisasi");
      } finally {
        setLoadingCoops(false);
      }
    };
    fetchCoops();
  }, []);

  // Pre-fill data jika dalam mode Upgrade
  useEffect(() => {
    if (isUpgradeMode && userData) {
      setFormData(prev => ({
        ...prev,
        fullName: userData.fullName || "",
        phone: userData.phone || "",
        address: userData.address || "",
        email: userData.email || "", // Email tidak bisa diedit saat upgrade
      }));
    }
  }, [isUpgradeMode, userData]);

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
      // Validasi Universal
      if (formData.nik.length < 16) throw new Error("NIK harus 16 digit");
      if (!formData.coopId) throw new Error("Silakan pilih Unit / Organisasi  tujuan");

      const selectedCoop = cooperatives.find(c => c.id === formData.coopId);

      if (isUpgradeMode && user) {
        // === LOGIKA UPGRADE CUSTOMER KE MEMBER ===
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          role: "member",
          status: "pending",
          nik: formData.nik,
          coopId: formData.coopId,
          coopName: selectedCoop?.name || "Unknown Coop",
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          updatedAt: new Date().toISOString()
        });
        
        toast.success("Pengajuan anggota berhasil dikirim!");
        router.push("/pending");

      } else {
        // === LOGIKA PENDAFTARAN BARU DARI AWAL ===
        await authService.register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: "member",
          phone: formData.phone,
          address: formData.address,
          nik: formData.nik,
          status: "pending",
          coopId: formData.coopId,
          coopName: selectedCoop?.name || "Unknown Coop",
        });
        
        toast.success("Pendaftaran berhasil!");
        router.push("/pending");
      }
            
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal memproses pendaftaran");
    } finally {
      setLoading(false);
    }
  };

  // Jangan render apa-apa jika Auth masih loading untuk mencegah kedipan UI
  if (authLoading) return <div className="min-h-screen bg-zinc-50 flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-zinc-400" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg shadow-xl border-red-100">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isUpgradeMode ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
              {isUpgradeMode ? <UserPlus className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
          </div>
          <CardTitle className={`text-2xl font-bold ${isUpgradeMode ? 'text-blue-700' : 'text-red-700'}`}>
            {isUpgradeMode ? "Upgrade ke Anggota" : "Formulir Anggota Baru"}
          </CardTitle>
          <CardDescription>
            {isUpgradeMode 
              ? "Lengkapi NIK dan pilih Unit / Organisasi untuk mengajukan keanggotaan Anda." 
              : "Bergabunglah dengan Unit / Organisasi pilihan Anda."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
                         
            {/* Pilihan Unit Unit / Organisasi - PENTING */}
            <div className="space-y-2">
              <Label htmlFor="coopId">Pilih Unit / Organisasi <span className="text-red-500">*</span></Label>
              <Select onValueChange={handleCoopChange} disabled={loadingCoops}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingCoops ? "Memuat data..." : "Pilih Unit / Organisasi Terdekat"} />
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
                Pilih unit Unit / Organisasi tempat Anda akan melakukan aktivasi dan pembayaran simpanan pokok.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap (Sesuai KTP) <span className="text-red-500">*</span></Label>
              <Input
                id="fullName"
                name="fullName"
                required
                placeholder="Contoh: Budi Santoso"
                value={formData.fullName}
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
                    value={formData.nik}
                    onChange={(e) => setFormData({...formData, nik: e.target.value.replace(/\D/g, '')})}
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
                    value={formData.phone}
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
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            {/* Sembunyikan field Email dan Password jika dalam mode Upgrade */}
            {!isUpgradeMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={formData.email}
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
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <Button 
                 type="submit" 
                 className={`w-full font-bold ${isUpgradeMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                 disabled={loading || loadingCoops}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                </>
              ) : (
                isUpgradeMode ? "Ajukan Keanggotaan" : "Buat Akun Anggota"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center">
          {!isUpgradeMode && (
            <p className="text-sm text-zinc-500">
              Sudah menjadi anggota?{" "}
              <Link href="/login" className="text-red-600 hover:underline font-medium">
                Masuk di sini
              </Link>
            </p>
          )}
          <Button variant="link" onClick={() => router.back()} className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-800">
            <ArrowLeft className="mr-2 h-3 w-3" /> Kembali
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}