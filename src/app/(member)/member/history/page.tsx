"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { DocumentSnapshot } from "firebase/firestore";
import { Calendar, FileText, Loader2, Search, ChevronDown, Filter } from "lucide-react";

import { financeService } from "@/services/finance.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export default function MemberHistoryPage() {
  const { userData } = useAuth();
  
  // Reuse fungsi pagination transaksi yang sama
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ['myHistory', userData?.uid],
    queryFn: async ({ pageParam }) => {
      if (!userData?.uid) return { data: [], hasMore: false, lastVisible: undefined };
      return await financeService.getMemberTransactionsPaginated(
        userData.uid, 
        15, // Load lebih banyak per halaman untuk history
        pageParam as DocumentSnapshot | undefined
      );
    },
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    enabled: !!userData?.uid,
  });

  const historyItems = data?.pages.flatMap((page: any) => page.data) || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Filter Sederhana */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Riwayat Aktivitas</h1>
          <p className="text-zinc-500 text-sm">Catatan lengkap transaksi dan aktivitas akun.</p>
        </div>
        {/* Placeholder Filter UI (Visual Only) */}
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input placeholder="Cari transaksi..." className="pl-9 h-9" />
           </div>
           <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
           </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
           {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg bg-white">
                 <Skeleton className="w-10 h-10 rounded-full" />
                 <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                 </div>
                 <Skeleton className="h-4 w-20" />
              </div>
           ))}
        </div>
      ) : historyItems.length === 0 ? (
        <Card className="bg-zinc-50 border-dashed shadow-none py-12">
           <CardContent className="flex flex-col items-center text-zinc-400">
              <FileText className="w-12 h-12 mb-3 opacity-20" />
              <p>Belum ada data riwayat.</p>
           </CardContent>
        </Card>
      ) : (
        <div className="space-y-0 divide-y divide-zinc-100 border rounded-lg bg-white shadow-sm overflow-hidden">
           {historyItems.map((item: any) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-zinc-50 transition-colors gap-3">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 mt-1 sm:mt-0">
                       <FileText className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="font-medium text-zinc-900 text-sm capitalize">
                          {item.notes || item.type?.replace('_', ' ') || 'Transaksi'}
                       </p>
                       <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                          <span className="flex items-center gap-1">
                             <Calendar className="w-3 h-3" />
                             {new Date(item.date || item.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                             })}
                          </span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-between sm:justify-end gap-4 pl-14 sm:pl-0">
                    <Badge variant="secondary" className="font-normal text-xs bg-zinc-100 text-zinc-600">
                       {item.type || 'Umum'}
                    </Badge>
                    <span className={`font-bold text-sm ${item.amount >= 0 ? 'text-zinc-900' : 'text-red-600'}`}>
                       {formatCurrency(item.amount)}
                    </span>
                 </div>
              </div>
           ))}
        </div>
      )}

      {/* Load More */}
      {hasNextPage && (
         <div className="flex justify-center">
            <Button 
               onClick={() => fetchNextPage()} 
               disabled={isFetchingNextPage}
               variant="outline"
               className="min-w-[150px]"
            >
               {isFetchingNextPage ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memuat...</>
               ) : (
                  <><ChevronDown className="w-4 h-4 mr-2" /> Tampilkan Lama</>
               )}
            </Button>
         </div>
      )}
    </div>
  );
}