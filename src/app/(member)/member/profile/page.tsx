"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service"; // Import Auth Service
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { Loader2, User, Phone, MapPin, Mail, Building2, CreditCard, Lock } from "lucide-react";

export default function MemberProfilePage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State Profil
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    photoURL: ""
  });

  // Form State Password
  const [passData, setPassData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.fullName || "",
        phone: userData.phone || "",
        address: userData.address || "",
        photoURL: userData.photoURL || ""
      });
    }
  }, [userData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await userService.updateUserProfile(user.uid, formData);
      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Gagal memperbarui profil");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (urls: string[]) => {
    if (urls.length > 0) {
      setFormData({ ...formData, photoURL: urls[0] });
    }
  };

  // Handler Ganti Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    if (passData.newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setPassLoading(true);
    try {
      await authService.updateUserPassword(passData.newPassword);
      toast.success("Password berhasil diubah!");
      setPassData({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Demi keamanan, silakan login ulang sebelum mengganti password.");
      } else {
        toast.error("Gagal mengganti password: " + error.message);
      }
    } finally {
      setPassLoading(false);
    }
  };

  if (!userData) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Profil Saya</h1>
        <p className="text-zinc-500">Kelola informasi pribadi dan keamanan akun.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Kartu Identitas */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 relative">
              <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                <AvatarImage src={formData.photoURL || userData.photoURL} className="object-cover" />
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                  {userData.fullName?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{userData.fullName}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1 mt-1">
              <Building2 className="w-3 h-3" /> {userData.coopName || "Anggota Koperasi"}
            </CardDescription>
            <div className="mt-4 flex justify-center">
               <Badge variant={userData.role === 'member' ? 'default' : 'secondary'} className="capitalize">
                 {userData.role}
               </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-zinc-600">
                <Mail className="w-4 h-4 text-zinc-400" />
                <span className="truncate" title={userData.email}>{userData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-600">
                <CreditCard className="w-4 h-4 text-zinc-400" />
                <span className="font-mono">{userData.nik || "NIK belum diset"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kolom Kanan: Tabs / Forms */}
        <div className="md:col-span-2 space-y-6">
            {/* 1. Form Edit Profil */}
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                <CardTitle>Informasi Pribadi</CardTitle>
                <CardDescription>Perbarui data diri Anda.</CardDescription>
                </div>
                {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Edit Profil
                </Button>
                )}
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSave} className="space-y-4">
                
                {isEditing && (
                    <div className="space-y-2 mb-4 p-4 bg-zinc-50 rounded-lg border border-dashed">
                    <Label>Ganti Foto Profil</Label>
                    <div className="max-w-[200px]">
                        <ImageUpload 
                        value={formData.photoURL ? [formData.photoURL] : []}
                        onChange={handleImageChange}
                        onRemove={() => setFormData({...formData, photoURL: ""})}
                        />
                    </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input 
                        value={formData.fullName} 
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        disabled={!isEditing || loading}
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Email (Read Only)</Label>
                        <Input className="bg-zinc-50" value={userData.email} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>Nomor WhatsApp</Label>
                        <Input 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            disabled={!isEditing || loading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Alamat Lengkap</Label>
                    <Textarea 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        disabled={!isEditing || loading}
                    />
                </div>

                {isEditing && (
                    <div className="flex justify-end gap-3 pt-4">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setIsEditing(false)}
                        disabled={loading}
                    >
                        Batal
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Perubahan
                    </Button>
                    </div>
                )}
                </form>
            </CardContent>
            </Card>

            {/* 2. Form Ganti Password */}
            <Card className="border-red-100">
                <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                        <Lock className="w-5 h-5" /> Keamanan Akun
                    </CardTitle>
                    <CardDescription>Ganti password untuk mengamankan akun Anda.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Password Baru</Label>
                                <Input 
                                    type="password" 
                                    placeholder="Minimal 6 karakter"
                                    value={passData.newPassword}
                                    onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Konfirmasi Password</Label>
                                <Input 
                                    type="password" 
                                    placeholder="Ulangi password baru"
                                    value={passData.confirmPassword}
                                    onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" variant="secondary" disabled={passLoading || !passData.newPassword}>
                                {passLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}