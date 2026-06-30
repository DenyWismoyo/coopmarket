"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { orderService } from "@/services/order.service";
import { expenseService } from "@/services/expense.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { 
   Loader2, ArrowDownCircle, ArrowUpCircle, Wallet, 
   Calendar as CalendarIcon, Download, FileText
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type CashFlowItem = {
   id: string;
   date: string;
   description: string;
   type: 'in' | 'out';
   amount: number;
   category: string;
   referenceId?: string;
};

export default function CashFlowReportPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [cashflowData, setCashflowData] = useState<CashFlowItem[]>([]);
  
  // Filter Bulan
  const currentDate = new Date();
  const currentMonthValue = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [filterMonth, setFilterMonth] = useState<string>(currentMonthValue);

  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      options.push({ value: val, label });
    }
    return options;
  }, []);

  useEffect(() => {
    async function fetchCashFlow() {
      if (!userData?.coopId) return;
      setLoading(true);
      
      try {
        // Tentukan Rentang Tanggal berdasarkan filterMonth
        const [year, month] = filterMonth.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59); // Hari terakhir bulan itu

        // 1. Ambil Pemasukan (Dari Orders yang Selesai/Dibayar di bulan tersebut)
        const allOrders = await orderService.getOrdersByCoop(userData.coopId);
        const validIncomes: CashFlowItem[] = allOrders
          .filter(o => o.status !== 'cancelled' && new Date(o.createdAt) >= startDate && new Date(o.createdAt) <= endDate)
          .map(o => ({
             id: o.id,
             date: o.createdAt,
             description: `Penjualan Kasir / POS (${o.buyerName || 'Umum'})`,
             type: 'in',
             amount: o.totalAmount || 0,
             category: 'Penjualan Barang',
             referenceId: o.orderNumber
          }));

        // 2. Ambil Pengeluaran (Beban Operasional bulan tersebut)
        const expensesData = await expenseService.getExpensesByDateRange(userData.coopId, startDate, endDate);
        const validOutflows: CashFlowItem[] = expensesData.map(e => ({
             id: e.id,
             date: e.date,
             description: e.title,
             type: 'out',
             amount: e.amount || 0,
             category: e.category.toUpperCase(),
             referenceId: e.id
        }));

        // Gabungkan & Urutkan secara Kronologis (Terlama ke Terbaru untuk menghitung Saldo Berjalan)
        const combined = [...validIncomes, ...validOutflows].sort((a, b) => 
           new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setCashflowData(combined);
      } catch (error) {
        console.error("Gagal memuat arus kas", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCashFlow();
  }, [userData, filterMonth]);

  // Kalkulasi Rekap
  const { totalIn, totalOut, netBalance } = useMemo(() => {
     return cashflowData.reduce((acc, item) => {
        if (item.type === 'in') acc.totalIn += item.amount;
        else acc.totalOut += item.amount;
        
        acc.netBalance = acc.totalIn - acc.totalOut;
        return acc;
     }, { totalIn: 0, totalOut: 0, netBalance: 0 });
  }, [cashflowData]);

  // Ekspor ke CSV sederhana
  const handleExportCSV = () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Tanggal,Tipe,Kategori,Keterangan,Pemasukan,Pengeluaran\\n";
      
      cashflowData.forEach(item => {
          const row = [
              new Date(item.date).toLocaleString('id-ID'),
              item.type === 'in' ? 'UANG MASUK' : 'UANG KELUAR',
              item.category,
              `"${item.description}"`,
              item.type === 'in' ? item.amount : 0,
              item.type === 'out' ? item.amount : 0
          ].join(",");
          csvContent += row + "\\r\\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Buku_Kas_${filterMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Buku Kas Harian</h1>
          <p className="text-sm text-zinc-500">Laporan arus uang masuk (penjualan) dan uang keluar (beban operasional).</p>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="w-full sm:w-48">
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                   <SelectTrigger className="bg-white border-zinc-200">
                      <CalendarIcon className="w-4 h-4 mr-2 text-zinc-500" />
                      <SelectValue placeholder="Pilih Bulan" />
                   </SelectTrigger>
                   <SelectContent>
                      {monthOptions.map(opt => (
                         <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
            </div>
            <Button variant="outline" className="bg-white" onClick={handleExportCSV} disabled={cashflowData.length === 0}>
               <Download className="w-4 h-4 mr-2" /> Ekspor CSV
            </Button>
        </div>
      </div>

      {/* Ringkasan Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500 shadow-sm">
           <CardContent className="p-5 flex items-center justify-between">
              <div>
                 <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Uang Masuk</p>
                 <p className="text-2xl font-black text-green-700">{formatCurrency(totalIn)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full text-green-600"><ArrowDownCircle className="w-6 h-6" /></div>
           </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500 shadow-sm">
           <CardContent className="p-5 flex items-center justify-between">
              <div>
                 <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Uang Keluar</p>
                 <p className="text-2xl font-black text-red-600">{formatCurrency(totalOut)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full text-red-600"><ArrowUpCircle className="w-6 h-6" /></div>
           </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-blue-50/50">
           <CardContent className="p-5 flex items-center justify-between">
              <div>
                 <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Surplus / Defisit Kas</p>
                 <p className={`text-2xl font-black ${netBalance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                    {formatCurrency(netBalance)}
                 </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full text-blue-700"><Wallet className="w-6 h-6" /></div>
           </CardContent>
        </Card>
      </div>

      {/* Tabel Arus Kas */}
      <Card className="border-zinc-200 shadow-sm bg-white overflow-hidden">
        {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
               <Loader2 className="w-8 h-8 animate-spin mb-4" />
               <p>Memuat buku kas...</p>
            </div>
        ) : cashflowData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
               <FileText className="w-12 h-12 mb-3 opacity-20" />
               <p className="font-medium text-sm">Tidak ada pergerakan kas pada bulan ini.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
               <Table>
                 <TableHeader className="bg-zinc-50">
                   <TableRow>
                     <TableHead className="w-[180px]">Tanggal & Waktu</TableHead>
                     <TableHead>Keterangan Transaksi</TableHead>
                     <TableHead className="text-right">Uang Masuk</TableHead>
                     <TableHead className="text-right">Uang Keluar</TableHead>
                     <TableHead className="text-right font-bold text-zinc-800">Saldo Berjalan</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {/* Kita melakukan map sekaligus menghitung saldo berjalan di dalam iterasi */}
                   {(() => {
                      let runningBalance = 0;
                      return cashflowData.map((item, idx) => {
                         if (item.type === 'in') runningBalance += item.amount;
                         else runningBalance -= item.amount;

                         return (
                            <TableRow key={`${item.id}-${idx}`} className="hover:bg-zinc-50/50">
                               <TableCell className="text-xs text-zinc-600">
                                  {new Date(item.date).toLocaleString('id-ID', { 
                                     day: '2-digit', month: 'short', year: 'numeric',
                                     hour: '2-digit', minute: '2-digit'
                                  })}
                               </TableCell>
                               <TableCell>
                                  <p className="font-bold text-zinc-900 text-sm">{item.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-[9px] bg-white h-4 text-zinc-500">{item.category}</Badge>
                                      {item.referenceId && <span className="text-[10px] text-zinc-400 font-mono">Ref: {item.referenceId}</span>}
                                  </div>
                               </TableCell>
                               <TableCell className="text-right font-medium text-green-700">
                                  {item.type === 'in' ? `+ ${formatCurrency(item.amount)}` : '-'}
                               </TableCell>
                               <TableCell className="text-right font-medium text-red-600">
                                  {item.type === 'out' ? `- ${formatCurrency(item.amount)}` : '-'}
                               </TableCell>
                               <TableCell className="text-right font-black text-blue-700 bg-blue-50/30">
                                  {formatCurrency(runningBalance)}
                               </TableCell>
                            </TableRow>
                         );
                      });
                   })()}
                 </TableBody>
               </Table>
            </div>
        )}
      </Card>
    </div>
  );
}