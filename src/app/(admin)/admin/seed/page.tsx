"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Wrench, AlertTriangle, CheckCircle, Database } from "lucide-react";
import { toast } from "sonner";
import { orderService } from "@/services/order.service";
import { cooperativeService } from "@/services/cooperative.service"; // Pastikan path ini sesuai jika Anda mengambil list koperasi

export default function DatabaseMaintenancePage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // State untuk Super Admin memilih koperasi, atau langsung set default jika Unit Admin
  const [coops, setCoops] = useState<any[]>([]);
  const [selectedCoopId, setSelectedCoopId] = useState<string>("");

  useEffect(() => {
    // Jika user adalah super admin, ambil daftar koperasi
    if (userData?.role === 'super_admin') {
      const fetchCoops = async () => {
        try {
          const data = await cooperativeService.getAllCooperatives();
          setCoops(data);
        } catch (error) {
          console.error("Gagal memuat daftar koperasi", error);
        }
      };
      fetchCoops();
    } else if (userData?.coopId) {
      // Jika admin/unit_admin, langsung kunci ke coopId miliknya
      setSelectedCoopId(userData.coopId);
    }
  }, [userData]);

  const handleAutoHeal = async () => {
    if (!selectedCoopId) {
      return toast.error("Silakan pilih Unit Koperasi terlebih dahulu!");
    }

    if (!confirm("Proses ini akan memindai seluruh data pesanan lama dan memperbaiki nama penjual yang hilang. Proses ini aman dan tidak akan menghapus data apapun. Lanjutkan?")) {
      return;
    }
    
    setLoading(true);
    try {
      const updatedCount = await orderService.autoHealLegacyOrderItems(selectedCoopId);
      
      if (updatedCount > 0) {
        toast.success(`Berhasil! ${updatedCount} dokumen pesanan lama telah diperbaiki secara permanen.`);
      } else {
        toast.info("Pemindaian selesai. Tidak ditemukan data pesanan lama yang perlu diperbaiki.");
      }
    } catch (error) {
      toast.error("Gagal menjalankan proses Auto-Heal. Periksa koneksi atau log sistem.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-blue-600" /> Database Maintenance
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Alat utilitas untuk memperbaiki dan merapikan anomali data (legacy data) pada sistem.</p>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-zinc-700" /> Auto-Heal Pesanan Lama
          </CardTitle>
          <CardDescription>
            Menambal struktur data pesanan yang dibuat sebelum pembaruan sistem POS/Kasir.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
            <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Kapan alat ini digunakan?</p>
              <p>Gunakan fitur ini jika pada halaman <strong>Laporan Penjualan</strong> atau <strong>Riwayat Pesanan</strong> Anda melihat nama penjual tertulis sebagai <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900">Anggota (ID: xxx)</code>. Alat ini akan mencocokkan ID tersebut dengan database anggota dan menyimpan namanya secara permanen ke dalam nota pesanan.</p>
            </div>
          </div>

          {/* Form Pemilihan Koperasi (Hanya untuk Super Admin) */}
          {userData?.role === 'super_admin' && (
            <div className="space-y-2 max-w-md">
              <Label className="text-zinc-700">Target Unit Koperasi</Label>
              <Select value={selectedCoopId} onValueChange={setSelectedCoopId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Pilih unit koperasi..." />
                </SelectTrigger>
                <SelectContent>
                  {coops.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Area Eksekusi */}
          <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200 text-center space-y-4 flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-zinc-300" />
            <div className="max-w-md">
              <h3 className="font-semibold text-zinc-900 mb-1">Siap Dieksekusi</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Klik tombol di bawah ini untuk memulai proses patching. Jangan tutup halaman saat proses sedang berjalan.
              </p>
              
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm"
                onClick={handleAutoHeal}
                disabled={loading || !selectedCoopId}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 
                    Memproses Patching Database...
                  </>
                ) : (
                  <>
                    <Wrench className="w-5 h-5 mr-2" /> 
                    Jalankan Auto-Heal Sekarang
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}