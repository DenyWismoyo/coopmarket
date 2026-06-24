"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { financeService } from "@/services/finance.service";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy, DocumentSnapshot } from "firebase/firestore";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Wallet, ArrowUpCircle, ArrowDownCircle, Loader2, History, Banknote, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { UserProfile } from "@/types/user";

export default function AdminSavingsPage() {
  const { user, userData } = useAuth();
  const queryClient = useQueryClient();
  
  // State Data Total Aset (Tetap fetch sekali di awal)
  const [totalAssets, setTotalAssets] = useState(0);
  const [loadingAssets, setLoadingAssets] = useState(true);
  
  // State Search Member
  const [searchQuery, setSearchQuery] = useState("");
  const [memberResults, setMemberResults] = useState<UserProfile[]>([]);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  
  // State Form Transaksi
  const [transType, setTransType] = useState<"pokok" | "wajib" | "sukarela">("wajib");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isDeposit, setIsDeposit] = useState(true); // True = Setor, False = Tarik
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // 1. QUERY: Fetch Transactions Pagination (IMPLEMENTASI BARU)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingTransactions,
  } = useInfiniteQuery({
    queryKey: ['adminSavings', userData?.coopId],
    queryFn: async ({ pageParam }) => {
      if (!userData?.coopId) return { data: [], hasMore: false, lastVisible: undefined };
      
      // Fetch 10 item per load agar ringan untuk input data
      return await financeService.getTransactionsByCoopPaginated(
        userData.coopId, 
        10, 
        pageParam as DocumentSnapshot | undefined
      );
    },
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    enabled: !!userData?.coopId,
  });

  const transactions = data?.pages.flatMap((page) => page.data) || [];

  // 2. Fetch Total Assets
  useEffect(() => {
    async function fetchAssets() {
      if (userData?.coopId) {
        setLoadingAssets(true);
        try {
            const assets = await financeService.getCoopTotalAssets(userData.coopId);
            setTotalAssets(assets);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingAssets(false);
        }
    }
  };
    fetchAssets();
  }, [userData]);

  // 3. Pencarian Member Real-time
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2 && userData?.coopId) {
        try {
            const q = query(
                collection(db, "users"),
                where("coopId", "==", userData.coopId),
                where("role", "==", "member"),
                orderBy("fullName"),
                limit(5)
            );
            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
            const filtered = results.filter(r => r.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
            setMemberResults(filtered);
        } catch (e) {
            console.error(e);
        }
      } else {
        setMemberResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, userData]);

  const handleTransaction = async () => {
    if (!selectedMember || !user || !userData?.coopId) return;
    if (!amount || parseInt(amount) <= 0) {
        toast.error("Jumlah nominal harus valid");
        return;
    }

    setProcessing(true);
    try {
        const value = parseInt(amount);
        const finalAmount = isDeposit ? value : -value;

        await financeService.addTransaction({
            userId: selectedMember.uid,
            userName: selectedMember.fullName,
            coopId: userData.coopId,
            type: transType,
            amount: finalAmount,
            notes: notes || (isDeposit ? "Setoran Tunai" : "Penarikan Tunai"),
            adminId: user.uid
        });

        toast.success("Transaksi berhasil dicatat!");
        setIsDialogOpen(false);
        
        // Reset Form
        setAmount("");
        setNotes("");
        setSearchQuery("");
        setSelectedMember(null);
        
        // REFRESH DATA (Penting: Invalidate Query agar data baru muncul & total aset update)
        queryClient.invalidateQueries({ queryKey: ['adminSavings'] });
        
        // Update Total Assets secara manual optimis atau fetch ulang
        setTotalAssets(prev => prev + finalAmount); 

    } catch (error) {
        toast.error("Gagal mencatat transaksi");
    } finally {
        setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Total Aset */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-zinc-900">Keuangan Anggota</h1>
            <p className="text-sm text-zinc-500">Kelola simpanan di unit {userData?.coopName}.</p>
        </div>
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white border-none shadow-lg min-w-[250px]">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full">
                    <Banknote className="w-6 h-6 text-white" />
                </div>
                <div>
                    <p className="text-xs text-green-100 uppercase font-medium">Total Aset Unit</p>
                    {loadingAssets ? (
                      <SkeletonLoader className="h-6 w-24 bg-white/20 mt-1" />
                    ) : (
                      <p className="text-xl font-bold">{formatCurrency(totalAssets)}</p>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: Form Input Transaksi */}
        <Card className="lg:col-span-1 h-fit border-t-4 border-t-blue-600 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Wallet className="w-4 h-4 text-blue-600" /> Input Transaksi
                </CardTitle>
                <CardDescription>Cari anggota unit untuk mulai transaksi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                
                {/* 1. Cari Member */}
                <div className="space-y-2">
                    <Label>Cari Anggota</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input 
                            placeholder="Ketik Nama..." 
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!e.target.value) setSelectedMember(null);
                            }}
                        />
                        {/* Dropdown Hasil Pencarian */}
                        {searchQuery.length > 2 && memberResults.length > 0 && !selectedMember && (
                            <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                                {memberResults.map(m => (
                                    <div 
                                        key={m.uid} 
                                        className="p-3 hover:bg-zinc-50 cursor-pointer border-b last:border-0"
                                        onClick={() => {
                                            setSelectedMember(m);
                                            setSearchQuery(m.fullName);
                                            setMemberResults([]);
                                        }}
                                    >
                                        <p className="text-sm font-medium text-zinc-900">{m.fullName}</p>
                                        <p className="text-xs text-zinc-500">{m.nik || m.email}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Detail & Aksi */}
                {selectedMember ? (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-zinc-500 mb-1">Transaksi untuk:</p>
                            <p className="font-bold text-blue-800">{selectedMember.fullName}</p>
                            <p className="text-xs text-blue-600">{selectedMember.phone || selectedMember.email}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                className="w-full bg-green-600 hover:bg-green-700" 
                                onClick={() => { setIsDeposit(true); setIsDialogOpen(true); }}
                            >
                                <ArrowUpCircle className="w-4 h-4 mr-2" /> Setor
                            </Button>
                            <Button 
                                className="w-full bg-orange-600 hover:bg-orange-700" 
                                onClick={() => { setIsDeposit(false); setIsDialogOpen(true); }}
                            >
                                <ArrowDownCircle className="w-4 h-4 mr-2" /> Tarik
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 text-zinc-400 text-sm italic bg-zinc-50 rounded-lg border border-dashed">
                        Pilih anggota terlebih dahulu.
                    </div>
                )}
            </CardContent>
        </Card>

        {/* KOLOM KANAN: Riwayat Transaksi (PAGINATION) */}
        <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="border-b bg-zinc-50/50 pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-2">
                        <History className="w-4 h-4 text-zinc-500" /> Mutasi Terakhir
                    </CardTitle>
                    {/* Indikator jumlah data yang sudah dimuat */}
                    <span className="text-xs text-zinc-500 bg-white px-2 py-1 rounded border">
                        {transactions.length} Data Dimuat
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Tanggal</TableHead>
                            <TableHead>Anggota</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Ket.</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingTransactions ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto text-zinc-300"/></TableCell></TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-12 text-zinc-500">Belum ada transaksi.</TableCell></TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="text-xs text-zinc-500">
                                        {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-'}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                        {tx.userName || "Anggota"}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                                            tx.type === 'wajib' ? 'bg-blue-100 text-blue-700' :
                                            tx.type === 'pokok' ? 'bg-purple-100 text-purple-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {tx.type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-zinc-500 truncate max-w-[150px]" title={tx.notes}>
                                        {tx.notes || "-"}
                                    </TableCell>
                                    <TableCell className={`text-right font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {tx.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* LOAD MORE BUTTON */}
                {hasNextPage && (
                  <div className="flex justify-center py-4 border-t border-zinc-100">
                     <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => fetchNextPage()} 
                        disabled={isFetchingNextPage}
                        className="text-zinc-500 hover:text-blue-600"
                     >
                        {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                        Muat Lebih Banyak
                     </Button>
                  </div>
                )}
            </CardContent>
        </Card>
      </div>

      {/* Dialog Konfirmasi Transaksi */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className={isDeposit ? "text-green-600" : "text-orange-600"}>
                    {isDeposit ? "Form Setoran Tunai" : "Form Penarikan Tunai"}
                </DialogTitle>
                <DialogDescription>
                    Pastikan uang tunai sudah {isDeposit ? "diterima dari" : "diserahkan ke"} <strong>{selectedMember?.fullName}</strong>.
                </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Jenis Simpanan</Label>
                        <Select value={transType} onValueChange={(val: any) => setTransType(val)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="wajib">Wajib</SelectItem>
                                <SelectItem value="sukarela">Sukarela</SelectItem>
                                <SelectItem value="pokok">Pokok</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Nominal (Rp)</Label>
                        <Input 
                            type="number" 
                            placeholder="0"
                            className="font-bold text-lg"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Catatan (Opsional)</Label>
                    <Textarea 
                        placeholder="Contoh: Setoran bulan Januari..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="resize-none h-20"
                    />
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={processing}>Batal</Button>
                <Button 
                    onClick={handleTransaction} 
                    disabled={processing} 
                    className={isDeposit ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}
                >
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wallet className="w-4 h-4 mr-2" />}
                    Konfirmasi {isDeposit ? "Setoran" : "Penarikan"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple Skeleton untuk loading aset
function SkeletonLoader({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-zinc-200 ${className}`} />;
}