// File: src/app/(member)/member/shop/pos/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";
import { productService } from "@/services/product.service";
import { orderService } from "@/services/order.service";
import { Product, ProductVariant } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
    Search, ShoppingCart, Trash2, Plus, Minus, Banknote, 
    Loader2, Package, RefreshCw, ChevronUp, QrCode, X, 
    Maximize, Minimize, ScanBarcode, Trash, UserCheck 
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ReceiptDialog } from "@/components/modules/orders/receipt-dialog";
import { OrderItem } from "@/types/order"; 
import { Card, CardContent } from "@/components/ui/card";

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from "firebase/firestore";
import { UserProfile } from "@/types/user";

export interface POSCartItem extends Product {
  cartId: string;
  qty: number;
  selectedVariant?: ProductVariant;
}

export default function MemberPOSPage() {
  const { user, userData } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  
  // MEMBER SEARCH & SMART SCAN STATE
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberResults, setMemberResults] = useState<UserProfile[]>([]);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [buyerName, setBuyerName] = useState("Umum");
  const [isScanning, setIsScanning] = useState(false);

  const [cashAmount, setCashAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  const [paymentType, setPaymentType] = useState<'cash' | 'qris'>('cash');
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // =========================================================================
  // LOGIKA HARGA BERTINGKAT (DINAMIS)
  // =========================================================================
  const getEffectivePrice = (item: any) => {
    const isMember = !!selectedMember;
    if (item.selectedVariant) {
        return isMember ? (item.selectedVariant.memberPrice || item.selectedVariant.price) : item.selectedVariant.price;
    }
    return isMember ? (item.memberPrice || item.price) : item.price;
  };

  const getCatalogDisplayPrice = (product: any) => {
    const isMember = !!selectedMember;
    const publicPrice = product.hasVariants && product.variants?.length 
        ? Math.min(...product.variants.map((v: any) => v.price)) 
        : product.price;
    const memberPrice = product.hasVariants && product.variants?.length 
        ? Math.min(...product.variants.map((v: any) => v.memberPrice || v.price)) 
        : (product.memberPrice || product.price);
    
    return isMember ? memberPrice : publicPrice;
  };

  const totalAmount = cart.reduce((acc, item) => acc + (getEffectivePrice(item) * item.qty), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const changeAmount = (parseInt(cashAmount) || 0) - totalAmount;

  // =========================================================================

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast.error("Browser tidak mendukung mode layar penuh.");
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!loading && searchInputRef.current) searchInputRef.current.focus();
  }, [loading]);

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await productService.getSellerProducts(user.uid);
      const activeData = data.filter(p => p.status === 'active');
      setProducts(activeData);
      const uniqueCats = Array.from(new Set(activeData.map(p => p.category))).sort();
      setCategories(["Semua", ...uniqueCats]);
      setFilteredProducts(activeData);
    } catch (error) {
      toast.error("Gagal memuat produk toko");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [user]);

  useEffect(() => {
    let result = products;
    if (search) {
        const lower = search.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(lower) || p.id.toLowerCase().includes(lower));
    }
    if (selectedCategory !== "Semua") {
        result = result.filter(p => p.category === selectedCategory);
    }
    setFilteredProducts(result);
  }, [search, selectedCategory, products]);


  // SMART SCAN & CROSS-COOP MEMBER SEARCH
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const queryClean = memberSearchQuery.trim();
      
      if (queryClean.length > 2 && !selectedMember) {
        setIsScanning(true);
        try {
            if (queryClean.length === 28) {
                const userDoc = await getDoc(doc(db, "users", queryClean));
                if (userDoc.exists()) {
                    const mData = { uid: userDoc.id, ...userDoc.data() } as UserProfile;
                    handleSelectMember(mData);
                    toast.success(`Berhasil Scan: ${mData.fullName}`);
                    setIsScanning(false);
                    return;
                }
            }
            
            if (queryClean.length === 16 && !isNaN(Number(queryClean))) {
                const qNik = query(collection(db, "users"), where("nik", "==", queryClean), limit(1));
                const snap = await getDocs(qNik);
                if (!snap.empty) {
                    const mData = { uid: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile;
                    handleSelectMember(mData);
                    toast.success(`NIK Ditemukan: ${mData.fullName}`);
                    setIsScanning(false);
                    return;
                }
            }

            const q = query(
                collection(db, "users"),
                where("role", "==", "member"), 
                orderBy("fullName"),
                limit(50) 
            );
            
            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
            
            const filtered = results.filter(r => 
               r.fullName.toLowerCase().includes(queryClean.toLowerCase()) || 
               (r.phone && r.phone.includes(queryClean)) ||
               (r.nik && r.nik.includes(queryClean))
            ).slice(0, 5); 
            
            setMemberResults(filtered);
        } catch (e) {
            console.error(e);
        } finally {
            setIsScanning(false);
        }
      } else {
        setMemberResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [memberSearchQuery, selectedMember]);

  const handleProductClick = (product: Product) => {
    if (product.hasVariants && product.variants && product.variants.length > 0) {
        setSelectedProductForVariant(product);
    } else {
        addToCart(product);
    }
    if (searchInputRef.current) searchInputRef.current.focus();
    setSearch(""); 
  };

  const addToCart = (product: Product, variant?: ProductVariant) => {
    setCart(prev => {
      const variantSuffix = variant ? `-${variant.id}` : '';
      const uniqueCartId = `${product.id}${variantSuffix}`;
      
      const existing = prev.find(p => p.cartId === uniqueCartId);
      const currentStock = variant ? variant.stock : product.stock;

      if (existing && existing.qty >= currentStock) {
          toast.error("Stok tidak mencukupi");
          return prev;
      }
      if (currentStock <= 0) {
          toast.error("Stok habis");
          return prev;
      }

      if (existing) {
        return prev.map(p => p.cartId === uniqueCartId ? { ...p, qty: p.qty + 1 } : p);
      }
      
      const newItem: POSCartItem = { ...product, cartId: uniqueCartId, qty: 1, selectedVariant: variant, price: product.price };
      
      return [...prev, newItem];
    });
    setSelectedProductForVariant(null);
  };

  const updateQty = (cartId: string, delta: number) => {
    setCart(prev => prev.map(p => {
      if (p.cartId === cartId) {
        const newQty = Math.max(1, p.qty + delta);
        const maxStock = p.selectedVariant ? p.selectedVariant.stock : p.stock;
        if (newQty > maxStock) {
          toast.error("Stok mentok");
          return p;
        }
        return { ...p, qty: newQty };
      }
      return p;
    }));
  };

  const removeFromCart = (cartId: string) => setCart(prev => prev.filter(p => p.cartId !== cartId));
  const clearCart = () => { if(confirm("Kosongkan keranjang?")) setCart([]); };

  const handleSelectMember = (member: UserProfile) => {
      setSelectedMember(member);
      setBuyerName(member.fullName);
      setMemberSearchQuery("");
      setMemberResults([]);
  };

  const handleClearMember = () => {
      setSelectedMember(null);
      setBuyerName("Umum");
  };

  const handleCheckout = async () => {
    if (!user || !userData) return;
    if (paymentType === 'cash' && parseInt(cashAmount) < totalAmount) {
      toast.error("Uang tunai kurang");
      return;
    }
    setProcessing(true);
    try {
      const orderItems: OrderItem[] = cart.map(item => ({
        productId: item.id,
        productName: item.name,
        price: getEffectivePrice(item), 
        quantity: item.qty,
        image: item.images?.[0] || item.imageUrl || "",
        sellerId: user.uid,
        variantName: item.selectedVariant?.name || null,
        variant: item.selectedVariant ? { id: item.selectedVariant.id, name: item.selectedVariant.name, price: getEffectivePrice(item) } : null
      }));

      const finalBuyerId = selectedMember ? selectedMember.uid : "guest_pos";
      const finalBuyerName = selectedMember ? selectedMember.fullName : (buyerName || "Umum");

      const result = await orderService.createOrder({
        buyerId: finalBuyerId, 
        buyerName: finalBuyerName,
        sellerId: user.uid,
        sellerName: userData.shopName || userData.fullName || "Toko Member",
        sellerType: "member",
        coopId: userData.coopId || "public",
        items: orderItems,
        totalAmount: totalAmount,
        paymentMethod: paymentType === 'qris' ? "transfer" : "pos_cash",
        paymentStatus: "paid",
        status: "completed",
        isOffline: true,
        notes: paymentType === 'qris' ? "Transaksi Kasir Mandiri (QRIS)" : "Transaksi Kasir Mandiri (Tunai)"
      });

      const finalCartWithEffectivePrice = cart.map(item => ({
        ...item,
        price: getEffectivePrice(item) 
      }));

      setLastOrder({
        orderNumber: result.orderNumber,
        buyerName: finalBuyerName,
        items: finalCartWithEffectivePrice,
        totalAmount: totalAmount,
        paymentMethod: paymentType === 'qris' ? 'transfer' : 'pos_cash',
        createdAt: new Date().toISOString(),
        cash: paymentType === 'qris' ? totalAmount : parseInt(cashAmount),
      });

      toast.success("Transaksi berhasil!");
      
      setCart([]);
      setCashAmount("");
      setBuyerName("Umum");
      setSelectedMember(null);
      setMemberSearchQuery("");
      setPaymentType('cash');
      setIsCheckoutOpen(false);
      setIsMobileCartOpen(false);
      setIsSuccessOpen(true);
      fetchProducts();
      
    } catch (error) {
      toast.error("Gagal memproses transaksi");
    } finally {
      setProcessing(false);
    }
  };

  const CartContent = () => (
    <div className="flex flex-col h-full relative">
        {/* --- MEMBER SEARCH UI (DIPINDAHKAN KE DALAM CART) --- */}
        <div className="p-3 bg-zinc-50 border-b border-zinc-200 z-20">
            {selectedMember ? (
                <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />
                        <div className="truncate">
                            <p className="text-xs font-bold text-blue-900 truncate">{selectedMember.fullName}</p>
                            <p className="text-[9px] text-blue-600 font-mono">ID: {selectedMember.uid.slice(0,8)}</p>
                        </div>
                    </div>
                    <button onClick={handleClearMember} className="text-zinc-400 hover:text-red-500 shrink-0 p-1"><X className="w-4 h-4" /></button>
                </div>
            ) : (
                <div className="relative">
                    <ScanBarcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input 
                        value={memberSearchQuery}
                        onChange={(e) => {
                            setMemberSearchQuery(e.target.value);
                            if(e.target.value === "") setBuyerName("Umum");
                            else setBuyerName(e.target.value);
                        }}
                        placeholder="Scan KTA / Cari nama member..." 
                        className="pl-8 h-9 text-xs border-zinc-300 rounded-lg focus-visible:ring-blue-500 bg-white" 
                    />
                    {isScanning && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-500 animate-spin" />}
                    
                    {memberSearchQuery.length > 2 && memberResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto p-1">
                            {memberResults.map(m => (
                                <button 
                                    key={m.uid}
                                    className="w-full text-left px-3 py-2 hover:bg-zinc-50 rounded-md flex flex-col gap-0.5 transition-colors"
                                    onClick={() => handleSelectMember(m)}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-zinc-900 truncate">{m.fullName}</p>
                                        {m.coopName && <span className="text-[8px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded border border-blue-100 whitespace-nowrap ml-2">{m.coopName.replace(/Koperasi/gi, '').trim()}</span>}
                                    </div>
                                    <p className="text-[9px] text-zinc-500">{m.phone || m.email}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-zinc-400 text-sm bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200 m-2">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
              Keranjang kosong
            </div>
        ) : (
            <>
                <ScrollArea className="flex-1 p-2 sm:p-3 z-10">
                    <div className="space-y-2">
                    {cart.map((item) => {
                        const imgUrl = item.images?.[0] || item.imageUrl;
                        const effectivePrice = getEffectivePrice(item); 
                        return (
                        <div key={item.cartId} className="flex gap-2 bg-white p-2.5 rounded-xl border border-zinc-200 shadow-sm transition-all items-center">
                           <div className="flex flex-col items-center justify-center gap-1 bg-zinc-50 rounded-lg border w-8 shrink-0 py-1">
                               <button onClick={() => updateQty(item.cartId, 1)} className="h-5 w-full hover:bg-zinc-200 flex items-center justify-center text-green-600 rounded-t"><Plus className="w-3.5 h-3.5"/></button>
                               <span className="text-[10px] font-bold my-0.5">{item.qty}</span>
                               <button onClick={() => updateQty(item.cartId, -1)} className="h-5 w-full hover:bg-zinc-200 flex items-center justify-center text-red-600 rounded-b"><Minus className="w-3.5 h-3.5"/></button>
                           </div>
                           <div className="w-10 h-10 rounded-md bg-zinc-100 overflow-hidden border border-zinc-200 shrink-0 relative">
                               {imgUrl ? (
                                   <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                               ) : (
                                   <Package className="w-5 h-5 m-auto mt-2.5 text-zinc-300" />
                               )}
                           </div>
                           
                           <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                               <p className="font-bold text-xs truncate text-zinc-800 leading-tight mb-0.5">{item.name}</p>
                               <div className="flex items-center gap-1 flex-wrap mb-1">
                                   {item.isBundle && <span className="text-[8px] text-white bg-purple-600 px-1 rounded uppercase font-bold tracking-wider">Paket</span>}
                                   {item.selectedVariant && <span className="text-[8px] text-zinc-500 bg-zinc-100 px-1 rounded border border-zinc-200">{item.selectedVariant.name}</span>}
                                   {!!selectedMember && <span className="text-[8px] text-green-700 bg-green-100 px-1 rounded font-bold border border-green-200">Harga Member</span>}
                               </div>
                               <div className="flex justify-between items-center mt-auto">
                                   <span className="text-[10px] font-medium text-zinc-400">@{formatCurrency(effectivePrice)}</span>
                                   <span className="font-black text-xs text-blue-700">{formatCurrency(effectivePrice * item.qty)}</span>
                               </div>
                           </div>
                           <button onClick={() => removeFromCart(item.cartId)} className="text-zinc-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md shrink-0 transition-colors">
                               <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                        );
                    })}
                    </div>
                </ScrollArea>
                <div className="pt-3 pb-2 px-3 mt-auto border-t border-dashed border-zinc-200 bg-white">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <span className="text-sm font-semibold text-zinc-500">Tagihan <span className="text-xs font-normal">({totalItems} item)</span></span>
                        <span className="text-2xl font-black text-blue-700 tracking-tight">{formatCurrency(totalAmount)}</span>
                    </div>
                    
                    <Button 
                        className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20 rounded-xl"
                        disabled={cart.length === 0}
                        onClick={() => setIsCheckoutOpen(true)}
                    >
                        <Banknote className="w-5 h-5 mr-2" /> Bayar Pesanan
                    </Button>
                </div>
            </>
        )}
    </div>
  );

  return (
    <div className={cn("flex flex-col lg:flex-row gap-4 lg:gap-6 transition-all duration-300", isFullscreen ? "fixed inset-0 z-50 bg-zinc-50 p-4 h-screen" : "h-[calc(100vh-6rem)] pb-20 lg:pb-0")}>
      <div className="flex-1 flex flex-col gap-4 min-w-0 print:hidden h-full">
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
            <Input 
              ref={searchInputRef}
              placeholder="Ketik nama atau scan barcode produk..." 
              className="pl-10 bg-white h-12 shadow-sm border-zinc-200 text-base font-medium rounded-xl focus-visible:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"><X className="w-4 h-4" /></button>}
          </div>
          
          <Button variant="outline" size="icon" onClick={fetchProducts} title="Refresh Produk" className="h-12 w-12 rounded-xl bg-white border-zinc-200 shadow-sm shrink-0">
            <RefreshCw className={`w-5 h-5 text-zinc-600 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleFullscreen} title={isFullscreen ? "Keluar Mode Fokus" : "Mode Layar Penuh (Fokus)"} className="h-12 w-12 rounded-xl bg-white border-zinc-200 shadow-sm hidden sm:flex shrink-0">
            {isFullscreen ? <Minimize className="w-5 h-5 text-zinc-600" /> : <Maximize className="w-5 h-5 text-zinc-600" />}
          </Button>
        </div>

        <ScrollArea className="w-full whitespace-nowrap pb-1">
            <div className="flex gap-2 px-1 py-1">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all shadow-sm ${selectedCategory === cat ? "bg-zinc-800 text-white border border-zinc-800" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900"}`}>{cat}</button>
                ))}
            </div>
        </ScrollArea>

        <div className="flex-1 bg-zinc-100/50 rounded-2xl border border-zinc-200 p-2 sm:p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 shadow-inner">
          {loading ? (
             <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-300" /></div>
          ) : filteredProducts.length === 0 ? (
             <div className="flex h-full flex-col items-center justify-center text-zinc-400"><Package className="w-16 h-16 mb-4 opacity-20" /><p className="font-medium">Produk tidak ditemukan</p></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const imgUrl = product.images?.[0] || product.imageUrl;
                return (
                <Card 
                  key={product.id} 
                  className={`cursor-pointer hover:border-blue-500 hover:shadow-md transition-all active:scale-95 group relative overflow-hidden rounded-xl border border-zinc-200 flex flex-col ${product.stock <= 0 && !product.hasVariants ? 'opacity-50 grayscale bg-zinc-50' : 'bg-white'}`}
                  onClick={() => (product.stock > 0 || product.hasVariants) && handleProductClick(product)}
                >
                  <div className="relative w-full aspect-[4/3] bg-zinc-100 rounded-t-xl overflow-hidden border-b border-zinc-100 shrink-0">
                     {imgUrl ? <img src={imgUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="flex h-full items-center justify-center text-zinc-300"><Package className="w-8 h-8" /></div>}
                     <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                         {product.isBundle ? <Badge variant="secondary" className="text-[9px] px-1.5 h-4 bg-purple-600 text-white border-0 font-black uppercase tracking-wider shadow-md">Paket</Badge> : product.hasVariants ? <Badge variant="secondary" className="text-[9px] px-1.5 h-4 bg-blue-600 text-white border-0 font-bold shadow-md">Varian</Badge> : null}
                     </div>
                     {product.stock <= 0 && !product.hasVariants && <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20"><span className="text-white font-black tracking-widest border-2 border-white px-3 py-1 rounded-md text-[10px] shadow-lg">HABIS</span></div>}
                  </div>
                  <CardContent className="p-3 flex flex-col flex-1 justify-between gap-2">
                    <div className="space-y-1">
                        <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider truncate block">{product.category.split(' ')[0]}</span>
                        <h3 className="font-bold text-xs sm:text-sm text-zinc-900 leading-tight line-clamp-2" title={product.name}>{product.name}</h3>
                    </div>
                    <div className="pt-2 border-t border-zinc-100/80">
                        <div className="flex justify-between items-end">
                            <p className="font-black text-blue-700 text-xs sm:text-sm tracking-tight">{formatCurrency(getCatalogDisplayPrice(product))}</p>
                            <div className="text-right">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${product.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{product.hasVariants ? 'Stok Var' : (product.stock > 0 ? `${product.stock} pc` : 'Habis')}</span>
                            </div>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:flex w-[340px] xl:w-[380px] flex-col bg-white rounded-2xl border border-zinc-200 shadow-xl h-full print:hidden relative overflow-hidden">
        <div className="p-3.5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center z-10 shadow-sm">
          <h2 className="font-bold text-sm flex items-center gap-2 text-zinc-800"><ShoppingCart className="w-4 h-4 text-blue-600" /> Keranjang Toko</h2>
          {cart.length > 0 && <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:bg-red-50 hover:text-red-600 h-7 px-2 text-xs font-semibold rounded-md"><Trash className="w-3.5 h-3.5 mr-1.5" /> Kosongkan</Button>}
        </div>
        <div className="flex-1 overflow-hidden flex flex-col bg-zinc-50/30 relative"><CartContent /></div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[45] bg-white border-t p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe">
         <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
            <SheetTrigger asChild>
                <Button className="w-full h-14 bg-zinc-900 text-white flex justify-between items-center px-5 hover:bg-zinc-800 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="relative"><ShoppingCart className="w-6 h-6" /><span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{totalItems}</span></div>
                        <span className="font-bold uppercase tracking-wide text-xs text-zinc-400">Isi Keranjang</span>
                    </div>
                    <div className="flex items-center gap-2"><span className="font-black text-xl tracking-tight">{formatCurrency(totalAmount)}</span><ChevronUp className="w-5 h-5 text-zinc-500" /></div>
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0 rounded-t-[2rem] overflow-hidden">
                <SheetHeader className="px-6 py-4 border-b bg-zinc-50 flex flex-row items-center justify-between">
                    <SheetTitle className="flex items-center gap-2 text-lg"><ShoppingCart className="w-5 h-5 text-blue-600" /> Keranjang Kasir</SheetTitle>
                    {cart.length > 0 && <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:bg-red-50 h-8 px-3 text-xs font-bold rounded-full">Kosongkan</Button>}
                </SheetHeader>
                <div className="flex-1 overflow-hidden flex flex-col bg-white"><CartContent /></div>
            </SheetContent>
         </Sheet>
      </div>

      <Dialog open={!!selectedProductForVariant} onOpenChange={() => setSelectedProductForVariant(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
            <DialogHeader>
                <DialogTitle>Pilih Varian Produk</DialogTitle>
                <DialogDescription className="font-bold text-zinc-900 text-lg">{selectedProductForVariant?.name}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[300px] pr-2 mt-2">
                <div className="grid gap-3">
                    {selectedProductForVariant?.variants?.map((v: any) => (
                        <Button 
                            key={v.id} variant="outline" className="justify-between h-auto py-3.5 px-4 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all rounded-xl"
                            disabled={v.stock <= 0} onClick={() => addToCart(selectedProductForVariant, v)}
                        >
                            <span className="flex flex-col items-start text-left">
                                <span className="font-bold text-zinc-900 text-sm">{v.name}</span>
                                <span className={`text-[10px] font-bold ${v.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>Sisa Stok: {v.stock}</span>
                            </span>
                            <span className="font-black text-blue-700 text-base tracking-tight">
                                {formatCurrency(!!selectedMember ? (v.memberPrice || v.price) : v.price)}
                            </span>
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isCheckoutOpen} onOpenChange={(open) => { setIsCheckoutOpen(open); if (!open) setPaymentType('cash'); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-xl">Pembayaran Kasir</DialogTitle></DialogHeader>
          
          <div className="space-y-5 py-2">
             <div className="bg-zinc-900 p-5 rounded-xl text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Banknote className="w-16 h-16 text-white" /></div>
                <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-1 relative z-10">Total Tagihan</p>
                <p className="text-4xl font-black text-white tracking-tighter relative z-10">{formatCurrency(totalAmount)}</p>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Identitas Pembeli</label>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedMember ? 'bg-blue-100 text-blue-600' : 'bg-zinc-200 text-zinc-500'}`}>
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-zinc-900">{selectedMember ? selectedMember.fullName : (buyerName || "Umum")}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{selectedMember ? `Member ID: ${selectedMember.uid.slice(0,8)}` : "Pelanggan Publik"}</p>
                    </div>
                </div>
             </div>

             <div className="flex bg-zinc-100 p-1.5 rounded-xl border border-zinc-200 shadow-inner">
               <button onClick={() => setPaymentType('cash')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentType === 'cash' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>Uang Tunai</button>
             </div>

             {paymentType === 'cash' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                   <div className="space-y-2">
                       <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Uang Diterima</label>
                       <div className="relative">
                           <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                           <Input type="number" className="pl-12 h-14 text-2xl font-black border-zinc-300 rounded-xl focus-visible:ring-green-500" placeholder="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} autoFocus />
                       </div>
                       <div className="flex flex-wrap gap-2 pt-1">
                           {[10000, 20000, 50000, 100000].map(amt => (
                               <button key={amt} onClick={() => setCashAmount(amt.toString())} className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold text-zinc-700 border border-zinc-200 transition-colors">{amt/1000}k</button>
                           ))}
                           <button onClick={() => setCashAmount(totalAmount.toString())} className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-bold border border-blue-200 transition-colors">Uang Pas</button>
                       </div>
                   </div>
                   <div className={`p-4 rounded-xl border-2 flex justify-between items-center transition-colors ${changeAmount >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                       <span className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Kembalian</span>
                       <span className={`text-2xl font-black tracking-tight ${changeAmount >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(Math.abs(changeAmount))}</span>
                   </div>
                </div>
             )}
          </div>
          <DialogFooter className="pt-4 border-t border-zinc-100 mt-2 gap-2 sm:gap-0">
            <Button variant="outline" className="h-12 rounded-xl" onClick={() => setIsCheckoutOpen(false)} disabled={processing}>Batal</Button>
            <Button onClick={handleCheckout} disabled={processing || (paymentType === 'cash' && changeAmount < 0)} className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-base px-8">
               {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Selesai & Bayar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptDialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen} order={lastOrder} coopName={userData?.coopName || "Koperasi"} cashierName={userData?.fullName || "Member"} />
    </div>
  );
}