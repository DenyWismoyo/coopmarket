// File: src/app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { userService } from "@/services/user.service";
import { MainNavbar } from "@/components/layout/main-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, User, Mail, Phone, MapPin, ShieldCheck, Building2, PlusCircle, Clock } from "lucide-react";

export default function ProfilePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (userData) {
      setFormData({
        fullName: userData.fullName || "",
        phone: userData.phone || "",
        address: userData.address || "",
      });
    }
  }, [user, userData, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await userService.updateUserProfile(user.uid, formData);
      toast.success("Profil berhasil diperbarui!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal memperbarui profil");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!user || !userData) return null;

  const isPendingMember = userData?.role === 'member' && userData?.status === 'pending';
  const isPendingUnit = userData?.role === 'customer' && userData?.status === 'pending';
  const isRegularCustomer = userData?.role === 'customer' && userData?.status !== 'pending';

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-20">
      <MainNavbar />
      
      <div className="bg-gradient-to-r from-red-700 to-red-900 pt-12 pb-24 border-b border-red-800">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Profil Saya</h1>
          <p className="text-red-100 text-sm">Kelola informasi pribadi dan alamat pengiriman Anda.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden">
          
          <div className="p-6 sm:p-8 bg-zinc-50/50 border-b border-zinc-100 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 border-4 border-white shadow-sm flex-shrink-0 overflow-hidden">
              {userData.photoURL ? (
                <img src={userData.photoURL} alt={userData.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-2 mt-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-2xl font-bold text-zinc-900">{userData.fullName}</h2>
                <Badge variant="secondary" className={userData.role === 'customer' ? "bg-zinc-100 text-zinc-600" : "bg-blue-100 text-blue-700"}>
                  {userData.role === 'customer' ? (
                    <><User className="w-3 h-3 mr-1" /> Pengguna Publik</>
                  ) : (
                    <><Building2 className="w-3 h-3 mr-1" /> Anggota Unit / Organisasi</>
                  )}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-zinc-500 justify-center sm:justify-start">
                <span className="flex items-center justify-center sm:justify-start gap-1">
                  <Mail className="w-4 h-4" /> {userData.email}
                </span>
                {userData.nik && (
                  <span className="flex items-center justify-center sm:justify-start gap-1">
                    <ShieldCheck className="w-4 h-4 text-green-600" /> NIK: {userData.nik.slice(0, 6)}**********
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-zinc-700 font-medium">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <User className="w-4 h-4" />
                    </div>
                    <Input
                      id="fullName"
                      name="fullName"
                      required
                      className="pl-10"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zinc-700 font-medium">
                    No. WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="pl-10"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-zinc-700 font-medium">
                  Alamat Pengiriman Default <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none text-zinc-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <Textarea
                    id="address"
                    name="address"
                    required
                    rows={4}
                    className="pl-10 resize-none"
                    placeholder="Tuliskan jalan, RT/RW, kelurahan, kecamatan, dan kota secara lengkap untuk memudahkan pengiriman pesanan Anda."
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white min-w-[150px] shadow-md shadow-red-100"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* CTA PENDAFTARAN BARU DIARAHKAN KE /terms */}
        {isRegularCustomer && (
          <div className="mt-8 relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-center sm:text-left flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-blue-900/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 border border-white/20 shadow-inner">
              <Building2 className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            
            <div className="flex-1 relative z-10 text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Tingkatkan Akun Anda!</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-4 md:mb-0">
                Bergabunglah menjadi anggota di salah satu unit kami untuk kemudahan akses dan program eksklusif, atau daftarkan organisasi Anda ke dalam sistem sebagai unit baru.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10 shrink-0">
               <Button 
                 onClick={() => router.push('/terms?type=member')} 
                 className="bg-white text-blue-700 hover:bg-zinc-50 hover:scale-105 transition-transform font-bold px-6 h-11 shadow-lg w-full sm:w-auto"
               >
                 Gabung Unit
               </Button>
               <Button 
                 onClick={() => router.push('/terms?type=unit')} 
                 variant="outline"
                 className="bg-transparent text-white border-white hover:bg-white/20 hover:text-white font-bold px-6 h-11 w-full sm:w-auto"
               >
                 <PlusCircle className="w-4 h-4 mr-2" /> Daftarkan Unit Baru
               </Button>
            </div>
          </div>
        )}

        {/* CTA UNTUK PENGAJUAN SEDANG DIPROSES */}
        {(isPendingMember || isPendingUnit) && (
          <div className="mt-8 relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 md:p-8 text-center sm:text-left flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-orange-900/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 border border-white/20 shadow-inner">
              <Clock className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            
            <div className="flex-1 relative z-10 text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Pengajuan Sedang Diproses</h3>
              <p className="text-orange-100 text-sm leading-relaxed mb-4 md:mb-0">
                {isPendingUnit 
                   ? "Data pendaftaran unit / organisasi Anda sedang ditinjau oleh pengelola pusat. Silakan pantau status pengajuan Anda secara berkala."
                   : "Keanggotaan Anda masih berstatus tertunda. Silakan lengkapi tahapan administrasi dan validasi fisik di unit terkait untuk mengaktifkan akun."}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10 shrink-0">
               <Button 
                 onClick={() => router.push(isPendingUnit ? '/pending-unit' : '/pending')} 
                 className="bg-white text-orange-700 hover:bg-zinc-50 hover:scale-105 transition-transform font-bold px-6 h-11 shadow-lg w-full sm:w-auto"
               >
                 Cek Status
               </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}