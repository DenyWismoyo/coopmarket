"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, TrendingUp, Download, Loader2, Package, ShoppingBag, User, Building2 } from "lucide-react";
import { memberService } from "@/services/member.service";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function MemberTractionPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pertumbuhan");
  
  // States Data
  const [tractionData, setTractionData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    if (!userData?.coopId) return;
    setLoading(true);
    try {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      // Jalankan kedua query secara paralel agar lebih cepat
      const [tractionRes, salesRes] = await Promise.all([
        memberService.getMemberTractionByDateRange(userData.coopId, startDate, endDate),
        memberService.getMemberDailySalesByDateRange(userData.coopId, startDate, endDate)
      ]);

      setTractionData(tractionRes);
      setSalesData(salesRes);
    } catch (error) {
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userData?.coopId]);

  // Fungsi Export Dinamis berdasarkan Tab Aktif
  const handleExportCSV = () => {
    let headers = "";
    let rows = "";
    let fileName = "";

    if (activeTab === "pertumbuhan") {
      if (!tractionData.length) return toast.warning("Tidak ada data pertumbuhan untuk diexport");
      headers = "Tanggal,Pendaftar Baru,Aktif,Pending,Potensi Simpanan Masuk,Produk Titipan Baru,Potensi Penjualan Produk\n";
      rows = tractionData.map(row => 
        `"${row.date}","${row.newMembers}","${row.active}","${row.pending}","${row.totalSimpanan}","${row.newProducts}","${row.potentialProductValue}"`
      ).join("\n");
      fileName = `Pertumbuhan_Koperasi_${dateRange.start}_${dateRange.end}.csv`;
    
    } else if (activeTab === "penjualan") {
      if (!salesData.length) return toast.warning("Tidak ada data penjualan untuk diexport");
      // [UPDATE] Penambahan Tipe Penjual pada CSV
      headers = "Tanggal,Tipe Penjual,Nama Penjual (Pemilik),ID Penjual,Item Terjual,Total Omset\n";
      rows = salesData.map(row => 
        `"${row.date}","${row.sellerType === 'coop' ? 'Unit Koperasi' : 'Member'}","${row.sellerName}","${row.sellerId}","${row.totalItems}","${row.totalOmset}"`
      ).join("\n");
      fileName = `Omset_Harian_${dateRange.start}_${dateRange.end}.csv`;
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Traksi Koperasi</h1>
          <p className="text-sm text-zinc-500">Pantau pertumbuhan anggota dan performa omset penjualan hari ke hari.</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2 bg-white shadow-sm border-zinc-200 text-zinc-700 hover:bg-zinc-50">
          <Download className="w-4 h-4" /> Export CSV ({activeTab === 'pertumbuhan' ? 'Pertumbuhan' : 'Omset'})
        </Button>
      </div>

      {/* FILTER PERIODE */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="pb-4 border-b border-zinc-100">
           <CardTitle className="flex items-center gap-2 text-lg text-zinc-800">
             <CalendarRange className="w-5 h-5 text-blue-600"/> Filter Periode
           </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
           <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-2 w-full sm:w-auto">
                 <Label className="text-zinc-600">Dari Tanggal</Label>
                 <Input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-zinc-50 border-zinc-200" />
              </div>
              <div className="space-y-2 w-full sm:w-auto">
                 <Label className="text-zinc-600">Sampai Tanggal</Label>
                 <Input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-zinc-50 border-zinc-200" />
              </div>
              <Button onClick={fetchData} disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm">
                 {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Terapkan Filter"}
              </Button>
           </div>
        </CardContent>
      </Card>

      {/* TABS KONTEN */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="bg-white border border-zinc-200 p-1 rounded-lg h-auto flex flex-wrap max-w-fit shadow-sm">
          <TabsTrigger value="pertumbuhan" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm px-4 py-2 font-semibold">
            <TrendingUp className="w-4 h-4 mr-2 text-red-500" /> Pertumbuhan & Aset
          </TabsTrigger>
          <TabsTrigger value="penjualan" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm px-4 py-2 font-semibold">
            <ShoppingBag className="w-4 h-4 mr-2 text-blue-600" /> Omset Penjualan
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PERTUMBUHAN & ASET */}
        <TabsContent value="pertumbuhan" className="mt-0">
          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="pb-4 border-b border-zinc-100 bg-zinc-50/50">
              <CardTitle className="text-base text-zinc-800">Detail Pertumbuhan Harian</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                 <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-300" /></div>
              ) : tractionData.length === 0 ? (
                 <div className="text-center py-12 text-zinc-500">Belum ada aktivitas di rentang tanggal ini.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white text-zinc-500 border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Tanggal</th>
                        <th className="px-4 py-3 font-semibold text-center">Anggota Baru</th>
                        <th className="px-4 py-3 font-semibold text-center text-green-600">Teraktivasi</th>
                        <th className="px-4 py-3 font-semibold text-right">Potensi Simpanan</th>
                        <th className="px-4 py-3 font-semibold text-center text-purple-600 border-l border-zinc-100">Produk Titipan</th>
                        <th className="px-4 py-3 font-semibold text-right text-purple-600">Potensi Penjualan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {tractionData.map((row) => (
                        <tr key={row.date} className="hover:bg-zinc-50/50">
                          <td className="px-4 py-4 font-medium text-zinc-900">{row.date}</td>
                          <td className="px-4 py-4 text-center">{row.newMembers > 0 ? row.newMembers : '-'}</td>
                          <td className="px-4 py-4 text-center text-green-600 font-medium">{row.active > 0 ? row.active : '-'}</td>
                          <td className="px-4 py-4 text-right">{formatCurrency(row.totalSimpanan)}</td>
                          <td className="px-4 py-4 text-center border-l border-zinc-100">
                            {row.newProducts > 0 ? (
                               <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                 <Package className="w-3 h-3" /> {row.newProducts} Item
                               </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-4 text-right font-bold text-zinc-700">{formatCurrency(row.potentialProductValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PENJUALAN KESELURUHAN (UNIT & MEMBER) */}
        <TabsContent value="penjualan" className="mt-0">
          <Card className="shadow-sm border-zinc-200 border-t-4 border-t-blue-500">
            <CardHeader className="pb-4 border-b border-zinc-100 bg-zinc-50/50">
              <CardTitle className="text-base text-zinc-800">Detail Omset Harian (Unit & Anggota)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                 <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-300" /></div>
              ) : salesData.length === 0 ? (
                 <div className="text-center py-12 text-zinc-500 flex flex-col items-center">
                    <ShoppingBag className="w-10 h-10 text-zinc-200 mb-2" />
                    Belum ada rekaman penjualan di rentang tanggal ini.
                 </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white text-zinc-500 border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold whitespace-nowrap">Tanggal</th>
                        <th className="px-4 py-3 font-semibold">Identitas Penjual (Pemilik Produk)</th>
                        <th className="px-4 py-3 font-semibold text-center text-blue-600">Item Terjual</th>
                        <th className="px-4 py-3 font-semibold text-right text-green-600">Total Omset Bersih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {salesData.map((row, idx) => {
                        const isCoop = row.sellerType === 'coop';
                        return (
                          <tr key={`${row.date}_${row.sellerId}_${idx}`} className="hover:bg-zinc-50/50">
                            <td className="px-4 py-4 font-medium text-zinc-900">{row.date}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                 {/* Tampilan Icon Berubah Sesuai Tipe Kepemilikan */}
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCoop ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {isCoop ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-zinc-900">{row.sellerName}</p>
                                      {/* Lencana Identitas */}
                                      <Badge variant="outline" className={`text-[9px] px-1.5 h-4 uppercase tracking-wider ${isCoop ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                        {isCoop ? 'Unit Koperasi' : 'Member'}
                                      </Badge>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">ID: {row.sellerId.slice(0, 8)}...</p>
                                 </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                               <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-md text-xs font-bold border border-zinc-200">
                                 <Package className="w-3 h-3" /> {row.totalItems} Pcs
                               </span>
                            </td>
                            <td className="px-4 py-4 text-right font-black text-green-600 text-base">{formatCurrency(row.totalOmset)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}