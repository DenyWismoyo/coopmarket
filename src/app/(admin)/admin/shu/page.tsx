"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { orderService } from "@/services/order.service";
import { expenseService } from "@/services/expense.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart as PieChartIcon, 
  Download,
  AlertCircle,
  Settings,
  RefreshCcw,
  Save
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function SHUPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Konfigurasi Parameter SHU (Default values)
  const [config, setConfig] = useState({
    grossMargin: 20, // 20% Estimasi Laba Kotor
    allocations: {
        jasaModal: 30,
        jasaAnggota: 25,
        danaCadangan: 25,
        lainLain: 20
    }
  });

  // State sementara untuk form edit konfigurasi
  const [tempConfig, setTempConfig] = useState(config);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [financials, setFinancials] = useState({
    revenue: 0,      // Total Omset
    expenses: 0,     // Total Pengeluaran Operasional
    grossProfit: 0,  // Laba Kotor (Estimasi)
    netSHU: 0,       // SHU Bersih (Laba Kotor - Beban)
    orderCount: 0
  });

  // Fungsi Fetch Data Utama
  async function fetchData() {
    if (!userData?.coopId) return;

    try {
      setLoading(true);

      // 1. Fetch Transaksi (Omset)
      const orders = await orderService.getOrdersByCoop(userData.coopId);
      const validOrders = orders.filter(o => o.paymentStatus === 'paid' || o.status === 'completed');
      const totalRevenue = validOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

      // 2. Fetch Pengeluaran (Beban)
      const expenses = await expenseService.getExpenses(userData.coopId);
      const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

      // 3. Kalkulasi Berdasarkan Config Saat Ini
      const calculatedGrossProfit = totalRevenue * (config.grossMargin / 100);
      const calculatedNetSHU = calculatedGrossProfit - totalExpenses;

      setFinancials({
        revenue: totalRevenue,
        expenses: totalExpenses,
        grossProfit: calculatedGrossProfit,
        netSHU: calculatedNetSHU,
        orderCount: validOrders.length
      });

    } catch (error) {
      console.error("Gagal menghitung SHU:", error);
    } finally {
      setLoading(false);
    }
  }

  // Efek saat userData siap atau config berubah, hitung ulang
  useEffect(() => {
    fetchData();
  }, [userData, config]);

  // Handler Simpan Konfigurasi
  const handleSaveConfig = () => {
    // Validasi total alokasi harus 100%
    const totalAlloc = 
        tempConfig.allocations.jasaModal + 
        tempConfig.allocations.jasaAnggota + 
        tempConfig.allocations.danaCadangan + 
        tempConfig.allocations.lainLain;

    if (totalAlloc !== 100) {
        toast.error(`Total alokasi harus 100%. Saat ini: ${totalAlloc}%`);
        return;
    }

    setConfig(tempConfig);
    setIsConfigOpen(false);
    toast.success("Parameter SHU berhasil diperbarui");
  };

  const updateAllocation = (key: keyof typeof config.allocations, value: string) => {
      const numValue = parseFloat(value) || 0;
      setTempConfig(prev => ({
          ...prev,
          allocations: {
              ...prev.allocations,
              [key]: numValue
          }
      }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Skeleton className="h-32" />
           <Skeleton className="h-32" />
           <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Sisa Hasil Usaha (SHU)</h1>
          <p className="text-zinc-500">Estimasi laba rugi koperasi & simulasi pembagian.</p>
        </div>
        
        <div className="flex gap-2">
            {/* Tombol Konfigurasi */}
            <Dialog open={isConfigOpen} onOpenChange={(open) => {
                if(open) setTempConfig(config); // Reset temp saat buka
                setIsConfigOpen(open);
            }}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 border-zinc-300">
                        <Settings className="w-4 h-4" /> Parameter SHU
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Konfigurasi Parameter SHU</DialogTitle>
                        <DialogDescription>
                            Sesuaikan estimasi margin dan alokasi pembagian sesuai AD/ART koperasi Anda.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-6 py-4">
                        {/* 1. Margin Settings */}
                        <div className="space-y-4 border-b pb-4">
                            <h4 className="font-semibold text-sm text-zinc-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Estimasi Margin Laba
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label>Margin Laba Kotor (%)</Label>
                                    <span className="font-bold text-blue-600">{tempConfig.grossMargin}%</span>
                                </div>
                                <Slider 
                                    defaultValue={[tempConfig.grossMargin]} 
                                    max={100} 
                                    step={1} 
                                    onValueChange={(vals) => setTempConfig({...tempConfig, grossMargin: vals[0]})}
                                    className="py-2"
                                />
                                <p className="text-[10px] text-zinc-500">
                                    Persentase dari total penjualan yang dianggap sebagai profit sebelum dikurangi beban operasional.
                                </p>
                            </div>
                        </div>

                        {/* 2. Allocation Settings */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-zinc-900 flex items-center gap-2">
                                <PieChartIcon className="w-4 h-4" /> Alokasi Pembagian (%)
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Jasa Modal</Label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            value={tempConfig.allocations.jasaModal} 
                                            onChange={(e) => updateAllocation('jasaModal', e.target.value)}
                                            className="h-8 pr-6"
                                        />
                                        <span className="absolute right-2 top-2 text-xs text-zinc-400">%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Jasa Anggota</Label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            value={tempConfig.allocations.jasaAnggota} 
                                            onChange={(e) => updateAllocation('jasaAnggota', e.target.value)}
                                            className="h-8 pr-6"
                                        />
                                        <span className="absolute right-2 top-2 text-xs text-zinc-400">%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Dana Cadangan</Label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            value={tempConfig.allocations.danaCadangan} 
                                            onChange={(e) => updateAllocation('danaCadangan', e.target.value)}
                                            className="h-8 pr-6"
                                        />
                                        <span className="absolute right-2 top-2 text-xs text-zinc-400">%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Lain-lain</Label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            value={tempConfig.allocations.lainLain} 
                                            onChange={(e) => updateAllocation('lainLain', e.target.value)}
                                            className="h-8 pr-6"
                                        />
                                        <span className="absolute right-2 top-2 text-xs text-zinc-400">%</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Total Indicator */}
                            <div className="flex justify-between items-center bg-zinc-50 p-2 rounded text-xs">
                                <span>Total Alokasi:</span>
                                <span className={`font-bold ${
                                    (tempConfig.allocations.jasaModal + tempConfig.allocations.jasaAnggota + tempConfig.allocations.danaCadangan + tempConfig.allocations.lainLain) === 100 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                    {tempConfig.allocations.jasaModal + tempConfig.allocations.jasaAnggota + tempConfig.allocations.danaCadangan + tempConfig.allocations.lainLain}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Batal</Button>
                        <Button onClick={handleSaveConfig} className="gap-2">
                            <Save className="w-4 h-4" /> Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button variant="outline" className="gap-2" onClick={fetchData}>
                <RefreshCcw className="w-4 h-4" />
            </Button>
        </div>
      </div>

      {/* --- WARNING BANNER --- */}
      {financials.netSHU < 0 && (
         <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Perhatian: Defisit Anggaran</AlertTitle>
            <AlertDescription>
               Pengeluaran operasional melebihi estimasi laba kotor. Evaluasi kembali pengeluaran rutin Anda.
            </AlertDescription>
         </Alert>
      )}

      {/* --- KARTU UTAMA --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. OMSET */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 flex justify-between">
               Total Omset Penjualan
               <Banknote className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{formatCurrency(financials.revenue)}</div>
            <p className="text-xs text-zinc-500 mt-1">{financials.orderCount} transaksi sukses</p>
          </CardContent>
        </Card>

        {/* 2. LABA KOTOR */}
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 flex justify-between">
               Est. Laba Kotor (Gross)
               <TrendingUp className="w-4 h-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{formatCurrency(financials.grossProfit)}</div>
            <p className="text-xs text-zinc-500 mt-1">Margin {config.grossMargin}% dari omset</p>
          </CardContent>
        </Card>

        {/* 3. PENGELUARAN */}
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 flex justify-between">
               Total Pengeluaran
               <TrendingDown className="w-4 h-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{formatCurrency(financials.expenses)}</div>
            <p className="text-xs text-zinc-500 mt-1">Beban operasional & gaji</p>
          </CardContent>
        </Card>

        {/* 4. SHU BERSIH */}
        <Card className={`border-l-4 shadow-sm ${financials.netSHU >= 0 ? 'border-l-indigo-600 bg-indigo-50/50' : 'border-l-orange-500 bg-orange-50/50'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 flex justify-between">
               SHU Bersih (Net Profit)
               <Wallet className={`w-4 h-4 ${financials.netSHU >= 0 ? 'text-indigo-600' : 'text-orange-500'}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-extrabold ${financials.netSHU >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>
               {formatCurrency(financials.netSHU)}
            </div>
            <p className="text-xs text-zinc-600 mt-1">Siap dibagikan ke anggota</p>
          </CardContent>
        </Card>

      </div>

      {/* --- INFO ALOKASI --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2">
            <CardHeader>
               <CardTitle>Rincian Perhitungan</CardTitle>
               <CardDescription>Bagaimana SHU Bersih didapatkan</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                     <span className="text-sm text-zinc-600">Total Pendapatan (Omset)</span>
                     <span className="font-medium">{formatCurrency(financials.revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                     <span className="text-sm text-zinc-600">Harga Pokok Penjualan (HPP) - Est. {100 - config.grossMargin}%</span>
                     <span className="font-medium text-red-600">- {formatCurrency(financials.revenue * ((100 - config.grossMargin)/100))}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-100 bg-zinc-50/50 px-2 rounded">
                     <span className="text-sm font-bold text-zinc-800">Laba Kotor</span>
                     <span className="font-bold text-zinc-800">{formatCurrency(financials.grossProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                     <span className="text-sm text-zinc-600">Beban Operasional (Listrik, Gaji, dll)</span>
                     <span className="font-medium text-red-600">- {formatCurrency(financials.expenses)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-indigo-50 px-3 rounded-lg border border-indigo-100 mt-2">
                     <span className="text-base font-bold text-indigo-900">Total SHU Bersih</span>
                     <span className="text-lg font-extrabold text-indigo-700">{formatCurrency(financials.netSHU)}</span>
                  </div>
               </div>
            </CardContent>
         </Card>

         <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-none">
            <CardHeader>
               <CardTitle className="text-white flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" /> Simulasi Alokasi
               </CardTitle>
               <CardDescription className="text-zinc-400">
                  Pembagian SHU sesuai parameter.
               </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
               {financials.netSHU > 0 ? (
                  <>
                     <div>
                        <div className="flex justify-between text-sm mb-1 text-zinc-300">
                           <span>Jasa Modal ({config.allocations.jasaModal}%)</span>
                           <span>{formatCurrency(financials.netSHU * (config.allocations.jasaModal / 100))}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500" style={{ width: `${config.allocations.jasaModal}%` }} />
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-sm mb-1 text-zinc-300">
                           <span>Jasa Anggota ({config.allocations.jasaAnggota}%)</span>
                           <span>{formatCurrency(financials.netSHU * (config.allocations.jasaAnggota / 100))}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-green-500" style={{ width: `${config.allocations.jasaAnggota}%` }} />
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-sm mb-1 text-zinc-300">
                           <span>Dana Cadangan ({config.allocations.danaCadangan}%)</span>
                           <span>{formatCurrency(financials.netSHU * (config.allocations.danaCadangan / 100))}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-orange-500" style={{ width: `${config.allocations.danaCadangan}%` }} />
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-sm mb-1 text-zinc-300">
                           <span>Lain-lain ({config.allocations.lainLain}%)</span>
                           <span>{formatCurrency(financials.netSHU * (config.allocations.lainLain / 100))}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-purple-500" style={{ width: `${config.allocations.lainLain}%` }} />
                        </div>
                     </div>
                  </>
               ) : (
                  <div className="text-center py-10 text-zinc-400">
                     <p>Belum ada profit untuk dialokasikan.</p>
                  </div>
               )}
            </CardContent>
         </Card>
      </div>
    </div>
  );
}