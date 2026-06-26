// File: src/app/(auth)/complete-profile/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { cooperativeService } from "@/services/cooperative.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Building2, User, ArrowRight, ArrowLeft } from "lucide-react";
import { Cooperative } from "@/types/cooperative";

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State untuk alur pendaftaran 2 tahap
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<'member' | 'customer'>('customer');

  const [loading, setLoading] = useState(false);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loadingCoops, setLoadingCoops] = useState(true);

  const [formData, setFormData] = useState({
    uid: searchParams.get("uid") || "",
    email: searchParams.get("email") || "",
    fullName: searchParams.get("name") || "",
    nik: "",
    phone: "",
    address: "",
    coopId: ""
  });

  useEffect(() => {
    // Redireksi ke beranda jika UID kosong (tidak diakses melalui login Google)
    if (!formData.uid) {
      router.push("/login");
      return;
    }

    const fetchCoops = async () => {
      try {
        const coops = await cooperativeService.getAllCooperatives();
        setCooperatives(coops);
      } catch (error) {
        console.error("Gagal memuat daftar Unit / Organisasi:", error);
        toast.error("Gagal memuat daftar Unit / Organisasi");
      } finally {
        setLoadingCoops(false);
      }
    };
    
    fetchCoops();
  }, [formData.uid, router]);

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
      // Validasi khusus untuk anggota Unit / Organisasi
      if (selectedRole === 'member') {
        if (formData.nik.length < 16) throw new Error("NIK harus 16 digit");
        if (!formData.coopId) throw new Error("Silakan pilih Unit / Organisasi tujuan");
      }

      const selectedCoop = cooperatives.find(c => c.id === formData.coopId);

      await authService.completeUserProfile({
        uid: formData.uid,
        email: formData.email,
        fullName: formData.fullName,
        role: selectedRole,
        phone: formData.phone,
        address: formData.address,
        nik: selectedRole === 'member' ? formData.nik : "",
        status: selectedRole === 'member' ? "pending" : "active",
        coopId: selectedRole === 'member' ? formData.coopId : "",
        coopName: selectedRole === 'member' ? (selectedCoop?.name || "") : "",
      });

      toast.success("Profil berhasil disimpan!");
      
      // Arahkan ke halaman yang sesuai dengan role
      if (selectedRole === 'member') {
        router.push("/pending");
      } else {
        router.push("/");
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  // TAMPILAN TAHAP 1: PEMILIHAN PERAN (ROLE)
  if (step === 1) {
    return (
      <Card className="w-full max-w-lg shadow-xl border-blue-100 mt-8 mx-auto">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-blue-700">Pilih Jenis Akun</CardTitle>
          <CardDescription>
            Halo <b>{formData.fullName}</b>, bagaimana Anda ingin menggunakan layanan ini?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button 
            onClick={() => { setSelectedRole('customer'); setStep(2); }}
            className="w-full flex items-center justify-between p-4 border rounded-xl hover:bg-zinc-50 hover:border-blue-300 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-100 rounded-full text-zinc-600">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">Pengguna Biasa (Public)</h3>
                <p className="text-sm text-zinc-500">Berbelanja di marketplace tanpa mendaftar keanggotaan Unit / Organisasi.</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-400" />
          </button>

          <button 
            onClick={() => { setSelectedRole('member'); setStep(2); }}
            className="w-full flex items-center justify-between p-4 border rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">Anggota Unit / Organisasi</h3>
                <p className="text-sm text-zinc-500">Mendaftar keanggotaan untuk akses fitur penuh seperti pinjaman dan SHU.</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-400" />
          </button>
        </CardContent>
      </Card>
    );
  }

  // TAMPILAN TAHAP 2: PENGISIAN FORMULIR
  return (
    <Card className="w-full max-w-lg shadow-xl border-blue-100 mt-8 mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center mb-2">
          <button 
            onClick={() => setStep(1)} 
            className="text-zinc-500 hover:text-zinc-900 flex items-center text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Ganti Tipe Akun
          </button>
        </div>
        <CardTitle className="text-2xl font-bold text-blue-700">Lengkapi Data Diri</CardTitle>
        <CardDescription>
          Sebagai <b>{selectedRole === 'member' ? "Anggota Unit / Organisasi" : "Pengguna Biasa"}</b>, silakan lengkapi sisa informasi Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap Sesuai KTP <span className="text-red-500">*</span></Label>
            <Input
              id="fullName"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input NIK hanya muncul untuk Anggota Unit / Organisasi */}
            {selectedRole === 'member' && (
              <div className="space-y-2">
                <Label htmlFor="nik">NIK (16 Digit) <span className="text-red-500">*</span></Label>
                <Input
                  id="nik"
                  name="nik"
                  required={selectedRole === 'member'}
                  placeholder="3372..."
                  maxLength={16}
                  value={formData.nik}
                  onChange={(e) => setFormData({...formData, nik: e.target.value.replace(/\D/g, '')})}
                />
              </div>
            )}
            
            <div className={`space-y-2 ${selectedRole === 'customer' ? 'md:col-span-2' : ''}`}>
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
            <Label htmlFor="address">Alamat Pengiriman / Domisili <span className="text-red-500">*</span></Label>
            <Textarea
              id="address"
              name="address"
              required
              placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {/* Pemilihan Unit / Organisasi hanya muncul untuk Anggota Unit / Organisasi */}
          {selectedRole === 'member' && (
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
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold mt-4"
            disabled={loading || (selectedRole === 'member' && loadingCoops)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              "Kirim Data"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CompleteProfilePage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-zinc-400 w-8 h-8" /></div>}>
        <CompleteProfileForm />
      </Suspense>
    </div>
  );
}