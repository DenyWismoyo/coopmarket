"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { orderService } from "@/services/order.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Loader2, TrendingUp, Calendar, CreditCard, Activity, ArrowUpRight } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Button } from "@/components/ui/button";

type TimeFilter = '7d' | '30d' | 'this_month' | 'all';

export default function SalesRecapPage() {
  const { userData } = useAuth();
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>('7d');

  // Ambil semua data pesanan dari Firebase
  useEffect(() => {
    async function fetchAllOrders() {
      if (userData?.coopId) {
        try {
          const data = await orderService.getOrdersByCoop(userData.coopId);
          // Hanya ambil transaksi yang sukses/dibayar
          setAllOrders(data.filter((o: any) => o.status === 'completed' || o.paymentStatus === 'paid'));
        } catch (error) {
          console.error("Gagal memuat pesanan", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchAllOrders();
  }, [userData]);

  // Logika Filter Waktu dan Pengolahan Data Grafik
  const { chartData, metrics } = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0); // Default ke awal waktu jika 'all'

    if (filter === '7d') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (filter === '30d') {
      startDate = new Date(now.setDate(now.getDate() - 30));
    } else if (filter === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Filter pesanan berdasarkan rentang waktu
    const filteredOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate;
    });

    // Kelompokkan data per hari
    const grouped = filteredOrders.reduce((acc: any, order: any) => {
      const dateStr = new Date(order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, total: 0, trxCount: 0 };
      }
      acc[dateStr].total += (order.totalAmount || 0);
      acc[dateStr].trxCount += 1;
      return acc;
    }, {});

    // Urutkan berdasarkan waktu aktual (bukan string)
    const sortedData = Object.values(grouped).sort((a: any, b: any) => {
        const dateA = new Date(a.date + ` ${new Date().getFullYear()}`);
        const dateB = new Date(b.date + ` ${new Date().getFullYear()}`);
        return dateA.getTime() - dateB.getTime();
    });

    // Hitung Metrik Cepat
    const totalOmset = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalTrx = filteredOrders.length;
    const avgTrx = totalTrx > 0 ? totalOmset / totalTrx : 0;

    return { 
      chartData: sortedData, 
      metrics: { totalOmset, totalTrx, avgTrx } 
    };
  }, [allOrders, filter]);

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Rekap Penjualan</h1>
          <p className="text-sm text-zinc-500">Analisis performa pendapatan dan transaksi unit Anda.</p>
        </div>
        
        {/* Tombol Filter Elegan */}
        <div className="flex items-center p-1 bg-zinc-100 rounded-lg border border-zinc-200 shadow-sm w-fit">
          {[
            { id: '7d', label: '7 Hari' },
            { id: '30d', label: '30 Hari' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'all', label: 'Semua' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as TimeFilter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === f.id 
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' 
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Baris Metrik (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
           <CardContent className="p-5 flex items-center justify-between">
              <div>
                 <p className="text-sm font-medium text-zinc-500 mb-1 flex items-center gap-1.5">
                    Total Omset
                 </p>
                 <p className="text-2xl font-bold text-zinc-900">{formatCurrency(metrics.totalOmset)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                 <TrendingUp className="w-5 h-5" />
              </div>
           </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
           <CardContent className="p-5 flex items-center justify-between">
              <div>
                 <p className="text-sm font-medium text-zinc-500 mb-1 flex items-center gap-1.5">
                    Jumlah Transaksi
                 </p>
                 <p className="text-2xl font-bold text-zinc-900">{metrics.totalTrx} <span className="text-sm font-normal text-zinc-500">trx</span></p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <Activity className="w-5 h-5" />
              </div>
           </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
           <CardContent className="p-5 flex items-center justify-between">
              <div>
                 <p className="text-sm font-medium text-zinc-500 mb-1 flex items-center gap-1.5">
                    Rata-rata Transaksi
                 </p>
                 <p className="text-2xl font-bold text-zinc-900">{formatCurrency(metrics.avgTrx)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                 <CreditCard className="w-5 h-5" />
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Grafik Pendapatan */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="border-b border-zinc-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
               <CardTitle className="flex items-center gap-2 text-lg">
                 <Calendar className="w-5 h-5 text-red-600" /> Tren Pendapatan
               </CardTitle>
               <CardDescription className="mt-1">
                 Grafik pergerakan omset berdasarkan filter waktu yang dipilih.
               </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          
          {chartData.length === 0 ? (
             <div className="h-[300px] flex flex-col items-center justify-center text-zinc-400">
                <Activity className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">Belum ada data transaksi pada periode ini.</p>
             </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis 
                     dataKey="date" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                     dy={10} 
                  />
                  <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: '#a1a1aa', fontSize: 12 }}
                     tickFormatter={(value) => `Rp${(value / 1000)}k`} 
                  />
                  <Tooltip 
                    cursor={{ stroke: '#dc2626', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), "Omset"]}
                    labelStyle={{ color: '#09090b', fontWeight: 'bold', marginBottom: '8px' }}
                  />
                  <Area 
                     type="monotone" 
                     dataKey="total" 
                     stroke="#dc2626" 
                     strokeWidth={3}
                     fillOpacity={1} 
                     fill="url(#colorTotal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}