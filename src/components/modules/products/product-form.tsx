"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product, ProductVariant } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { productService } from "@/services/product.service";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, Layers, Package, Truck, Info, 
  DollarSign, Tag, Save, ArrowLeft, User, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface ProductFormProps {
  initialData?: Product | null;
  mode: "create" | "edit";
}

const CATEGORIES = [
  "Makanan & Minuman", "Fashion Pria", "Fashion Wanita", "Elektronik", 
  "Kebutuhan Rumah", "Kesehatan", "Hobi & Koleksi", "Otomotif", 
  "Jasa & Layanan", "Lainnya"
];

export function ProductForm({ initialData, mode }: ProductFormProps) {
  const router = useRouter();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);

  const [sellerMode, setSellerMode] = useState<'coop' | 'member'>(initialData?.sellerType || 'coop');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialData?.sellerType === 'member' ? initialData.sellerId : "");
  const [members, setMembers] = useState<{uid: string, fullName: string}[]>([]);

  // State Utama (+ memberPrice)
  const [formData, setFormData] = useState<any>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    price: initialData?.price || 0,
    memberPrice: (initialData as any)?.memberPrice || initialData?.price || 0, // <--- BARU
    stock: initialData?.stock || 0,
    weight: initialData?.weight || 100,
    condition: initialData?.condition || "new",
    minOrder: initialData?.minOrder || 1,
    images: initialData?.images || [],
    hasVariants: initialData?.hasVariants || false,
    variants: initialData?.variants || [],
    isPublic: initialData?.isPublic ?? true,
  });

  // State Varian Baru (+ memberPrice)
  const [tempVariant, setTempVariant] = useState<any>({
    name: "",
    price: 0,
    memberPrice: 0, // <--- BARU
    stock: 0,
  });

  useEffect(() => {
    if (userData && userData.role !== 'member' && userData.coopId) {
      const fetchMembers = async () => {
        const q = query(
           collection(db, "users"), 
           where("coopId", "==", userData.coopId), 
           where("role", "==", "member")
        );
        const snap = await getDocs(q);
        setMembers(snap.docs.map(d => ({ uid: d.id, fullName: d.data().fullName })));
      };
      fetchMembers();
    }
    
    if (userData && !initialData) {
       setSellerMode(userData.role === 'member' ? 'member' : 'coop');
    }
  }, [userData, initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const addVariant = () => {
    if (!tempVariant.name || !tempVariant.price || !tempVariant.stock) {
      toast.error("Lengkapi nama, harga publik, dan stok varian.");
      return;
    }
    
    const newVariant = {
      id: Date.now().toString(),
      name: tempVariant.name,
      price: Number(tempVariant.price),
      memberPrice: tempVariant.memberPrice ? Number(tempVariant.memberPrice) : Number(tempVariant.price),
      stock: Number(tempVariant.stock),
    };

    setFormData((prev: any) => ({
      ...prev,
      variants: [...(prev.variants || []), newVariant]
    }));

    setTempVariant({ name: "", price: 0, memberPrice: 0, stock: 0 });
    toast.success("Varian ditambahkan");
  };

  const removeVariant = (idx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      variants: prev.variants?.filter((_: any, i: number) => i !== idx)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return toast.error("Sesi berakhir");
    if (!formData.name || !formData.category || (formData.images?.length || 0) === 0) {
      return toast.error("Wajib isi: Nama, Kategori, dan Foto Produk.");
    }

    setLoading(true);
    try {
      let finalPrice = formData.price;
      let finalMemberPrice = formData.memberPrice || formData.price; // Fallback
      let finalStock = formData.stock;

      // Ekstraksi nilai minimal jika ada varian
      if (formData.hasVariants && formData.variants && formData.variants.length > 0) {
        finalPrice = Math.min(...formData.variants.map((v: any) => v.price));
        finalMemberPrice = Math.min(...formData.variants.map((v: any) => v.memberPrice || v.price));
        finalStock = formData.variants.reduce((acc: number, v: any) => acc + v.stock, 0);
      } else if (formData.hasVariants) {
        toast.error("Aktifkan varian, tapi daftar varian kosong!");
        setLoading(false);
        return;
      }

      let finalSellerId = userData.uid;
      let finalSellerName = userData.role === 'member' ? (userData.shopName || userData.fullName) : (userData.coopName || "Koperasi");
      let finalSellerType: 'coop' | 'member' = userData.role === 'member' ? 'member' : 'coop';

      if (userData.role !== 'member') {
         if (sellerMode === 'coop') {
            finalSellerId = userData.coopId || 'public';
            finalSellerName = userData.coopName || "Koperasi";
            finalSellerType = 'coop';
         } else {
            if (!selectedMemberId) return toast.error("Silakan pilih anggota pemilik produk.");
            const selectedMem = members.find(m => m.uid === selectedMemberId);
            finalSellerId = selectedMemberId;
            finalSellerName = selectedMem ? selectedMem.fullName : "Anggota";
            finalSellerType = 'member';
         }
      }

      const payload = {
        ...formData,
        price: finalPrice,
        memberPrice: finalMemberPrice, // <--- Payload BARU
        stock: finalStock,
        sellerId: finalSellerId,
        sellerName: finalSellerName,
        sellerType: finalSellerType,
        coopId: userData.coopId || 'public',
        coopName: userData.coopName || "Unknown Coop",
        marketplaceStatus: (userData.role === 'member') ? 'pending_review' : 'published_marketplace',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (mode === "create") {
        await productService.createProduct(payload as any);
        toast.success(userData.role === 'member' ? "Produk dikirim untuk review." : "Produk diterbitkan.");
      } else {
        if (initialData?.id) {
          await productService.updateProduct(initialData.id, { ...payload, updatedAt: new Date().toISOString() } as any);
          toast.success("Produk diperbarui.");
        }
      }

      router.push(userData.role === 'member' ? "/member/shop/products" : "/admin/products");
      router.refresh();
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* KOLOM KIRI */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Foto Produk</CardTitle>
              <CardDescription>Format JPG/PNG, maks 5MB. Minimal 1 foto.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={formData.images || []}
                onChange={(urls) => handleChange("images", urls)}
                onRemove={(url) => handleChange("images", formData.images?.filter((i: string) => i !== url))}
                disabled={loading}
                uploaderName={userData?.fullName}
                productName={formData.name || "new-prod"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Informasi Produk</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {userData?.role !== 'member' && (
                <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-100 rounded-lg mb-4">
                   <Label className="text-blue-900 font-semibold flex items-center gap-2"><User className="w-4 h-4"/> Kepemilikan Produk</Label>
                   <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-700 font-medium">
                         <input type="radio" checked={sellerMode === 'coop'} onChange={() => setSellerMode('coop')} className="text-blue-600 accent-blue-600 w-4 h-4" /> Milik Koperasi
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer text-zinc-700 font-medium">
                         <input type="radio" checked={sellerMode === 'member'} onChange={() => setSellerMode('member')} className="text-blue-600 accent-blue-600 w-4 h-4" /> Titip Jual (Anggota)
                      </label>
                   </div>
                   {sellerMode === 'member' && (
                      <div className="space-y-2 pt-2 animate-in fade-in zoom-in-95">
                         <Label className="text-xs text-zinc-600">Pilih Anggota Penanggung Jawab</Label>
                         <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                            <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
                               <SelectValue placeholder="-- Cari & Pilih Anggota --"/>
                            </SelectTrigger>
                            <SelectContent>
                               {members.length === 0 ? (
                                  <SelectItem value="empty" disabled>Belum ada anggota terdaftar</SelectItem>
                               ) : (
                                  members.map(m => (<SelectItem key={m.uid} value={m.uid}>{m.fullName}</SelectItem>))
                               )}
                            </SelectContent>
                         </Select>
                      </div>
                   )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Nama Produk <span className="text-red-500">*</span></Label>
                <Input placeholder="Contoh: Kripik Pisang Coklat" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} className="font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori <span className="text-red-500">*</span></Label>
                  <Select value={formData.category} onValueChange={(val) => handleChange("category", val)}>
                    <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kondisi</Label>
                  <Select value={formData.condition} onValueChange={(val) => handleChange("condition", val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Baru</SelectItem>
                      <SelectItem value="used">Bekas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deskripsi Lengkap</Label>
                <Textarea placeholder="Jelaskan spesifikasi..." className="min-h-[150px] resize-none" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN */}
        <div className="flex-1 space-y-6">
          <Card className="border-blue-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Harga & Varian</span>
               </div>
               <div className="flex items-center gap-2">
                  <Label htmlFor="variant-switch" className="text-xs font-medium text-zinc-600 cursor-pointer">Aktifkan Varian?</Label>
                  <Switch id="variant-switch" checked={formData.hasVariants} onCheckedChange={(checked) => handleChange("hasVariants", checked)} />
               </div>
            </div>
            
            <CardContent className="p-6">
              {formData.hasVariants ? (
                <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="p-3 bg-zinc-50 border rounded-lg space-y-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase">Tambah Varian Baru</p>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="col-span-2">
                          <Input placeholder="Nama (Cth: Merah / XL)" value={tempVariant.name} onChange={(e) => setTempVariant({...tempVariant, name: e.target.value})} className="bg-white h-9" />
                       </div>
                       {/* INPUT HARGA VARIAN */}
                       <div className="space-y-1">
                          <Label className="text-[10px]">Harga Publik (Rp)</Label>
                          <Input type="number" placeholder="0" value={tempVariant.price || ""} onChange={(e) => setTempVariant({...tempVariant, price: Number(e.target.value)})} className="bg-white h-9" />
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[10px] text-green-700 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Harga Member (Rp)</Label>
                          <Input type="number" placeholder="Opsional" value={tempVariant.memberPrice || ""} onChange={(e) => setTempVariant({...tempVariant, memberPrice: Number(e.target.value)})} className="bg-green-50 h-9 border-green-200" />
                       </div>
                       
                       <div className="col-span-2">
                          <Input type="number" placeholder="Stok Varian" value={tempVariant.stock || ""} onChange={(e) => setTempVariant({...tempVariant, stock: Number(e.target.value)})} className="bg-white h-9" />
                       </div>
                       <Button onClick={addVariant} size="sm" className="col-span-2 bg-blue-600 hover:bg-blue-700 h-9">
                          <Plus className="w-4 h-4 mr-2" /> Tambahkan Varian
                       </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {formData.variants?.length === 0 ? (
                      <div className="text-center py-4 text-sm text-zinc-400 border-2 border-dashed rounded-lg">Belum ada varian ditambahkan.</div>
                    ) : (
                      formData.variants?.map((v: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                           <div>
                              <p className="font-bold text-zinc-800 text-sm">{v.name}</p>
                              <div className="flex gap-2 text-[10px] mt-1">
                                <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">Publik: Rp {v.price.toLocaleString('id-ID')}</span>
                                <span className="bg-green-100 px-1.5 py-0.5 rounded text-green-700 font-bold">Member: Rp {v.memberPrice.toLocaleString('id-ID')}</span>
                                <span className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">Stok: {v.stock}</span>
                              </div>
                           </div>
                           <Button variant="ghost" size="icon" onClick={() => removeVariant(i)} className="text-zinc-300 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                   <div className="space-y-2">
                      <Label>Harga Publik (Rp)</Label>
                      <div className="relative">
                         <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                         <Input type="number" className="pl-9 text-lg font-bold text-zinc-800" value={formData.price || ""} onChange={(e) => handleChange("price", Number(e.target.value))} />
                      </div>
                   </div>
                   
                   {/* INPUT HARGA MEMBER NON-VARIAN */}
                   <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <Label className="text-green-800 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/> Harga Khusus Anggota (Rp)</Label>
                      <div className="relative">
                         <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-green-600" />
                         <Input type="number" className="pl-9 font-bold bg-white" placeholder="Biarkan kosong jika sama" value={formData.memberPrice || ""} onChange={(e) => handleChange("memberPrice", Number(e.target.value))} />
                      </div>
                      <p className="text-[10px] text-green-700">Harga diskon khusus member koperasi terdaftar.</p>
                   </div>

                   <div className="space-y-2">
                      <Label>Stok Tersedia</Label>
                      <Input type="number" value={formData.stock || ""} onChange={(e) => handleChange("stock", Number(e.target.value))} />
                   </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><Truck className="w-4 h-4 text-orange-600" /> Pengiriman</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Berat (Gram)</Label>
                  <Input type="number" value={formData.weight || ""} onChange={(e) => handleChange("weight", Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Min. Order</Label>
                  <Input type="number" value={formData.minOrder || ""} onChange={(e) => handleChange("minOrder", Number(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40 md:static md:bg-transparent md:border-0 md:p-0 md:mt-8">
         <div className="container mx-auto flex items-center justify-between md:justify-end gap-3 max-w-5xl">
            <Button type="button" variant="outline" onClick={() => router.back()} className="w-full md:w-auto shadow-sm" disabled={loading}>Batal</Button>
            <Button type="submit" className="w-full md:w-auto bg-red-600 hover:bg-red-700 min-w-[150px] font-bold shadow-sm" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="mr-2 h-4 w-4" /> {mode === "create" ? "Simpan Produk" : "Update Produk"}</>}
            </Button>
         </div>
      </div>
    </form>
  );
}