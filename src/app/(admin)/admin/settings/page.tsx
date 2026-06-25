// File: src/app/admin/settings/page.tsx
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
import { Loader2, Save, Building2, MapPin, QrCode, ScanLine, RefreshCw } from "lucide-react";
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
    mapsUrl: "",
    qrisUrl: "",
    qrStoreUrl: ""
  });

  // Load data koperasi saat ini
  useEffect(() => {
    async function fetchCoopData() {
      if (userData?.coopId) {
        try {
          const data = await cooperativeService.getCooperativeById(userData.coopId);
          if (data) {
            setFormData({
              name: data.name || "",
              description: data.description || "",
              address: data.address || "",
              phone: data.phone || "",
              email: data.email || "",
              logoUrl: data.logoUrl || "",
              city: data.city || "",
              mapsUrl: data.mapsUrl || "",
              qrisUrl: data.qrisUrl || "",
              qrStoreUrl: data.qrStoreUrl || "" 
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

  const handleLogoChange = (urls: string[]) => {
    if (urls.length > 0) setFormData({ ...formData, logoUrl: urls[0] });
  };

  const handleQrisChange = (urls: string[]) => {
    if (urls.length > 0) setFormData({ ...formData, qrisUrl: urls[0] });
  };

  const handleQrStoreChange = (urls: string[]) => {
    if (urls.length > 0) setFormData({ ...formData, qrStoreUrl: urls[0] });
  };

  // FUNGSI BARU: Generate QR Code Internal
  const handleGenerateInternalQR = () => {
    if (!userData?.coopId) return;
    
    // Dapatkan base URL dari window (misal: http://localhost:3000 atau https://domainanda.com)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const internalStoreUrl = `${baseUrl}/marketplace/store/${userData.coopId}`;
    
    // Gunakan API publik untuk mengenerate QR Code berdasarkan URL Toko
    const generatedQrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(internalStoreUrl)}&margin=10`;
    
    setFormData({ ...formData, qrStoreUrl: generatedQrApiUrl });
    toast.success("QR Code Toko Internal dibuat! Klik 'Simpan Profil' untuk menyimpan.");
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
        mapsUrl: formData.mapsUrl,
        qrisUrl: formData.qrisUrl,
        qrStoreUrl: formData.qrStoreUrl 
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

  if (userData?.role === 'super_admin') {
      return (
          <div className="space-y-6">
              <h1 className="text-2xl font-bold tracking-tight">Pengaturan Global</h1>
              <Card className="shadow-sm border-zinc-200">
                  <CardContent className="py-12 text-center text-zinc-500 flex flex-col items-center">
                      <Building2 className="w-12 h-12 mb-4 text-zinc-300" />
                      <p className="text-lg font-medium text-zinc-900 mb-1">Area Super Admin</p>
                      <p className="text-sm">Silakan gunakan menu "Unit Koperasi" di *sidebar* untuk mengelola data per unit secara spesifik.</p>
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="space-y-6 max-w-5xl pb-20">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Pengaturan Koperasi</h1>
        <p className="text-zinc-500">Sesuaikan profil dan metode pembayaran unit koperasi Anda.</p>
      </div>

      <form onSubmit={handleSave}>
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="border-b border-zinc-100 pb-5 mb-5">
            <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="w-5 h-5 text-blue-600" /> Identitas Unit
            </CardTitle>
            <CardDescription>
              Informasi ini akan dilihat oleh anggota dan pembeli di halaman profil koperasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="grid md:grid-cols-3 gap-6">
                {/* Logo Upload */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold">Logo Koperasi</Label>
                    <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-xl p-4 flex flex-col items-center justify-center h-[280px]">
                        <ImageUpload 
                            value={formData.logoUrl ? [formData.logoUrl] : []}
                            onChange={handleLogoChange}
                            onRemove={() => setFormData({...formData, logoUrl: ""})}
                        />
                        <p className="text-[10px] text-zinc-400 mt-3 text-center">
                            Format JPG/PNG. Rasio 1:1.
                        </p>
                    </div>
                </div>

                {/* QRIS Upload */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-blue-600" /> QRIS Koperasi
                    </Label>
                    <div className="bg-blue-50/30 border border-dashed border-blue-200 rounded-xl p-4 flex flex-col items-center justify-center h-[280px]">
                        <ImageUpload 
                            value={formData.qrisUrl ? [formData.qrisUrl] : []}
                            onChange={handleQrisChange}
                            onRemove={() => setFormData({...formData, qrisUrl: ""})}
                        />
                        <p className="text-[10px] text-blue-600/60 mt-3 text-center px-4">
                            Untuk kasir dan tagihan anggota.
                        </p>
                    </div>
                </div>

                {/* QR Store Upload & Generate */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <ScanLine className="w-4 h-4 text-red-600" /> QR Toko / Pameran
                    </Label>
                    <div className="bg-red-50/30 border border-dashed border-red-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[280px]">
                        <ImageUpload 
                            value={formData.qrStoreUrl ? [formData.qrStoreUrl] : []}
                            onChange={handleQrStoreChange}
                            onRemove={() => setFormData({...formData, qrStoreUrl: ""})}
                        />
                        
                        <div className="mt-4 flex flex-col items-center gap-2 w-full">
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={handleGenerateInternalQR}
                                className="w-full text-red-600 border-red-200 hover:bg-red-50 text-xs font-semibold"
                            >
                                <RefreshCw className="w-3 h-3 mr-1" /> Buat Otomatis (Toko Internal)
                            </Button>
                            <p className="text-[10px] text-red-600/60 text-center px-2 leading-tight">
                                Klik "Buat Otomatis" untuk menghasilkan QR Code ke toko aplikasi ini, atau upload manual jika Anda memiliki toko eksternal.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-zinc-100">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Nama Unit (Read Only)</Label>
                        <Input value={formData.name} disabled className="bg-zinc-100 text-zinc-500 font-medium" />
                        <p className="text-[10px] text-zinc-400">Hubungi Super Admin untuk ubah nama.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Kota / Wilayah (Read Only)</Label>
                        <Input value={formData.city} disabled className="bg-zinc-100 text-zinc-500 font-medium" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Tentang Koperasi (Deskripsi)</Label>
                    <Textarea 
                        id="description"
                        name="description"
                        placeholder="Tuliskan sejarah singkat, visi misi, atau layanan unggulan koperasi Anda..."
                        className="min-h-[120px] resize-none"
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
                        className="resize-none"
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
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-100 flex justify-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto font-bold h-11 px-8" disabled={loading}>
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