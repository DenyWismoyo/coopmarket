"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const [loading, setLoading] = useState(false);

  // State Login Member (NIK)
  const [nik, setNik] = useState("");
  const [passwordMember, setPasswordMember] = useState("");

  // State Login Email (Admin/Umum)
  const [email, setEmail] = useState("");
  const [passwordEmail, setPasswordEmail] = useState("");

  const routeUserBasedOnProfile = async (uid: string) => {
    try {
      const profile = await authService.getUserProfile(uid);

      if (!profile) {
        toast.error("Profil tidak ditemukan di database. Hubungi Administrator.");
        setLoading(false);
        return;
      }

      const isAdmin = ["super_admin", "admin", "unit_admin"].includes(profile.role);

      if (isAdmin) {
        const isRedirectToMember = redirectUrl && redirectUrl.includes("/member");
        window.location.href = (redirectUrl && !isRedirectToMember) ? redirectUrl : "/admin";
        return;
      }

      if (profile.status === "active") {
        if (profile.role === "customer") {
          // Jika role adalah customer, cegah akses ke /member dan arahkan ke halaman utama /
          const isRedirectToMember = redirectUrl && redirectUrl.includes("/member");
          window.location.href = (redirectUrl && !isRedirectToMember) ? redirectUrl : "/";
        } else {
          // Jika role adalah member (atau lainnya yang bukan admin/customer)
          window.location.href = redirectUrl || "/member";
        }
      } else if (profile.status === "pending") {
        window.location.href = "/pending";
      } else {
        toast.error("Akun Anda tidak aktif atau ditangguhkan.");
        setLoading(false);
      }
      
    } catch (error) {
      console.error("Gagal mengambil data profil:", error);
      toast.error("Terjadi kesalahan sistem saat memuat profil.");
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await authService.login(email, passwordEmail);
      toast.success("Berhasil masuk!");
      await routeUserBasedOnProfile(userCredential.user.uid);
    } catch (error: any) {
      console.error("Login Error:", error);
      toast.error("Email atau Password salah.");
      setLoading(false);
    }
  };

  // Logic Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await authService.loginWithGoogle();
      toast.success("Otentikasi Google berhasil!");
      
      const profile = await authService.getUserProfile(user.uid);

      if (!profile) {
        // Jika tidak ada di Firestore, arahkan ke onboarding
        toast.info("Silakan lengkapi data profil Anda.");
        const params = new URLSearchParams({
          uid: user.uid,
          email: user.email || "",
          name: user.displayName || ""
        });
        window.location.href = `/complete-profile?${params.toString()}`;
        return;
      }

      await routeUserBasedOnProfile(user.uid);

    } catch (error: any) {
      console.error("Google Login Error:", error);
      toast.error("Gagal masuk dengan Google.");
      setLoading(false);
    }
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await authService.login(nik, passwordMember);
      toast.success("Selamat datang kembali!");
      await routeUserBasedOnProfile(userCredential.user.uid);
    } catch (error: any) {
      console.error("Member Login Error:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        toast.error("ID/NIK atau Password salah.");
      } else if (error.message.includes('tidak ditemukan')) {
        toast.error("ID/NIK tidak ditemukan. Silakan daftar dulu.");
      } else {
        toast.error("Gagal login: " + error.message);
      }
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="public" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="public">Umum / Admin</TabsTrigger>
        <TabsTrigger value="member">Anggota / Mitra</TabsTrigger>
      </TabsList>

      <TabsContent value="public">
        <Card>
          <CardHeader>
            <CardTitle>Masuk Akun</CardTitle>
            <CardDescription>Gunakan email terdaftar Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Tombol Google */}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full font-semibold border-zinc-300"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Masuk dengan Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-500">Atau dengan Email</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passEmail">Password</Label>
                <Input
                  id="passEmail"
                  type="password"
                  placeholder="••••••••"
                  value={passwordEmail}
                  onChange={(e) => setPasswordEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Masuk"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t pt-4">
            <p className="text-xs text-zinc-500">
              Belum punya akun? <Link href="/register" className="text-blue-600 hover:underline">Daftar disini</Link>
            </p>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="member">
        <Card>
          <CardHeader>
            <CardTitle>Login Anggota Terdaftar</CardTitle>
            <CardDescription>Masuk menggunakan Nomor Identitas & Password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMemberLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nik">ID / NIK (Nomor Induk Kependudukan)</Label>
                <Input
                  id="nik"
                  placeholder="Masukkan nomor identitas"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => toast.info("Silakan hubungi Administrator untuk bantuan reset password.")}>
                    Lupa?
                  </span>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordMember}
                  onChange={(e) => setPasswordMember(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Masuk Ke Sistem"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t pt-4 bg-zinc-50/50">
            <div className="text-center text-sm">
              Belum terdaftar?
              <Link href="/register" className="text-blue-700 font-bold hover:underline ml-1">
                Daftar Sekarang
              </Link>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}