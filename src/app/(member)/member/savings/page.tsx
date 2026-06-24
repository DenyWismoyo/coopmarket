"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { DocumentSnapshot } from "firebase/firestore";
import { Wallet, TrendingUp, History, ArrowDownLeft, ArrowUpRight, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";

import { financeService } from "@/services/finance.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default function MemberSavingsPage() {
  const { userData } = useAuth();
  
  // 1. Query Saldo (Hanya fetch sekali saat load)
  const balanceQuery = useQuery({
    queryKey: ['myBalance', userData?.uid],
    queryFn: async () => {
      if (!userData?.uid) return { pokok: 0, wajib: 0, sukarela: 0, total: 0 };
      return await financeService.getMemberBalance(userData.uid);
    },
    enabled: !!userData?.uid,
  });

  // 2. Infinite Query Riwayat Transaksi
  const transactionQuery = useInfiniteQuery({
    queryKey: ['myTransactions', userData?.uid],
    queryFn: async ({ pageParam }) => {
      if (!userData?.uid) return { data: [], hasMore: false, lastVisible: undefined };
      return await financeService.getMemberTransactionsPaginated(
        userData.uid, 
        10, 
        pageParam as DocumentSnapshot | undefined
      );
    },
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    enabled: !!userData?.uid,
  });

  const transactions = transactionQuery.data?.pages.flatMap((page: any) => page.data) || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Simpanan Saya</h1>
        <p className="text-zinc-500 text-sm">Informasi saldo dan riwayat transaksi simpanan.</p>
      </div>

      {/* --- BAGIAN 1: KARTU SALDO --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Total Saldo */}
        <Card className="bg-blue-600 text-white border-none shadow-md md:col-span-3 lg:col-span-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Wallet className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Simpanan</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceQuery.isLoading ? (
               <Skeleton className="h-10 w-48 bg-blue-400/30" />
            ) : (
               <div className="text-3xl font-bold">
                  {formatCurrency(balanceQuery.data?.total || 0)}
               </div>
            )}
            <p className="text-xs text-blue-200 mt-2">Akumulasi dari semua jenis simpanan</p>
          </CardContent>
        </Card>

        {/* Breakdown Saldo */}
        <Card>
          <CardHeader className="pb-2">
             <CardTitle className="text-xs font-medium text-zinc-500 uppercase">Simpanan Pokok</CardTitle>
          </CardHeader>
          <CardContent>
             {balanceQuery.isLoading ? <Skeleton className="h-6 w-24" /> : 
                <div className="text-lg font-bold text-zinc-800">{formatCurrency(balanceQuery.data?.pokok || 0)}</div>
             }
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
             <CardTitle className="text-xs font-medium text-zinc-500 uppercase">Simpanan Wajib</CardTitle>
          </CardHeader>
          <CardContent>
             {balanceQuery.isLoading ? <Skeleton className="h-6 w-24" /> : 
                <div className="text-lg font-bold text-zinc-800">{formatCurrency(balanceQuery.data?.wajib || 0)}</div>
             }
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
             <CardTitle className="text-xs font-medium text-zinc-500 uppercase">Simpanan Sukarela</CardTitle>
          </CardHeader>
          <CardContent>
             {balanceQuery.isLoading ? <Skeleton className="h-6 w-24" /> : 
                <div className="text-lg font-bold text-zinc-800">{formatCurrency(balanceQuery.data?.sukarela || 0)}</div>
             }
          </CardContent>
        </Card>
      </div>

      {/* --- BAGIAN 2: RIWAYAT TRANSAKSI (Infinite Scroll) --- */}
      <div className="pt-4">
        <h2 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2">
           <History className="w-5 h-5" /> Riwayat Mutasi
        </h2>

        {transactionQuery.isLoading ? (
           <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
           </div>
        ) : transactions.length === 0 ? (
           <Card className="border-dashed bg-zinc-50/50">
              <CardContent className="flex flex-col items-center justify-center py-8 text-zinc-400">
                 <History className="w-10 h-10 mb-2 opacity-20" />
                 <p className="text-sm">Belum ada riwayat transaksi</p>
              </CardContent>
           </Card>
        ) : (
           <div className="space-y-3">
              {transactions.map((tx: any) => (
                 <Card key={tx.id} className="border-zinc-100 hover:border-blue-100 transition-colors">
                    <div className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                             tx.amount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                             {tx.amount >= 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                             <p className="font-medium text-zinc-900 capitalize text-sm">
                                {tx.type?.replace('_', ' ') || 'Transaksi'}
                             </p>
                             <p className="text-xs text-zinc-500">
                                {new Date(tx.date || tx.createdAt).toLocaleDateString('id-ID', {
                                   day: 'numeric', month: 'short', year: 'numeric'
                                })}
                             </p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`font-bold text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {tx.amount >= 0 ? '+' : ''} {formatCurrency(tx.amount)}
                          </p>
                          <Badge variant="outline" className="text-[10px] h-5 border-zinc-200 text-zinc-500">
                             Berhasil
                          </Badge>
                       </div>
                    </div>
                 </Card>
              ))}

              {/* Load More Button */}
              {transactionQuery.hasNextPage && (
                 <div className="flex justify-center pt-4">
                    <Button 
                       variant="ghost" 
                       size="sm"
                       onClick={() => transactionQuery.fetchNextPage()}
                       disabled={transactionQuery.isFetchingNextPage}
                       className="text-zinc-500"
                    >
                       {transactionQuery.isFetchingNextPage ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memuat...</>
                       ) : (
                          <><ChevronDown className="w-4 h-4 mr-2" /> Tampilkan Lebih Banyak</>
                       )}
                    </Button>
                 </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
}