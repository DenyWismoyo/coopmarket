"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileDown, Sheet, CalendarRange, Loader2 } from "lucide-react";

// Services
import { expenseService } from "@/services/expense.service";
import { inventoryService } from "@/services/inventory.service";
import { orderService } from "@/services/order.service"; // Perlu update order service untuk range query (anggap sudah ada atau fetch all lalu filter)

export default function AdminReportsPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Helper: Convert Array to CSV & Download
  const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) {
      toast.warning("Tidak ada data pada periode ini.");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (type: 'expenses' | 'inventory' | 'sales') => {
    if (!userData?.coopId) return;
    setLoading(true);
    
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    // Adjust end date to cover the full day
    end.setHours(23, 59, 59, 999);

    try {
      let data: any[] = [];
      let filename = "";

      if (type === 'expenses') {
         const res = await expenseService.getExpensesByDateRange(userData.coopId, start, end);
         data = res.map(e => ({
            Tanggal: new Date(e.date).toLocaleDateString('id-ID'),
            Kategori: e.category,
            Judul: e.title,
            Nominal: e.amount,
            Ket: e.description || "-"
         }));
         filename = `Laporan_Pengeluaran_${dateRange.start}_${dateRange.end}.csv`;
      } 
      else if (type === 'inventory') {
         const res = await inventoryService.getMovementsByDateRange(userData.coopId, start, end);
         data = res.map(m => ({
            Tanggal: new Date(m.createdAt).toLocaleString('id-ID'),
            Produk: m.productName,
            Tipe: m.type,
            Qty: m.quantity,
            Stok_Awal: m.previousStock,
            Stok_Akhir: m.newStock,
            Ket: m.reason || "-"
         }));
         filename = `Laporan_Stok_${dateRange.start}_${dateRange.end}.csv`;
      }
      
      downloadCSV(data, filename);
      toast.success("Download dimulai");

    } catch (error) {
      toast.error("Gagal export data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pusat Laporan</h1>
        <p className="text-sm text-zinc-500">Unduh data operasional dalam format CSV/Excel.</p>
      </div>

      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2"><CalendarRange className="w-5 h-5"/> Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="flex gap-4 items-end">
              <div className="space-y-2">
                 <Label>Dari Tanggal</Label>
                 <Input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <Label>Sampai Tanggal</Label>
                 <Input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
              </div>
           </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
         {/* Export Pengeluaran */}
         <Card className="hover:border-red-500 transition-colors cursor-pointer group" onClick={() => handleExport('expenses')}>
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
               <div className="p-4 bg-red-50 rounded-full text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <FileDown className="w-8 h-8" />
               </div>
               <div>
                  <h3 className="font-bold text-zinc-900">Laporan Pengeluaran</h3>
                  <p className="text-xs text-zinc-500 mt-1">Data biaya operasional, gaji, aset</p>
               </div>
            </CardContent>
         </Card>

         {/* Export Stok */}
         <Card className="hover:border-blue-500 transition-colors cursor-pointer group" onClick={() => handleExport('inventory')}>
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
               <div className="p-4 bg-blue-50 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Sheet className="w-8 h-8" />
               </div>
               <div>
                  <h3 className="font-bold text-zinc-900">Kartu Stok Barang</h3>
                  <p className="text-xs text-zinc-500 mt-1">Riwayat masuk keluar barang & opname</p>
               </div>
            </CardContent>
         </Card>

         {/* Export Placeholder (Sales) */}
         <Card className="hover:border-green-500 transition-colors cursor-pointer group relative overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4 opacity-50">
               <div className="p-4 bg-green-50 rounded-full text-green-600">
                  <FileDown className="w-8 h-8" />
               </div>
               <div>
                  <h3 className="font-bold text-zinc-900">Laporan Penjualan</h3>
                  <p className="text-xs text-zinc-500 mt-1">Rekap omset harian & detail order</p>
               </div>
            </CardContent>
             <div className="absolute inset-0 flex items-center justify-center bg-white/50 font-bold text-sm text-zinc-500 rotate-12">
               COMING SOON
            </div>
         </Card>
      </div>
      
      {loading && (
         <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white p-4 rounded-lg flex items-center gap-3 shadow-lg">
               <Loader2 className="animate-spin text-red-600" /> Sedang memproses data...
            </div>
         </div>
      )}
    </div>
  );
}