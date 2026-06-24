"use client";

import { useState, useEffect } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { inventoryService } from "@/services/inventory.service";
import { productService } from "@/services/product.service"; // Reuse product list
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { 
  PackagePlus, ClipboardList, History, Loader2, ArrowRight
} from "lucide-react";
import { DocumentSnapshot } from "firebase/firestore";

export default function AdminInventoryPage() {
  const { userData, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("restock");
  
  // State for Product Search
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Forms
  const [restockForm, setRestockForm] = useState({ qty: "", buyPrice: "" });
  const [opnameForm, setOpnameForm] = useState({ actualQty: "", reason: "" });

  // 1. Load Products (Simple fetch all for selector)
  useEffect(() => {
    if(userData?.coopId) {
      productService.getAllProductsByCoop(userData.coopId).then(setProducts);
    }
  }, [userData]);

  // 2. Load History dengan Typing FIX
  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['movements', userData?.coopId],
    // FIX: Tipe pageParam eksplisit unknown lalu di-cast
    queryFn: async ({ pageParam }: { pageParam?: unknown }) => {
      // FIX 1: Ambil coopId ke variabel const agar TypeScript yakin tipenya string
      const coopId = userData?.coopId;
      
      // Jika tidak ada coopId, return struktur lengkap dengan lastVisible: undefined
      if (!coopId) return { data: [], hasMore: false, lastVisible: undefined };
      
      const res = await inventoryService.getMovementsPaginated(
        coopId, 
        15, 
        pageParam as DocumentSnapshot | undefined
      );

      // FIX 2: Normalisasi return value agar selalu memiliki properti lastVisible (opsional)
      // Ini menghilangkan error merah pada 'lastPage.lastVisible' di getNextPageParam
      return {
        data: res.data,
        hasMore: res.hasMore,
        lastVisible: (res as any).lastVisible as DocumentSnapshot | undefined
      };
    },
    // FIX: Initial Page Param
    initialPageParam: undefined as unknown as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    enabled: !!userData?.coopId
  });

  const movements = data?.pages.flatMap(p => p.data) || [];

  // Mutations
  const restockMutation = useMutation({
    mutationFn: async () => {
      // FIX 3: Pastikan userData.coopId ada sebelum eksekusi
      const coopId = userData?.coopId;
      if(!selectedProduct || !user || !coopId) return;
      
      await inventoryService.restockProduct(
        selectedProduct.id,
        Number(restockForm.qty),
        Number(restockForm.buyPrice),
        { coopId: coopId, performedBy: user.uid, productName: selectedProduct.name }
      );
    },
    onSuccess: () => {
      toast.success("Stok berhasil ditambahkan");
      setRestockForm({ qty: "", buyPrice: "" });
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: ['movements'] });
    },
    onError: () => toast.error("Gagal restock")
  });

  const opnameMutation = useMutation({
    mutationFn: async () => {
      // FIX 4: Pastikan userData.coopId ada sebelum eksekusi
      const coopId = userData?.coopId;
      if(!selectedProduct || !user || !coopId) return;

      await inventoryService.stockOpname(
        selectedProduct.id,
        Number(opnameForm.actualQty),
        opnameForm.reason,
        { coopId: coopId, performedBy: user.uid, productName: selectedProduct.name }
      );
    },
    onSuccess: () => {
      toast.success("Stok fisik disesuaikan");
      setOpnameForm({ actualQty: "", reason: "" });
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: ['movements'] });
    },
    onError: () => toast.error("Gagal opname")
  });

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Manajemen Stok</h1>
        <p className="text-sm text-zinc-500">Restock barang masuk, opname stok fisik, dan lihat kartu stok.</p>
      </div>

      <Tabs defaultValue="restock" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="restock">Barang Masuk</TabsTrigger>
          <TabsTrigger value="opname">Stock Opname</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
        </TabsList>

        {/* === TAB RESTOCK === */}
        <TabsContent value="restock" className="mt-6">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PackagePlus className="w-5 h-5 text-green-600"/> Restock Barang</CardTitle>
              <CardDescription>Tambah stok dari supplier. Stok produk akan bertambah otomatis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Produk</Label>
                <Select onValueChange={(id) => setSelectedProduct(products.find(p => p.id === id) || null)}>
                  <SelectTrigger><SelectValue placeholder="Cari produk..." /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedProduct && (
                <div className="p-3 bg-zinc-50 border rounded text-sm text-zinc-600 flex justify-between">
                  <span>Stok saat ini: <strong>{selectedProduct.stock}</strong></span>
                  <span>Harga Jual: <strong>{formatCurrency(selectedProduct.price)}</strong></span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Jumlah Masuk (Qty)</Label>
                   <Input type="number" placeholder="0" value={restockForm.qty} onChange={e => setRestockForm({...restockForm, qty: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <Label>Harga Beli Satuan (HPP)</Label>
                   <Input type="number" placeholder="0" value={restockForm.buyPrice} onChange={e => setRestockForm({...restockForm, buyPrice: e.target.value})} />
                </div>
              </div>

              <Button className="w-full bg-green-600 hover:bg-green-700 mt-4" disabled={!selectedProduct || restockMutation.isPending} onClick={() => restockMutation.mutate()}>
                {restockMutation.isPending ? <Loader2 className="animate-spin" /> : "Simpan Stok Masuk"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB OPNAME === */}
        <TabsContent value="opname" className="mt-6">
          <Card className="max-w-xl border-orange-200">
             <CardHeader className="bg-orange-50/50">
               <CardTitle className="flex items-center gap-2 text-orange-700"><ClipboardList className="w-5 h-5"/> Stock Opname</CardTitle>
               <CardDescription>Sesuaikan stok sistem dengan fisik. Gunakan jika ada selisih (hilang/rusak).</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4 pt-6">
               <div className="space-y-2">
                <Label>Pilih Produk</Label>
                <Select onValueChange={(id) => setSelectedProduct(products.find(p => p.id === id) || null)}>
                  <SelectTrigger><SelectValue placeholder="Cari produk..." /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} (Stok Sistem: {p.stock})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
               </div>

               {selectedProduct && (
                  <div className="flex items-center gap-4 p-4 bg-zinc-100 rounded-lg justify-center">
                     <div className="text-center">
                        <p className="text-xs text-zinc-500 uppercase">Stok Sistem</p>
                        <p className="text-2xl font-bold text-zinc-900">{selectedProduct.stock}</p>
                     </div>
                     <ArrowRight className="text-zinc-400" />
                     <div className="text-center">
                        <p className="text-xs text-zinc-500 uppercase">Stok Fisik (Input)</p>
                        <p className={`text-2xl font-bold ${opnameForm.actualQty ? 'text-blue-600' : 'text-zinc-300'}`}>
                           {opnameForm.actualQty || "?"}
                        </p>
                     </div>
                  </div>
               )}

               <div className="space-y-2">
                 <Label>Jumlah Fisik Sebenarnya</Label>
                 <Input type="number" placeholder="0" value={opnameForm.actualQty} onChange={e => setOpnameForm({...opnameForm, actualQty: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Alasan Penyesuaian</Label>
                 <Textarea placeholder="Contoh: Barang rusak saat display, atau hilang..." value={opnameForm.reason} onChange={e => setOpnameForm({...opnameForm, reason: e.target.value})} />
               </div>

               <Button className="w-full bg-orange-600 hover:bg-orange-700 mt-4" disabled={!selectedProduct || opnameMutation.isPending} onClick={() => opnameMutation.mutate()}>
                  {opnameMutation.isPending ? <Loader2 className="animate-spin" /> : "Simpan Perubahan Stok"}
               </Button>
             </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB HISTORY === */}
        <TabsContent value="history" className="mt-6">
           <Card>
             <CardHeader>
               <CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" /> Kartu Stok Global</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Tanggal</TableHead>
                     <TableHead>Produk</TableHead>
                     <TableHead>Tipe</TableHead>
                     <TableHead className="text-center">Qty</TableHead>
                     <TableHead>Stok Akhir</TableHead>
                     <TableHead>Ket.</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {movements.map((m) => (
                     <TableRow key={m.id}>
                       <TableCell className="text-xs text-zinc-500">
                         {new Date(m.createdAt).toLocaleDateString('id-ID')}
                       </TableCell>
                       <TableCell className="font-medium text-sm">{m.productName}</TableCell>
                       <TableCell>
                         <span className={`text-[10px] uppercase px-2 py-1 rounded font-bold ${
                           m.type === 'in' ? 'bg-green-100 text-green-700' : 
                           m.type === 'adjustment' ? 'bg-orange-100 text-orange-700' : 'bg-zinc-100 text-zinc-600'
                         }`}>
                           {m.type === 'in' ? 'Restock' : 'Opname'}
                         </span>
                       </TableCell>
                       <TableCell className={`text-center font-bold ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                         {m.type === 'in' ? '+' : ''}{m.type === 'adjustment' ? (m.newStock - m.previousStock > 0 ? '+' : '') : ''}
                         {m.type === 'adjustment' ? m.newStock - m.previousStock : m.quantity}
                       </TableCell>
                       <TableCell className="text-zinc-600">{m.newStock}</TableCell>
                       <TableCell className="text-xs text-zinc-500 truncate max-w-[150px]">
                         {m.reason || (m.buyPrice ? `Beli @${formatCurrency(m.buyPrice)}` : "-")}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}