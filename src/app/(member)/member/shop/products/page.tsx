"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { productService } from "@/services/product.service";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { 
  Plus, 
  Loader2, 
  Package, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  AlertCircle,
  Layers,
  Send,
  CheckCircle2,
  XCircle,
  Power
} from "lucide-react";

export default function MemberProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    if (user) {
      setLoading(true);
      try {
        const data = await productService.getSellerProducts(user.uid);
        setProducts(data);
      } catch (error) {
        console.error(error);
        toast.error("Gagal memuat daftar produk");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  // Aksi: Hapus Produk
  const handleDelete = async (id: string) => {
    if(confirm("Yakin ingin menghapus produk ini? Tindakan ini tidak bisa dibatalkan.")) {
      try {
        await productService.deleteProduct(id);
        toast.success("Produk berhasil dihapus");
        fetchProducts();
      } catch(e) {
        toast.error("Gagal menghapus produk");
      }
    }
  };

  // Aksi: Toggle Status Aktif (Untuk Kasir POS Member)
  const toggleActiveStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan';
    
    try {
      // Optimistic Update untuk UI yang lebih cepat
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, status: newStatus } : p
      ));

      await productService.updateProduct(product.id, {
        status: newStatus
      } as any);
      
      toast.success(`Produk berhasil ${action} di POS Member`);
    } catch(e) {
      toast.error(`Gagal mengubah status produk`);
      fetchProducts(); // Revert jika gagal
    }
  };

  // Aksi: Ajukan Validasi ke Admin (Untuk Marketplace)
  const handleRequestValidation = async (product: Product) => {
    if(!confirm("Ajukan produk ini untuk ditayangkan di Marketplace Umum? Admin akan meninjau produk Anda.")) return;
    try {
      await productService.updateProduct(product.id, {
        marketplaceStatus: 'pending_review'
      } as any);
      toast.success("Permintaan validasi dikirim ke Admin");
      fetchProducts();
    } catch(e) {
      toast.error("Gagal mengajukan validasi");
    }
  };

  // Helper: Status Badge Marketplace
  const renderMarketplaceStatus = (status: string, reason?: string | null) => {
    switch (status) {
      case 'published_marketplace':
        return <Badge className="bg-green-600 hover:bg-green-700 h-6">Tayang</Badge>;
      case 'pending_review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 h-6">Review Admin</Badge>;
      case 'rejected':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="destructive" className="flex items-center gap-1 cursor-help h-6">
                  <AlertCircle className="w-3 h-3" /> Ditolak
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Alasan: {reason || "Tidak sesuai ketentuan"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return <Badge variant="outline" className="text-zinc-400 border-zinc-200 h-6">Draft / Offline</Badge>;
    }
  };

  // Helper: Status POS Admin
  const renderAdminPosStatus = (isActive?: boolean) => {
    if (isActive) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit border border-green-100">
           <CheckCircle2 className="w-3.5 h-3.5" />
           <span className="font-medium">Diizinkan Admin</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full w-fit border border-zinc-200">
         <XCircle className="w-3.5 h-3.5" />
         <span>Tidak Aktif</span>
      </div>
    );
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Manajemen Produk</h1>
          <p className="text-sm text-zinc-500">
            Kelola data produk untuk Toko Pribadi dan pengajuan Marketplace.
          </p>
        </div>
        <Link href="/member/shop/products/new">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Tambah Produk
          </Button>
        </Link>
      </div>

      {/* Table Container */}
      <Card>
        <CardHeader className="pb-3 border-b">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-base font-semibold">Daftar Produk ({filteredProducts.length})</CardTitle>
              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input 
                    placeholder="Cari nama produk..." 
                    className="pl-9 bg-white h-9 text-sm" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-zinc-500">Memuat data produk...</p>
             </div>
          ) : filteredProducts.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                   <Package className="h-6 w-6 text-zinc-400" />
                </div>
                <h3 className="font-semibold text-zinc-900">Belum ada produk</h3>
                <p className="text-zinc-500 text-sm mb-4 max-w-sm">
                   Tambahkan produk pertama Anda untuk mulai berjualan.
                </p>
                <Link href="/member/shop/products/new">
                   <Button variant="outline" size="sm">Tambah Produk Pertama</Button>
                </Link>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b">
                   <tr>
                      <th className="px-4 py-3 font-medium">Info Produk</th>
                      <th className="px-4 py-3 font-medium">Harga & Stok</th>
                      <th className="px-4 py-3 font-medium">Status Marketplace</th>
                      <th className="px-4 py-3 font-medium">Status POS Admin</th>
                      <th className="px-4 py-3 font-medium text-center">Status POS Member</th>
                      <th className="px-4 py-3 font-medium text-right">Aksi</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                   {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors group">
                         {/* Kolom 1: Info Produk */}
                         <td className="px-4 py-3">
                            <div className="flex gap-3">
                               <div className="relative w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                                  {product.images?.[0] ? (
                                    <Image 
                                        src={product.images[0]} 
                                        alt={product.name} 
                                        fill 
                                        className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full text-zinc-300">
                                        <Package className="w-5 h-5" />
                                    </div>
                                  )}
                               </div>
                               <div className="flex flex-col justify-center max-w-[200px]">
                                  <p className="font-medium text-zinc-900 truncate" title={product.name}>
                                     {product.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                     <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded capitalize">
                                        {product.category}
                                     </span>
                                  </div>
                               </div>
                            </div>
                         </td>

                         {/* Kolom 2: Harga & Stok */}
                         <td className="px-4 py-3">
                            <div className="flex flex-col">
                               <span className="font-bold text-zinc-900">{formatCurrency(product.price)}</span>
                               <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                                  {product.hasVariants ? (
                                     <>
                                        <Layers className="w-3 h-3 text-purple-500" />
                                        <span>Varian Aktif</span>
                                     </>
                                  ) : (
                                     <span className={product.stock > 0 ? "text-zinc-600" : "text-red-600 font-medium"}>
                                        Stok: {product.stock}
                                     </span>
                                  )}
                               </div>
                            </div>
                         </td>

                         {/* Kolom 3: Status Marketplace */}
                         <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 items-start">
                               {renderMarketplaceStatus(product.marketplaceStatus || 'draft', product.rejectionReason)}
                               
                               {/* Tombol Ajukan (Jika belum tayang/pending) */}
                               {['draft', 'rejected', 'inactive'].includes(product.marketplaceStatus || 'draft') && (
                                  <button 
                                     onClick={() => handleRequestValidation(product)}
                                     className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-1 font-medium"
                                  >
                                     <Send className="w-3 h-3" /> Ajukan Tayang
                                  </button>
                               )}
                            </div>
                         </td>

                         {/* Kolom 4: Status POS Admin (Read Only) */}
                         <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                                {renderAdminPosStatus(product.isPosActive)}
                                <span className="text-[10px] text-zinc-400">Dikelola oleh Admin</span>
                            </div>
                         </td>

                         {/* Kolom 5: Status POS Member (Kustomisasi Member) */}
                         <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                                <button
                                    onClick={() => toggleActiveStatus(product)}
                                    title={product.status === 'active' ? "Nonaktifkan di POS" : "Aktifkan di POS"}
                                    className={`
                                        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
                                        ${product.status === 'active' ? 'bg-blue-600' : 'bg-zinc-200'}
                                    `}
                                >
                                    <span className="sr-only">Toggle POS</span>
                                    <span
                                        aria-hidden="true"
                                        className={`
                                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                            ${product.status === 'active' ? 'translate-x-5' : 'translate-x-0'}
                                        `}
                                    />
                                </button>
                                <span className={`text-[10px] font-medium ${product.status === 'active' ? 'text-blue-600' : 'text-zinc-400'}`}>
                                    {product.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                         </td>

                         {/* Kolom 6: Aksi */}
                         <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900">
                                     <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => router.push(`/member/shop/products/${product.id}`)}>
                                     <Edit className="w-4 h-4 mr-2" /> Edit Detail
                                  </DropdownMenuItem>
                                  
                                  {/* Menu Toggle Aktif (Kasir) - Redundant dengan kolom, tapi opsional disimpan */}
                                  <DropdownMenuItem onClick={() => toggleActiveStatus(product)}>
                                     <Power className={`w-4 h-4 mr-2 ${product.status === 'active' ? 'text-red-500' : 'text-green-500'}`} /> 
                                     {product.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                     className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                     onClick={() => handleDelete(product.id)}
                                  >
                                     <Trash2 className="w-4 h-4 mr-2" /> Hapus Produk
                                  </DropdownMenuItem>
                               </DropdownMenuContent>
                            </DropdownMenu>
                         </td>
                      </tr>
                   ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}