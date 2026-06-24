"use client";

import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DocumentSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/auth/auth-provider";
import { expenseService } from "@/services/expense.service";
import { Expense } from "@/types/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Plus, Loader2, Calendar, TrendingDown, Trash2, ChevronDown
} from "lucide-react";

export default function AdminExpensesPage() {
  const { userData, user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "operasional",
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    description: ""
  });

  // Query dengan Typing yang Diperbaiki
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['expenses', userData?.coopId],
    queryFn: async ({ pageParam }: { pageParam?: unknown }) => {
      // [FIX] Return object harus konsisten memiliki lastVisible: undefined
      if (!userData?.coopId) return { data: [], hasMore: false, lastVisible: undefined };
      
      const res = await expenseService.getExpensesPaginated(
        userData.coopId, 
        15, 
        pageParam as DocumentSnapshot | undefined
      );

      return res;
    },
    initialPageParam: undefined as unknown as DocumentSnapshot | undefined,
    // [FIX] Sekarang aman karena lastVisible dijamin ada (bisa undefined)
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    enabled: !!userData?.coopId
  });

  const expenses = data?.pages.flatMap(p => p.data) || [];

  // Mutation: Add
  const addMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.coopId || !user) return;
      await expenseService.addExpense({
        coopId: userData.coopId,
        title: formData.title,
        amount: Number(formData.amount),
        category: formData.category as any,
        date: new Date(formData.date).toISOString(),
        description: formData.description,
        recordedBy: user.uid,
        attachmentUrl: ""
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success("Pengeluaran berhasil dicatat");
      setIsDialogOpen(false);
      setFormData({ title: "", amount: "", category: "operasional", date: new Date().toISOString().split('T')[0], description: "" });
    },
    onError: () => toast.error("Gagal mencatat pengeluaran")
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: expenseService.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success("Data dihapus");
    }
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Pengeluaran Operasional</h1>
          <p className="text-sm text-zinc-500">Catat biaya operasional untuk perhitungan laba rugi yang akurat.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" /> Catat Biaya
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Input Pengeluaran Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operasional">Operasional Harian</SelectItem>
                        <SelectItem value="gaji">Gaji & Upah</SelectItem>
                        <SelectItem value="pemeliharaan">Pemeliharaan</SelectItem>
                        <SelectItem value="aset">Pembelian Aset</SelectItem>
                        <SelectItem value="lainnya">Lain-lain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </div>
               <div className="space-y-2">
                 <Label>Judul Pengeluaran</Label>
                 <Input placeholder="Contoh: Bayar Listrik Bulan Ini" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Nominal (Rp)</Label>
                 <Input type="number" placeholder="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="font-bold" />
               </div>
               <div className="space-y-2">
                 <Label>Keterangan Tambahan</Label>
                 <Textarea placeholder="Detail..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
               </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending} className="bg-red-600 hover:bg-red-700">
                {addMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="bg-zinc-50/50 border-b">
           <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" /> Riwayat Pengeluaran
           </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
              ) : expenses.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-zinc-500">Belum ada data pengeluaran.</TableCell></TableRow>
              ) : (
                expenses.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm text-zinc-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.date).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-zinc-900">{item.title}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[200px]">{item.description}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs uppercase bg-zinc-100 px-2 py-1 rounded font-semibold text-zinc-600">{item.category}</span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={() => {
                        if(confirm('Hapus data ini?')) deleteMutation.mutate(item.id);
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {hasNextPage && (
            <div className="p-4 flex justify-center border-t">
              <Button variant="ghost" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                Muat Lebih Banyak
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}