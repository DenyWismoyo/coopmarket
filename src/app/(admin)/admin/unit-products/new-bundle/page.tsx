"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { productService } from "@/services/product.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Search, Trash2, Package, Tag, Save, Gift, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function NewBundlePage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [images, setImages] = useState<string[]>([]);
  
  // State untuk item yang dimasukkan ke dalam paket
  const [bundleItems, setBundleItems] = useState<{product: any, qty: number}[]>([]);

  // Fetch Semua Produk (Unit + Member) untuk dipilih
  const { data: allProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ['allProductsForBundle', userData?.coopId],
    queryFn: () => productService.getAllProductsByCoop(userData!.coopId!),
    enabled: !!userData?.coopId
  });

  // Filter produk untuk pencarian di modal pilihan
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter(p => 
       !p.isBundle && // Jangan masukkan bundle ke dalam bundle
       p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [allProducts, search]);

  // Kalkulasi Modal
  const totalNormalPrice = bundleItems.reduce((acc, item) => acc + (item.product.price * item.qty), 0);

  const handleAddItem = (product: any) => {
    const exists = bundleItems.find(i => i.product.id === product.id);
    if (exists) {
       setBundleItems(bundleItems.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
       setBundleItems([...bundleItems, { product, qty: 1 }]);
    }
    toast.success(`${product.name} ditambahkan ke paket.`);
  };

  const handleRemoveItem = (productId: string) => {
    setBundleItems(bundleItems.filter(i => i.product.id !== productId));
  };

  const updateItemQty = (productId: string, qty: number) => {
    if (qty < 1) return;
    setBundleItems(bundleItems.map(i => i.product.id === productId ? { ...i, qty } : i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !stock || images.length === 0 || bundleItems.length === 0) {
       toast.error("Mohon lengkapi Nama, Harga, Stok, Gambar, dan isi minimal 1 produk.");
       return;
    }

    setLoading(true);
    try {
      const payload = {
         name,
         description,
         category: "Paket Bundling", // Otomatis kategori khusus
         price: Number(price),
         stock: Number(stock),
         images,
         weight: 1000, // Default 1kg untuk paket
         condition: 'new',
         minOrder: 1,
         hasVariants: false,
         isBundle: true, // FLAG PENTING
         bundleItems: bundleItems.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            qty: item.qty,
            sellerName: item.product.sellerType === 'member' ? item.product.sellerName : 'Koperasi'
         })),
         // Identitas Paket selalu milik Unit
         sellerId: userData!.coopId!,
         sellerName: userData!.coopName || "Unit Koperasi",
         sellerType: 'coop',
         coopId: userData!.coopId!,
         coopName: userData!.coopName || "Unit Koperasi",
         marketplaceStatus: 'published_marketplace',
         status: 'active',
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
      };

      await productService.createProduct(payload as any);
      toast.success("Paket Bundling berhasil dibuat!");
      router.push("/admin/unit-products");
    } catch (error: any) {
      toast.error("Gagal membuat paket: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/unit-products">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-purple-900 flex items-center gap-2">
             <Gift className="w-6 h-6" /> Buat Paket Bundling
          </h1>
          <p className="text-sm text-zinc-500">Gabungkan produk unit & titip jual menjadi satu paket menarik.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* KOLOM KIRI - INFO PAKET */}
         <div className="lg:col-span-5 space-y-6">
            <Card className="border-purple-100 shadow-sm">
               <CardHeader className="bg-purple-50/50 pb-4 border-b border-purple-100">
                  <CardTitle className="text-base font-semibold">Identitas Paket</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                     <Label>Nama Paket <span className="text-red-500">*</span></Label>
                     <Input placeholder="Cth: Paket Sembako Ramadhan" value={name} onChange={(e) => setName(e.target.value)} className="border-purple-200 focus-visible:ring-purple-500" />
                  </div>
                  <div className="space-y-2">
                     <Label>Deskripsi Paket</Label>
                     <Textarea placeholder="Sebutkan keunggulan paket ini..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Harga Paket (Rp) <span className="text-red-500">*</span></Label>
                        <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="font-bold text-lg text-purple-700" />
                     </div>
                     <div className="space-y-2">
                        <Label>Stok Paket <span className="text-red-500">*</span></Label>
                        <Input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
                     </div>
                  </div>

                  {bundleItems.length > 0 && (
                     <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 mt-4">
                        <p className="text-xs text-zinc-500 mb-1">Total Harga Normal (Satuan):</p>
                        <p className="text-sm font-bold text-zinc-700 line-through decoration-red-500">{formatCurrency(totalNormalPrice)}</p>
                        <p className="text-xs text-green-600 font-medium mt-1">
                           Anda memberikan diskon sebesar {formatCurrency(totalNormalPrice - Number(price))}
                        </p>
                     </div>
                  )}
               </CardContent>
            </Card>

            <Card>
               <CardHeader><CardTitle className="text-base font-semibold">Foto Paket (Wajib)</CardTitle></CardHeader>
               <CardContent>
                  <ImageUpload value={images} onChange={(urls) => setImages(urls)} onRemove={(url) => setImages(images.filter(i => i !== url))} disabled={loading} uploaderName={userData?.fullName} productName={name || "bundle"} />
               </CardContent>
            </Card>
         </div>

         {/* KOLOM KANAN - PILIH ISIAN PRODUK */}
         <div className="lg:col-span-7 space-y-6">
            <Card className="shadow-sm border-zinc-200">
               <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
                  <div>
                     <CardTitle className="text-base font-semibold flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-blue-600"/> Isi Paket</CardTitle>
                     <CardDescription>Pilih produk yang akan dimasukkan ke dalam paket.</CardDescription>
                  </div>
               </CardHeader>
               <CardContent className="p-0 flex flex-col md:flex-row h-[500px]">
                  
                  {/* Daftar Pencarian Produk */}
                  <div className="w-full md:w-1/2 border-r border-zinc-100 flex flex-col bg-zinc-50/50">
                     <div className="p-3 border-b border-zinc-200">
                        <div className="relative">
                           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                           <Input placeholder="Cari produk katalog..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 bg-white" />
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                        {loadingProducts ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-400"/></div> : 
                         filteredProducts.length === 0 ? <p className="text-center text-xs text-zinc-400 mt-4">Produk tidak ditemukan</p> :
                         filteredProducts.map(p => (
                            <div key={p.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-zinc-200 hover:border-blue-300 transition-colors">
                               <div className="w-10 h-10 rounded bg-zinc-100 shrink-0 overflow-hidden">
                                  {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover"/> : <Package className="w-4 h-4 m-3 text-zinc-300"/>}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-zinc-900 truncate">{p.name}</p>
                                  <p className="text-[10px] text-blue-600">{formatCurrency(p.price)}</p>
                               </div>
                               <Button type="button" size="sm" variant="secondary" className="h-7 px-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white" onClick={() => handleAddItem(p)}>
                                  <Plus className="w-3 h-3" />
                               </Button>
                            </div>
                         ))
                        }
                     </div>
                  </div>

                  {/* Keranjang Isian Paket */}
                  <div className="w-full md:w-1/2 flex flex-col">
                     <div className="p-3 bg-white border-b font-bold text-sm text-zinc-700 flex justify-between">
                        <span>Isi Terpilih</span>
                        <Badge variant="secondary">{bundleItems.length} Item</Badge>
                     </div>
                     <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                        {bundleItems.length === 0 ? (
                           <div className="h-full flex flex-col justify-center items-center text-zinc-400">
                              <Package className="w-10 h-10 mb-2 opacity-20" />
                              <p className="text-xs">Belum ada isian.</p>
                           </div>
                        ) : (
                           bundleItems.map((item, idx) => (
                              <div key={idx} className="p-3 bg-white border border-zinc-200 rounded-xl relative shadow-sm">
                                 <button type="button" onClick={() => handleRemoveItem(item.product.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                 </button>
                                 <p className="font-bold text-sm pr-4 leading-tight">{item.product.name}</p>
                                 <p className="text-[10px] text-zinc-500 mb-2 mt-0.5">Milik: {item.product.sellerType === 'member' ? item.product.sellerName : 'Unit Koperasi'}</p>
                                 
                                 <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed">
                                    <p className="text-xs font-semibold text-zinc-700">{formatCurrency(item.product.price)} / pc</p>
                                    <div className="flex items-center gap-2">
                                       <span className="text-[10px] font-medium text-zinc-500">Qty:</span>
                                       <Input type="number" min="1" value={item.qty} onChange={(e) => updateItemQty(item.product.id, Number(e.target.value))} className="w-16 h-7 text-xs px-2 text-center" />
                                    </div>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Button type="submit" disabled={loading} className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base shadow-lg shadow-purple-200">
               {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2"/>}
               Simpan Paket Bundling
            </Button>
         </div>
      </form>
    </div>
  );
}