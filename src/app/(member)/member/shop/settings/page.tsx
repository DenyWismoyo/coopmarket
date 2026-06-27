"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Store, Save, Instagram, Facebook, Globe, MessageCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function MemberShopSettingsPage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    shopDescription: "",
    instagramUrl: "",
    tiktokUrl: "",
    facebookUrl: "",
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.fullName || "",
        shopDescription: userData.shopDescription || "",
        instagramUrl: userData.instagramUrl || "",
        tiktokUrl: userData.tiktokUrl || "",
        facebookUrl: userData.facebookUrl || "",
      });
    }
  }, [userData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      
      // Memperbarui data profil secara langsung ke Firestore agar fleksibel
      await updateDoc(userRef, {
        fullName: formData.fullName,
        shopDescription: formData.shopDescription,
        instagramUrl: formData.instagramUrl,
        tiktokUrl: formData.tiktokUrl,
        facebookUrl: formData.facebookUrl,
        updatedAt: new Date().toISOString()
      });

      toast.success("Informasi etalase toko berhasil diperbarui!");
    } catch (error) {
      console.error("Gagal memperbarui profil toko:", error);
      toast.error("Gagal memperbarui profil toko");
    } finally {
      setLoading(false);
    }
  };

  if (!userData) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-400" /></div>;

  return (
    <div className="space-y-6 max-w-3xl pb-20">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Pengaturan Toko</h1>
        <p className="text-zinc-500 text-sm">Kustomisasi identitas etalase dan tautan media sosial toko Anda.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Informasi Utama */}
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="bg-zinc-50/50 border-b">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-800">
              <Store className="w-5 h-5 text-blue-600" /> Profil Etalase
            </CardTitle>
            <CardDescription>Nama identitas utama toko publik menggunakan nama lengkap Anda.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Toko (Nama Lengkap)</Label>
              <Input 
                id="fullName"
                placeholder="Masukkan nama identitas toko Anda"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Tentang Toko</Label>
              <Textarea 
                id="description"
                placeholder="Tuliskan deskripsi mengenai produk atau toko Anda..."
                className="h-32 resize-none focus-visible:ring-blue-500"
                value={formData.shopDescription}
                onChange={(e) => setFormData({...formData, shopDescription: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Saluran Media Sosial */}
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="bg-zinc-50/50 border-b">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-800">
              <Globe className="w-5 h-5 text-purple-600" /> Tautan Media Sosial
            </CardTitle>
            <CardDescription>Hubungkan akun media sosial untuk meningkatkan kepercayaan pembeli.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Instagram */}
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-1.5"><Instagram className="w-4 h-4 text-pink-600" /> Instagram</Label>
              <div className="relative">
                <Input 
                  id="instagram"
                  placeholder="https://instagram.com/username"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({...formData, instagramUrl: e.target.value})}
                  className="focus-visible:ring-blue-500"
                />
              </div>
            </div>

            {/* TikTok */}
            <div className="space-y-2">
               <Label htmlFor="tiktok" className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-zinc-900" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.52-4.06-1.39-.77-.57-1.39-1.34-1.87-2.22-.02 1.63-.01 3.25-.02 4.88-.04 2.1-.47 4.21-1.48 6.04-1.2 2.14-3.4 3.73-5.83 4.17-2.6.47-5.4-.14-7.46-1.85-2.2-1.81-3.41-4.71-3.08-7.53.3-2.68 1.95-5.16 4.39-6.32 1.79-.86 3.84-1.12 5.81-.7v4.11c-1.14-.31-2.4-.19-3.41.42-1.21.72-1.95 2.07-1.95 3.5 0 1.25.6 2.45 1.59 3.17.96.71 2.22.95 3.4.67 1.25-.3 2.31-1.31 2.65-2.54.12-.46.16-.94.15-1.42-.01-4.08 0-8.17-.01-12.25z"/>
                  </svg>
                  TikTok
               </Label>
              <Input 
                id="tiktok"
                placeholder="https://tiktok.com/@username"
                value={formData.tiktokUrl}
                onChange={(e) => setFormData({...formData, tiktokUrl: e.target.value})}
                className="focus-visible:ring-blue-500"
              />
            </div>

            {/* Facebook */}
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-1.5"><Facebook className="w-4 h-4 text-blue-600" /> Facebook</Label>
              <Input 
                id="facebook"
                placeholder="https://facebook.com/username"
                value={formData.facebookUrl}
                onChange={(e) => setFormData({...formData, facebookUrl: e.target.value})}
                className="focus-visible:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto px-6 rounded-xl shadow-md" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}