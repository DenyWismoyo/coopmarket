"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { cooperativeService } from "@/services/cooperative.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { Loader2, Save, Building2, MapPin } from "lucide-react";
import { Cooperative } from "@/types/cooperative";

export default function AdminSettingsPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [formData, setFormData] = useState<Partial<Cooperative>>({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    logoUrl: "",
    city: "",
    mapsUrl: "" // Field baru
  });

  // Load data koperasi saat ini
  useEffect(() => {
    async function fetchCoopData() {
      if (userData?.coopId) {
        try {
          const data = await cooperativeService.getCooperativeById(userData.coopId);
          if (data) {
            setFormData({
              name: data.name,
              description: data.description || "",
              address: data.address,
              phone: data.phone,
              email: data.email,
              logoUrl: data.logoUrl || "",
              city: data.city,
              mapsUrl: data.mapsUrl || ""
            });
          }
        } catch (error) {
          console.error(error);
          toast.error("Gagal memuat profil koperasi");
        } finally {
          setInitialLoading(false);
        }
      }
    }
    fetchCoopData();
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (urls: string[]) => {
    if (urls.length > 0) {
      setFormData({ ...formData, logoUrl: urls[0] });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.coopId) return;

    setLoading(true);
    try {
      await cooperativeService.updateCooperative(userData.coopId, {
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        logoUrl: formData.logoUrl,
        mapsUrl: formData.mapsUrl
      });
      toast.success("Profil koperasi berhasil diperbarui!");
    } catch (error) {
      toast.error("Gagal menyimpan perubahan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;
  }

  // Jika bukan admin unit (misal Super Admin masuk menu ini), tampilkan info umum
  if (userData?.role === 'super_admin') {
      return (
          <div className="space-y-6">
              <h1 className="text-2xl font-bold">Pengaturan Global</h1>
              <Card>
                  <CardContent className="py-8 text-center text-zinc-500">
                      <p>Pengaturan global aplikasi akan ada di sini.</p>
                      <p className="text-sm">Silakan gunakan menu "Unit Koperasi" untuk mengelola data per unit.</p>
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pengaturan Koperasi</h1>
        <p className="text-zinc-500">Sesuaikan profil unit koperasi Anda untuk ditampilkan di aplikasi.</p>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" /> Identitas Unit
            </CardTitle>
            <CardDescription>
              Informasi ini akan dilihat oleh anggota dan pembeli di halaman profil koperasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Logo Upload */}
            <div className="space-y-2">
                <Label>Logo Koperasi</Label>
                <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-lg p-4 max-w-sm">
                    <ImageUpload 
                        value={formData.logoUrl ? [formData.logoUrl] : []}
                        onChange={handleImageChange}
                        onRemove={() => setFormData({...formData, logoUrl: ""})}
                    />
                    <p className="text-[10px] text-zinc-400 mt-2">
                        Format: JPG, PNG. Disarankan rasio 1:1 (persegi).
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Nama Unit (Read Only)</Label>
                    <Input value={formData.name} disabled className="bg-zinc-100 text-zinc-500" />
                    <p className="text-[10px] text-zinc-400">Hubungi Super Admin untuk ubah nama.</p>
                </div>
                <div className="space-y-2">
                    <Label>Kota / Wilayah (Read Only)</Label>
                    <Input value={formData.city} disabled className="bg-zinc-100 text-zinc-500" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Tentang Koperasi (Deskripsi)</Label>
                <Textarea 
                    id="description"
                    name="description"
                    placeholder="Tuliskan sejarah singkat, visi misi, atau layanan unggulan koperasi Anda..."
                    className="min-h-[150px]"
                    value={formData.description}
                    onChange={handleChange}
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon / WhatsApp Admin</Label>
                    <Input 
                        id="phone"
                        name="phone"
                        placeholder="08..."
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Resmi</Label>
                    <Input 
                        id="email"
                        name="email"
                        type="email"
                        placeholder="admin@koperasi..."
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap Kantor</Label>
                <Textarea 
                    id="address"
                    name="address"
                    placeholder="Jalan, No, RT/RW, Kelurahan, Kecamatan..."
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="mapsUrl" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" /> Link Google Maps
                </Label>
                <Input 
                    id="mapsUrl"
                    name="mapsUrl"
                    placeholder="https://maps.app.goo.gl/..."
                    value={formData.mapsUrl}
                    onChange={handleChange}
                />
                <p className="text-[10px] text-zinc-400">
                    Paste link "Share" dari Google Maps di sini agar pelanggan mudah menemukan lokasi.
                </p>
            </div>

            <div className="pt-4 flex justify-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Simpan Profil
                </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}