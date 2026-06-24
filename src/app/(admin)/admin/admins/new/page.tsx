"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cooperativeService } from "@/services/cooperative.service";
import { authService } from "@/services/auth.service";
import { Cooperative } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, UserCog } from "lucide-react";
import Link from "next/link";

export default function CreateAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [coops, setCoops] = useState<Cooperative[]>([]);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    coopId: "",
  });

  // Fetch Koperasi untuk Dropdown
  useEffect(() => {
    async function fetchCoops() {
      try {
        const data = await cooperativeService.getAllCooperatives();
        setCoops(data);
      } catch (error) {
        toast.error("Gagal memuat data koperasi");
      }
    }
    fetchCoops();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
        toast.error("Password minimal 6 karakter");
        return;
    }
    if (!formData.coopId) {
        toast.error("Pilih unit koperasi terlebih dahulu");
        return;
    }

    setLoading(true);
    try {
      // Cari nama koperasi
      const selectedCoop = coops.find(c => c.id === formData.coopId);

      await authService.createUnitAdmin({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: 'unit_admin',
        status: 'active',
        coopId: formData.coopId,
        coopName: selectedCoop?.name || "Unknown Coop",
        phone: formData.phone,
        address: selectedCoop?.address || "", // Default alamat admin sama dengan kantor
        nik: "" // Admin tidak wajib NIK di awal
      });

      toast.success("Admin Unit berhasil dibuat!");
      router.push("/admin/admins");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Email sudah terdaftar.");
      } else {
        toast.error("Gagal membuat admin: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/admins">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Tambah Admin Unit
          </h1>
          <p className="text-zinc-500">
            Daftarkan pengelola baru untuk unit koperasi.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Akun Admin</CardTitle>
            <CardDescription>Kredensial ini akan digunakan admin unit untuk login.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label>Pilih Unit Koperasi <span className="text-red-500">*</span></Label>
              <Select 
                onValueChange={(val) => setFormData({...formData, coopId: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Unit --" />
                </SelectTrigger>
                <SelectContent>
                  {coops.map((coop) => (
                    <SelectItem key={coop.id} value={coop.id}>
                        {coop.name} ({coop.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Nama Lengkap Admin <span className="text-red-500">*</span></Label>
                    <Input 
                        required
                        placeholder="Contoh: Budi (Admin Solo)"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Nomor WhatsApp</Label>
                    <Input 
                        placeholder="08..."
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">
                <div className="space-y-2">
                    <Label>Email Login <span className="text-red-500">*</span></Label>
                    <Input 
                        type="email"
                        required
                        placeholder="admin.solo@kmp.id"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Password Awal <span className="text-red-500">*</span></Label>
                    <Input 
                        type="password"
                        required
                        placeholder="Minimal 6 karakter"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-6" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserCog className="w-4 h-4 mr-2" />}
              Buat Akun Admin
            </Button>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}