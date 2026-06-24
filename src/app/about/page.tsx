"use client";

import { MainNavbar } from "@/components/layout/main-navbar";
import { 
  Globe, 
  Leaf, 
  HeartHandshake, 
  Store, 
  Wallet, 
  FileText, 
  CheckCircle2,
  Smartphone,
  TrendingUp,
  ShieldCheck,
  Zap
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-red-100 selection:text-red-900">
      <MainNavbar />

      {/* --- HERO BANNER (TRANSFORMASI DIGITAL) --- */}
      <section className="py-24 bg-gradient-to-br from-red-800 to-red-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="container px-4 mx-auto relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-sm">
            Revolusi Koperasi Indonesia
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            Transformasi Digital untuk <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-white">
              Ekonomi Kerakyatan Modern
            </span>
          </h1>
          <p className="text-lg md:text-xl text-red-100 max-w-2xl mx-auto leading-relaxed">
            Membawa semangat gotong royong ke era digital. Kami membangun jembatan teknologi yang menghubungkan potensi lokal dengan peluang global, menciptakan ekosistem ekonomi yang inklusif, transparan, dan berkelanjutan.
          </p>
        </div>
      </section>

      {/* --- VISI & MISI --- */}
      <section className="py-20 bg-white">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-3 gap-8 -mt-32 relative z-20">
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 hover:transform hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Konektivitas Tanpa Batas</h3>
              <p className="text-zinc-600 leading-relaxed text-sm">
                Menghubungkan unit koperasi dari Sabang sampai Merauke dalam satu jaringan terintegrasi, memungkinkan kolaborasi dan pertukaran nilai ekonomi yang lebih luas.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 hover:transform hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Akelarasi Digital</h3>
              <p className="text-zinc-600 leading-relaxed text-sm">
                Memberdayakan koperasi dengan alat manajemen modern, sistem kasir pintar (POS), dan analitik data untuk pengambilan keputusan yang lebih cerdas dan cepat.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 hover:transform hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Pemberdayaan Anggota</h3>
              <p className="text-zinc-600 leading-relaxed text-sm">
                Menempatkan kesejahteraan anggota sebagai prioritas utama dengan transparansi pembagian hasil (SHU) dan akses pasar yang lebih adil bagi produk lokal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- KEUNGGULAN EKOSISTEM --- */}
      <section className="py-20 bg-zinc-50 relative overflow-hidden">
        <div className="container px-4 mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-16">
            
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 leading-tight">
                Ekosistem Terpadu untuk <br />
                <span className="text-red-600">Pertumbuhan Bersama</span>
              </h2>
              <p className="text-zinc-500 text-lg">
                Kami menghadirkan solusi end-to-end yang mengubah cara koperasi beroperasi, melayani anggota, dan berinteraksi dengan pasar.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-red-600 shadow-sm">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-zinc-900">Marketplace Terkurasi</h4>
                    <p className="text-zinc-500 text-sm mt-1">
                      Platform jual beli khusus yang mengangkat produk-produk unggulan anggota koperasi ke panggung yang lebih besar dengan manajemen stok terpusat.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-blue-600 shadow-sm">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-zinc-900">Transparansi Keuangan</h4>
                    <p className="text-zinc-500 text-sm mt-1">
                      Sistem pencatatan real-time yang menjamin akuntabilitas pengelolaan simpanan wajib, pokok, dan sukarela, serta perhitungan SHU yang otomatis dan adil.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-purple-600 shadow-sm">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-zinc-900">Aksesibilitas Mobile</h4>
                    <p className="text-zinc-500 text-sm mt-1">
                      Pengalaman pengguna yang dioptimalkan untuk perangkat mobile, memastikan setiap anggota dapat mengakses layanan koperasi kapan saja, di mana saja.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 relative">
               <div className="relative z-10 bg-white p-2 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 border border-zinc-100">
                  <Image 
                    src="/icon.png" 
                    alt="Platform Preview" 
                    width={500} 
                    height={500} 
                    className="rounded-2xl bg-zinc-50"
                  />
               </div>
               <div className="absolute inset-0 bg-red-600/5 rounded-3xl transform -rotate-3 scale-95 z-0" />
            </div>

          </div>
        </div>
      </section>

      {/* --- CARA BERGABUNG (Modern Flow) --- */}
      <section className="py-24 bg-white border-t border-zinc-100">
        <div className="container px-4 mx-auto text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 mb-6">
            Siap Menjadi Bagian dari Perubahan?
          </h2>
          <p className="text-zinc-500 text-lg mb-12">
            Bergabunglah dengan gerakan ekonomi kerakyatan modern. Proses pendaftaran yang mudah, aman, dan langsung menghubungkan Anda dengan komunitas koperasi terdekat.
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
              <span className="text-5xl font-black text-zinc-200 block mb-4">01</span>
              <h4 className="text-lg font-bold text-zinc-900 mb-2">Registrasi Digital</h4>
              <p className="text-zinc-500 text-sm">Isi data diri secara lengkap melalui aplikasi untuk membuat profil keanggotaan awal Anda.</p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
              <span className="text-5xl font-black text-zinc-200 block mb-4">02</span>
              <h4 className="text-lg font-bold text-zinc-900 mb-2">Verifikasi Unit</h4>
              <p className="text-zinc-500 text-sm">Kunjungi unit koperasi pilihan untuk validasi data dan penyetoran simpanan pokok perdana.</p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
              <span className="text-5xl font-black text-zinc-200 block mb-4">03</span>
              <h4 className="text-lg font-bold text-zinc-900 mb-2">Akses Penuh</h4>
              <p className="text-zinc-500 text-sm">Akun aktif. Nikmati seluruh fitur belanja, simpanan, dan keuntungan anggota lainnya.</p>
            </div>
          </div>

          <div className="mt-16">
            <Link href="/register">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-lg px-10 py-6 h-auto shadow-lg shadow-red-200">
                Daftar Sekarang
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-zinc-900 text-center border-t border-zinc-800">
        <div className="container mx-auto px-4 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
                <Image src="/icon.png" width={40} height={40} alt="Logo" className="brightness-0 invert" />
                <div className="text-left">
                  <span className="block font-bold text-white text-lg leading-none">CoopConnect</span>
                  <span className="text-[10px] text-zinc-400 tracking-wider uppercase">Platform Koperasi Digital</span>
                </div>
            </div>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              Membangun ekonomi negeri melalui sinergi teknologi dan semangat gotong royong.
            </p>
            <div className="text-zinc-600 text-xs mt-4">
              &copy; {new Date().getFullYear()} Koperasi Merah Putih. Hak Cipta Dilindungi.
            </div>
        </div>
      </footer>
    </div>
  );
}