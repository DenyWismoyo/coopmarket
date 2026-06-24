"use client";

import { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DocumentSnapshot } from "firebase/firestore";
import { 
  Plus, 
  Search, 
  Loader2, 
  Package, 
  MoreVertical, 
  Edit, 
  Trash2, 
  ChevronDown,
  AlertCircle,
  Store,
  Monitor,
  Eye,
  EyeOff,
  ShoppingBag,
  User,
  Building2
} from "lucide-react";
import { toast } from "sonner";

// Imports
import { productService } from "@/services/product.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default function AdminProductsPage() {
  const { userData } = useAuth();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. QUERY: Fetch Produk Pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['adminProducts', userData?.coopId],
    queryFn: async ({ pageParam }) => {
      if (!userData?.coopId) return { data: [], hasMore: false, lastVisible: undefined };
      
      return await productService.getAllProductsByCoopPaginated(
        userData.coopId, 
        20, 
        pageParam as DocumentSnapshot | undefined
      );
    },
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastVisible : undefined,
    enabled: !!userData?.coopId,
  });

  const products = data?.pages.flatMap((page: any) => page.data) || [];

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) // Bisa cari nama pemilik juga
  );

  // 2. MUTATION: Update Visibility (Dual Status)
  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ id, mpStatus, posStatus }: { id: string, mpStatus?: string, posStatus?: boolean }) => {
      const payload: any = {};
      if (mpStatus !== undefined) payload.marketplaceStatus = mpStatus;
      if (posStatus !== undefined) payload.isPosActive = posStatus;
      
      await productService.updateProduct(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast.success("Status visibilitas diperbarui");
    },
    onError: (err: any) => {
      toast.error("Gagal update: " + err.message);
    }
  });

  // 3. MUTATION: Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await productService.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast.success("Produk dihapus");
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Helper untuk Status Badge
  const getStatusConfig = (product: any) => {
    const isMpActive = product.marketplaceStatus === 'published_marketplace';
    const isPosActive = product.isPosActive !== false; 

    if (isMpActive && isPosActive) return { label: 'Full Online & POS', color: 'bg-green-100 text-green-700 border-green-200' };
    if (isMpActive && !isPosActive) return { label: 'Marketplace Only', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (!isMpActive && isPosActive) return { label: 'POS / Kasir Only', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    return { label: 'Draft / Hidden', color: 'bg-zinc-100 text-zinc-500 border-zinc-200' };
  };

  // --- RENDER ---

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
           {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  if (isError) return <div className="p-8 text-center text-red-500">Error: {(error as Error).message}</div>;

  return (
    <div className="space-y-6 p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Manajemen Produk</h1>
          <p className="text-sm text-zinc-500">Atur katalog produk, stok, dan visibilitas marketplace/kasir.</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Tambah Produk
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm max-w-md">
         <Search className="w-4 h-4 text-zinc-400 ml-2" />
         <Input 
           placeholder="Cari nama produk, kategori, atau pemilik..." 
           className="border-none shadow-none focus-visible:ring-0 h-9"
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
         />
      </div>

      {/* Table Content */}
      <Card className="overflow-hidden border-zinc-200 shadow-sm">
         <div className="overflow-x-auto">
           <Table>
             <TableHeader className="bg-zinc-50">
               <TableRow>
                 <TableHead className="w-[80px]">Gambar</TableHead>
                 <TableHead>Nama Produk</TableHead>
                 <TableHead>Pemilik</TableHead> {/* KOLOM BARU */}
                 <TableHead>Kategori</TableHead>
                 <TableHead>Harga & Stok</TableHead>
                 <TableHead className="w-[200px]">Status & Visibilitas</TableHead>
                 <TableHead className="text-right">Aksi</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredProducts.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                      Tidak ada produk ditemukan.
                   </TableCell>
                 </TableRow>
               ) : (
                 filteredProducts.map((product: any) => {
                   const statusConfig = getStatusConfig(product);
                   const isMpActive = product.marketplaceStatus === 'published_marketplace';
                   const isPosActive = product.isPosActive !== false;
                   
                   // Logika Cek Pemilik
                   // Jika sellerId sama dengan coopId Admin yang login, berarti produk koperasi
                   const isCoopProduct = product.sellerId === userData?.coopId;

                   return (
                     <TableRow key={product.id} className="hover:bg-zinc-50/50">
                       <TableCell>
                         <div className="w-12 h-12 rounded-md bg-zinc-100 border overflow-hidden relative">
                            {product.images?.[0] ? (
                               <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                  <Package className="w-5 h-5" />
                               </div>
                            )}
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="font-medium text-zinc-900">{product.name}</div>
                         <div className="text-xs text-zinc-500 truncate max-w-[200px]">{product.id}</div>
                       </TableCell>
                       
                       {/* CELL PEMILIK */}
                       <TableCell>
                         {isCoopProduct ? (
                           <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100 gap-1 pl-1">
                             <Building2 className="w-3 h-3" /> Koperasi
                           </Badge>
                         ) : (
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                                <User className="w-3 h-3" />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-xs font-medium text-zinc-700">
                                   {product.sellerName || 'Member'}
                                </span>
                                <span className="text-[10px] text-zinc-400">Titip Jual</span>
                             </div>
                           </div>
                         )}
                       </TableCell>

                       <TableCell>
                         <Badge variant="outline" className="font-normal text-zinc-600 bg-zinc-50">
                            {product.category}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <div className="font-medium">{formatCurrency(product.price)}</div>
                         <div className={`text-xs ${product.stock < 5 ? 'text-red-500 font-bold' : 'text-zinc-500'}`}>
                            Stok: {product.stock}
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="space-y-1.5">
                            {/* Dual Status Indicator */}
                            <div className="flex items-center gap-2 text-xs">
                               <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${isMpActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}`} title="Status Marketplace">
                                  <Store className="w-3 h-3" /> {isMpActive ? 'Online' : 'Off'}
                               </div>
                               <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${isPosActive ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}`} title="Status Kasir">
                                  <Monitor className="w-3 h-3" /> {isPosActive ? 'POS' : 'Off'}
                               </div>
                            </div>
                         </div>
                       </TableCell>
                       <TableCell className="text-right">
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                               <MoreVertical className="w-4 h-4 text-zinc-400" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-56">
                             <DropdownMenuLabel>Atur Produk</DropdownMenuLabel>
                             <DropdownMenuItem asChild>
                               <Link href={`/admin/products/${product.id}`} className="cursor-pointer">
                                  <Edit className="w-4 h-4 mr-2" /> Edit Detail
                               </Link>
                             </DropdownMenuItem>
                             
                             <DropdownMenuSeparator />
                             <DropdownMenuLabel className="text-xs text-zinc-400 font-normal">Visibilitas</DropdownMenuLabel>
                             
                             <DropdownMenuCheckboxItem 
                                checked={isMpActive}
                                onCheckedChange={(checked) => updateVisibilityMutation.mutate({
                                   id: product.id,
                                   mpStatus: checked ? 'published_marketplace' : 'offline'
                                })}
                             >
                                <span className="flex items-center gap-2">
                                   <Store className="w-3 h-3" /> Tampil di Marketplace
                                </span>
                             </DropdownMenuCheckboxItem>
                             
                             <DropdownMenuCheckboxItem 
                                checked={isPosActive}
                                onCheckedChange={(checked) => updateVisibilityMutation.mutate({
                                   id: product.id,
                                   posStatus: checked
                                })}
                             >
                                <span className="flex items-center gap-2">
                                   <Monitor className="w-3 h-3" /> Tampil di Kasir (POS)
                                </span>
                             </DropdownMenuCheckboxItem>

                             <DropdownMenuSeparator />
                             <DropdownMenuItem 
                               className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                               onClick={() => setDeleteId(product.id)}
                             >
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
         </div>
      </Card>
      
      {/* Footer / Load More */}
      <div className="flex justify-center pt-4">
         {hasNextPage ? (
            <Button 
               variant="outline" 
               onClick={() => fetchNextPage()} 
               disabled={isFetchingNextPage}
            >
               {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
               Muat Lebih Banyak
            </Button>
         ) : (
            <p className="text-xs text-zinc-400">Total {products.length} produk ditampilkan.</p>
         )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Produk akan dihapus permanen dari database. Stok dan riwayat akan terpengaruh jika data tidak sinkron.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}