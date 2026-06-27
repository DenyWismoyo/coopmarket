"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DocumentSnapshot } from "firebase/firestore";
import { 
   Plus, Search, Loader2, Package, MoreVertical, Edit, 
   Trash2, ChevronDown, Store, Monitor, AlertTriangle, Layers, Gift
} from "lucide-react";
import { toast } from "sonner";

import { productService } from "@/services/product.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default function AdminUnitProductsPage() {
  const { userData } = useAuth();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("satuan");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ['adminProducts', userData?.coopId],
    queryFn: async ({ pageParam }) => {
      if (!userData?.coopId) return { data: [], hasMore: false, lastVisible: undefined };
      return await productService.getAllProductsByCoopPaginated(
        userData.coopId, 50, pageParam as DocumentSnapshot | undefined
      );
    },
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    enabled: !!userData?.coopId,
  });

  const allProducts = data?.pages.flatMap((page: any) => page.data) || [];

  // Filter 1: Produk Satuan (Milik Unit & Bukan Bundle)
  const unitProducts = useMemo(() => {
    return allProducts.filter((p: any) => 
      p.sellerId === userData?.coopId && !p.isBundle &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allProducts, searchQuery, userData]);

  // Filter 2: Paket Bundling (Berlaku sebagai aset unit)
  const bundleProducts = useMemo(() => {
    return allProducts.filter((p: any) => 
      p.isBundle === true &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allProducts, searchQuery]);

  const stats = useMemo(() => {
    let lowStock = 0;
    unitProducts.forEach((p: any) => { if (p.stock < 5 && !p.hasVariants) lowStock++; });
    return { satuan: unitProducts.length, bundle: bundleProducts.length, lowStock };
  }, [unitProducts, bundleProducts]);

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ id, mpStatus, posStatus }: { id: string, mpStatus?: string, posStatus?: boolean }) => {
      await productService.updateProduct(id, {
         ...(mpStatus !== undefined && { marketplaceStatus: mpStatus }),
         ...(posStatus !== undefined && { isPosActive: posStatus })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast.success("Status visibilitas diperbarui");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast.success("Produk dihapus");
      setDeleteId(null);
    }
  });

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;

  // Fungsi Render Tabel (Agar rapi bisa dipakai ulang untuk satuan & bundle)
  const renderTable = (productsData: any[]) => (
     <Table>
       <TableHeader className="bg-zinc-50">
         <TableRow>
           <TableHead className="w-[80px]">Gambar</TableHead>
           <TableHead>Info Produk</TableHead>
           <TableHead>Harga & Stok</TableHead>
           <TableHead className="w-[200px]">Visibilitas</TableHead>
           <TableHead className="text-right">Aksi</TableHead>
         </TableRow>
       </TableHeader>
       <TableBody>
         {productsData.length === 0 ? (
           <TableRow><TableCell colSpan={5} className="h-32 text-center text-zinc-500">Data tidak ditemukan.</TableCell></TableRow>
         ) : (
           productsData.map((product: any) => {
             const isMpActive = product.marketplaceStatus === 'published_marketplace';
             const isPosActive = product.isPosActive !== false;
             return (
               <TableRow key={product.id} className="hover:bg-zinc-50/50">
                 <TableCell>
                   <div className="w-12 h-12 rounded-md bg-zinc-100 border overflow-hidden relative">
                      {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 m-auto mt-3 text-zinc-300" />}
                   </div>
                 </TableCell>
                 <TableCell>
                   <div className="font-bold text-zinc-900 flex items-center gap-2">
                      {product.name}
                      {product.isBundle && <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 h-5 px-1.5 text-[10px]">BUNDLE</Badge>}
                   </div>
                   <div className="text-xs text-zinc-500 mt-1">{product.category}</div>
                   {product.isBundle && product.bundleItems && (
                      <div className="text-[10px] text-zinc-400 mt-1">Berisi {product.bundleItems.length} item.</div>
                   )}
                 </TableCell>
                 <TableCell>
                   <div className="font-bold text-blue-600">{formatCurrency(product.price)}</div>
                   <div className={`text-xs ${product.stock < 5 ? 'text-red-600 font-bold' : 'text-zinc-500'}`}>Stok: {product.stock}</div>
                 </TableCell>
                 <TableCell>
                   <div className="flex flex-wrap gap-1.5 text-xs">
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${isMpActive ? 'bg-blue-50 text-blue-700' : 'bg-zinc-50 text-zinc-400'}`}><Store className="w-3 h-3" /> Online</div>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${isPosActive ? 'bg-orange-50 text-orange-700' : 'bg-zinc-50 text-zinc-400'}`}><Monitor className="w-3 h-3" /> POS</div>
                   </div>
                 </TableCell>
                 <TableCell className="text-right">
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                       <DropdownMenuItem asChild>
                         <Link href={`/admin/unit-products/${product.id}`}><Edit className="w-4 h-4 mr-2" /> Edit Produk</Link>
                       </DropdownMenuItem>
                       <DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem checked={isMpActive} onCheckedChange={(c) => updateVisibilityMutation.mutate({ id: product.id, mpStatus: c ? 'published_marketplace' : 'offline' })}>
                          <Store className="w-3 h-3 mr-2" /> Tampil di Marketplace
                       </DropdownMenuCheckboxItem>
                       <DropdownMenuCheckboxItem checked={isPosActive} onCheckedChange={(c) => updateVisibilityMutation.mutate({ id: product.id, posStatus: c })}>
                          <Monitor className="w-3 h-3 mr-2" /> Tampil di POS
                       </DropdownMenuCheckboxItem>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem className="text-red-600 focus:bg-red-50 cursor-pointer" onClick={() => setDeleteId(product.id)}>
                         <Trash2 className="w-4 h-4 mr-2" /> Hapus Produk
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                 </TableCell>
               </TableRow>
             );
           })
         )}
       </TableBody>
     </Table>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Produk Internal Unit</h1>
          <p className="text-sm text-zinc-500">Kelola inventaris murni milik unit dan rangkai Paket Bundling.</p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button className="bg-red-600 hover:bg-red-700 font-bold shadow-md">
               <Plus className="w-4 h-4 mr-2" /> Tambah Data <ChevronDown className="w-4 h-4 ml-2" />
             </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
             <DropdownMenuItem asChild className="cursor-pointer py-2">
                <Link href="/admin/unit-products/new"><Package className="w-4 h-4 mr-2 text-blue-600"/> Produk Satuan</Link>
             </DropdownMenuItem>
             <DropdownMenuItem asChild className="cursor-pointer py-2">
                <Link href="/admin/unit-products/new-bundle"><Gift className="w-4 h-4 mr-2 text-purple-600"/> Paket Bundling</Link>
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-3 gap-4">
         <Card className="shadow-sm border-zinc-200">
            <CardContent className="p-4 flex items-center justify-between">
               <div><p className="text-xs font-medium text-zinc-500">Produk Satuan</p><p className="text-2xl font-bold">{stats.satuan}</p></div>
               <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package className="w-5 h-5"/></div>
            </CardContent>
         </Card>
         <Card className="shadow-sm border-zinc-200 border-l-4 border-l-purple-500">
            <CardContent className="p-4 flex items-center justify-between">
               <div><p className="text-xs font-medium text-purple-600">Paket Bundling</p><p className="text-2xl font-bold">{stats.bundle}</p></div>
               <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Gift className="w-5 h-5"/></div>
            </CardContent>
         </Card>
         <Card className={`shadow-sm border-zinc-200 ${stats.lowStock > 0 ? 'border-l-4 border-l-red-500' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between">
               <div><p className="text-xs font-medium text-zinc-500">Stok Menipis (&lt;5)</p><p className={`text-2xl font-bold ${stats.lowStock > 0 ? 'text-red-600' : 'text-zinc-900'}`}>{stats.lowStock}</p></div>
               <div className={`p-2 rounded-lg ${stats.lowStock > 0 ? 'bg-red-50 text-red-600' : 'bg-zinc-50 text-zinc-400'}`}><AlertTriangle className="w-5 h-5"/></div>
            </CardContent>
         </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <TabsList className="bg-zinc-100 p-1">
               <TabsTrigger value="satuan" className="data-[state=active]:bg-white data-[state=active]:shadow-sm"><Package className="w-4 h-4 mr-2"/> Produk Satuan</TabsTrigger>
               <TabsTrigger value="bundle" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"><Gift className="w-4 h-4 mr-2"/> Paket Bundling</TabsTrigger>
            </TabsList>
            <div className="relative w-full md:w-64">
               <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
               <Input placeholder="Cari nama..." className="pl-9 bg-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
         </div>

         <TabsContent value="satuan" className="mt-0">
            <Card className="overflow-hidden border-zinc-200 shadow-sm"><div className="overflow-x-auto">{renderTable(unitProducts)}</div></Card>
         </TabsContent>
         
         <TabsContent value="bundle" className="mt-0">
            <Card className="overflow-hidden border-zinc-200 shadow-sm border-t-4 border-t-purple-500"><div className="overflow-x-auto">{renderTable(bundleProducts)}</div></Card>
         </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-red-600">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}