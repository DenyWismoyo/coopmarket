"use client";

import { useEffect, useState } from "react";
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
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Banknote,
  Loader2,
  Package,
  RefreshCw,
  ChevronUp,
  QrCode
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ReceiptDialog } from "@/components/modules/orders/receipt-dialog";
import { OrderItem } from "@/types/order"; 
import { Card, CardContent } from "@/components/ui/card";

export interface POSCartItem extends Product {
  cartId: string;
  qty: number;
  selectedVariant?: ProductVariant;
}

export default function MemberPOSPage() {
  const { user, userData } = useAuth();
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  
  // Cart State
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  // Transaction State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("Umum");
  const [cashAmount, setCashAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  
  // Payment Type State [BARU]
  const [paymentType, setPaymentType] = useState<'cash' | 'qris'>('cash');

  // Variant Selection State
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

  // 1. Fetch Produk Member
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

  useEffect(() => {
    fetchProducts();
  }, [user]);

  // 2. Filter Produk
  useEffect(() => {
    let result = products;
    if (search) {
        const lower = search.toLowerCase();
        result = result.filter(p => 
            p.name.toLowerCase().includes(lower)
        );
    }
    if (selectedCategory !== "Semua") {
        result = result.filter(p => p.category === selectedCategory);
    }
    setFilteredProducts(result);
  }, [search, selectedCategory, products]);

  // 3. Cart Logic
  const handleProductClick = (product: Product) => {
    if (product.hasVariants && product.variants && product.variants.length > 0) {
        setSelectedProductForVariant(product);
    } else {
        addToCart(product);
    }
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
      
      const price = variant ? variant.price : product.price;
      
      const newItem: POSCartItem = { 
          ...product, 
          cartId: uniqueCartId, 
          qty: 1, 
          selectedVariant: variant,
          price: price 
       };
      
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

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(p => p.cartId !== cartId));
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const changeAmount = (parseInt(cashAmount) || 0) - totalAmount;

  // 4. Checkout Logic
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
        price: item.price,
        quantity: item.qty,
        image: item.images?.[0] || "",
        sellerId: user.uid,
        variantName: item.selectedVariant?.name || null,
        variant: item.selectedVariant ? {
            id: item.selectedVariant.id,
            name: item.selectedVariant.name,
            price: item.selectedVariant.price
        } : null
      }));

      const result = await orderService.createOrder({
        buyerId: "guest_pos", 
        buyerName: buyerName || "Umum",
        sellerId: user.uid,
        sellerName: userData.shopName || userData.fullName || "Toko Member",
        sellerType: "member",
        coopId: userData.coopId || "public",
        items: orderItems,
        totalAmount: totalAmount,
        paymentMethod: paymentType === 'qris' ? "transfer" : "pos_cash", // Sesuaikan metode bayar
        paymentStatus: "paid",
        status: "completed",
        isOffline: true,
        notes: paymentType === 'qris' ? "Transaksi Kasir Mandiri (QRIS)" : "Transaksi Kasir Mandiri (Tunai)"
      });

      setLastOrder({
        orderNumber: result.orderNumber,
        buyerName: buyerName || "Umum",
        items: cart,
        totalAmount: totalAmount,
        paymentMethod: paymentType === 'qris' ? 'transfer' : 'pos_cash',
        createdAt: new Date().toISOString(),
        cash: paymentType === 'qris' ? totalAmount : parseInt(cashAmount), // Cegah minus di struk jika QRIS
      });

      toast.success("Transaksi berhasil!");
      
      // Reset state
      setCart([]);
      setCashAmount("");
      setBuyerName("Umum");
      setPaymentType('cash');
      setIsCheckoutOpen(false);
      setIsMobileCartOpen(false);
      setIsSuccessOpen(true);
      fetchProducts();
      
    } catch (error) {
      console.error(error);
      toast.error("Gagal memproses transaksi");
    } finally {
      setProcessing(false);
    }
  };

  const CartContent = () => (
    <div className="flex flex-col h-full">
        {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-zinc-400 text-sm">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-20" />
              Keranjang kosong
            </div>
        ) : (
            <>
                <ScrollArea className="flex-1 p-3 -mx-3 sm:mx-0">
                    <div className="space-y-2">
                    {cart.map((item) => (
                        <div key={item.cartId} className="flex gap-2 bg-white p-2 rounded border border-zinc-100 shadow-sm">
                        <div className="flex flex-col items-center justify-center gap-1 bg-zinc-50 rounded border w-8 shrink-0">
                            <button onClick={() => updateQty(item.cartId, 1)} className="h-5 w-full hover:bg-zinc-200 flex items-center justify-center text-green-600"><Plus className="w-3 h-3"/></button>
                            <span className="text-xs font-bold">{item.qty}</span>
                            <button onClick={() => updateQty(item.cartId, -1)} className="h-5 w-full hover:bg-zinc-200 flex items-center justify-center text-red-600"><Minus className="w-3 h-3"/></button>
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className="font-medium text-sm truncate text-zinc-800">{item.name}</p>
                            {item.selectedVariant && (
                                <span className="text-[10px] text-zinc-500 bg-zinc-50 px-1 rounded w-fit border mb-0.5">
                                    {item.selectedVariant.name}
                                </span>
                            )}
                            <div className="flex justify-between items-center mt-0.5">
                                <span className="text-[10px] text-zinc-400">@{formatCurrency(item.price)}</span>
                                <span className="font-bold text-xs text-zinc-900">{formatCurrency(item.price * item.qty)}</span>
                            </div>
                        </div>
                        <button onClick={() => removeFromCart(item.cartId)} className="text-zinc-300 hover:text-red-500 self-center px-1">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        </div>
                    ))}
                    </div>
                </ScrollArea>

                <div className="pt-4 border-t bg-zinc-50 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:border-0 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-zinc-600">Total ({totalItems} item)</span>
                        <span className="text-xl font-extrabold text-blue-700">{formatCurrency(totalAmount)}</span>
                    </div>
                    
                    <Button 
                        className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 font-bold shadow-sm"
                        disabled={cart.length === 0}
                        onClick={() => setIsCheckoutOpen(true)}
                    >
                        <Banknote className="w-4 h-4 mr-2" /> Bayar Sekarang
                    </Button>
                </div>
            </>
        )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] gap-4 pb-20 lg:pb-0 relative">
      
      {/* LEFT: Product Catalog */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 print:hidden">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Cari produk..." 
              className="pl-9 bg-white h-10 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchProducts} title="Refresh Produk">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Category Filter */}
        <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex gap-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            selectedCategory === cat 
                            ? "bg-zinc-800 text-white border-zinc-800 shadow-sm" 
                            : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </ScrollArea>

        {/* Product Grid */}
        <ScrollArea className="flex-1 bg-zinc-100/50 rounded-xl border border-zinc-200 p-4">
          {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-300" /></div>
          ) : filteredProducts.length === 0 ? (
             <div className="text-center py-20 text-zinc-400">Produk tidak ditemukan</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className={`
                    cursor-pointer hover:border-blue-500 hover:shadow-md transition-all active:scale-95 group relative
                    ${product.stock <= 0 && !product.hasVariants ? 'opacity-60 bg-zinc-50' : 'bg-white'}
                  `}
                  onClick={() => (product.stock > 0 || product.hasVariants) && handleProductClick(product)}
                >
                  <CardContent className="p-3 flex flex-col h-full justify-between min-h-[100px]">
                    <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] text-zinc-400 uppercase font-medium tracking-wider truncate max-w-[80px]">
                                {product.category}
                            </span>
                            {product.hasVariants && (
                                <Badge variant="secondary" className="text-[9px] px-1 h-4 bg-blue-50 text-blue-600 border-blue-100">
                                    Varian
                                </Badge>
                            )}
                        </div>
                        
                        <h3 className="font-bold text-sm text-zinc-900 leading-snug line-clamp-2" title={product.name}>
                            {product.name}
                        </h3>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-100/50">
                        <div className="flex justify-between items-end">
                            <p className="font-bold text-blue-700 text-sm">
                                {formatCurrency(product.price)}
                            </p>
                            <div className="text-right">
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${product.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {product.hasVariants ? 'Stok Var' : (product.stock > 0 ? `Sisa ${product.stock}` : 'Habis')}
                                </span>
                            </div>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* RIGHT: Cart (DESKTOP) */}
      <div className="hidden lg:flex w-96 flex-col bg-white rounded-xl border shadow-sm h-full print:hidden">
        <div className="p-4 border-b bg-zinc-50 rounded-t-xl">
          <h2 className="font-bold text-base flex items-center gap-2 text-zinc-800">
            <ShoppingCart className="w-4 h-4" /> Keranjang Toko
          </h2>
        </div>
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <CartContent />
        </div>
      </div>

      {/* FLOATING CART (MOBILE) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
         <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
            <SheetTrigger asChild>
                <Button className="w-full h-12 bg-zinc-900 text-white flex justify-between items-center px-4 hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="font-bold">{totalItems} Item</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-lg">{formatCurrency(totalAmount)}</span>
                        <ChevronUp className="w-5 h-5" />
                    </div>
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0 rounded-t-2xl">
                <SheetHeader className="px-4 py-3 border-b bg-zinc-50 rounded-t-2xl">
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" /> Keranjang Kasir
                    </SheetTitle>
                </SheetHeader>
                <div className="flex-1 p-4 overflow-hidden flex flex-col">
                    <CartContent />
                </div>
            </SheetContent>
         </Sheet>
      </div>

      {/* --- DIALOG PILIH VARIAN --- */}
      <Dialog open={!!selectedProductForVariant} onOpenChange={() => setSelectedProductForVariant(null)}>
        <DialogContent className="sm:max-w-sm">
            <DialogHeader>
                <DialogTitle>Pilih Varian Produk</DialogTitle>
                <DialogDescription className="font-medium text-zinc-900">
                    {selectedProductForVariant?.name}
                </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[300px] pr-2">
                <div className="grid gap-2">
                    {selectedProductForVariant?.variants?.map((v) => (
                        <Button 
                            key={v.id}
                            variant="outline" 
                            className="justify-between h-auto py-3 px-4 hover:border-blue-300 hover:bg-blue-50"
                            disabled={v.stock <= 0}
                            onClick={() => addToCart(selectedProductForVariant, v)}
                        >
                            <span className="flex flex-col items-start text-left">
                                <span className="font-bold text-zinc-800">{v.name}</span>
                                <span className={`text-[10px] ${v.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    Stok: {v.stock}
                                </span>
                            </span>
                            <span className="font-bold text-blue-600">{formatCurrency(v.price)}</span>
                        </Button>
                    ))}
                </div>
            </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG CHECKOUT DENGAN QRIS --- */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran Kasir</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
             <div className="bg-zinc-50 p-4 rounded-lg text-center border">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Harus Dibayar</p>
                <p className="text-3xl font-extrabold text-zinc-900">{formatCurrency(totalAmount)}</p>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-600">Nama Pembeli</label>
                <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Umum" className="h-9" />
             </div>

             {/* Toggles Pembayaran (Tunai vs QRIS) */}
             <div className="flex bg-zinc-100 p-1 rounded-lg">
               <button 
                  onClick={() => setPaymentType('cash')} 
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${paymentType === 'cash' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
               >
                 Tunai
               </button>
               <button 
                  onClick={() => setPaymentType('qris')} 
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${paymentType === 'qris' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
               >
                 QRIS / Transfer
               </button>
             </div>

             {/* Kondisional Area Berdasarkan Tipe Pembayaran */}
             {paymentType === 'cash' ? (
                // --- KONTEN TUNAI ---
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-600">Uang Tunai</label>
                      <div className="relative">
                          <Banknote className="absolute left-3 top-2.5 h-4 w-4 text-green-600" />
                          <Input 
                              type="number" 
                              className="pl-9 h-10 text-lg font-bold" 
                              placeholder="0" 
                              value={cashAmount}
                              onChange={(e) => setCashAmount(e.target.value)}
                              autoFocus
                          />
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {[10000, 20000, 50000, 100000].map(amt => (
                              <button 
                                  key={amt} 
                                  onClick={() => setCashAmount(amt.toString())}
                                  className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded text-[10px] font-medium text-zinc-600 border"
                              >
                                {amt/1000}k
                              </button>
                          ))}
                          <button onClick={() => setCashAmount(totalAmount.toString())} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-medium border border-blue-200">Uang Pas</button>
                      </div>
                  </div>

                  <div className={`p-3 rounded border flex justify-between items-center ${changeAmount >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <span className="text-sm font-medium">Kembalian</span>
                      <span className={`text-lg font-bold ${changeAmount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {formatCurrency(Math.abs(changeAmount))}
                      </span>
                  </div>
                </div>
             ) : (
                // --- KONTEN QRIS ---
                <div className="flex flex-col items-center justify-center py-2 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  {userData?.qrisUrl ? (
                    <>
                      <div className="w-56 h-56 relative rounded-xl overflow-hidden border-2 border-dashed border-blue-200 bg-zinc-50 p-2">
                          <Image 
                            src={userData.qrisUrl} 
                            alt="QRIS Pembayaran" 
                            fill 
                            className="object-contain p-2" 
                          />
                      </div>
                      <p className="text-xs text-zinc-500 text-center max-w-xs">
                        Arahkan pelanggan untuk scan QRIS ini. Pastikan saldo sudah masuk sebelum klik Selesai.
                      </p>
                    </>
                  ) : (
                    <div className="text-center p-6 bg-red-50 text-red-600 rounded-xl w-full border border-red-100">
                        <QrCode className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-semibold">QRIS belum diatur</p>
                        <p className="text-xs mt-1">Anda belum mengunggah QRIS di menu Pengaturan Toko.</p>
                    </div>
                  )}
                </div>
             )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} disabled={processing}>Batal</Button>
            <Button 
                onClick={handleCheckout} 
                disabled={
                  processing || 
                  (paymentType === 'cash' && changeAmount < 0) || 
                  (paymentType === 'qris' && !userData?.qrisUrl)
                } 
                className="bg-green-600 hover:bg-green-700"
            >
               {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Selesai"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- REUSABLE RECEIPT DIALOG --- */}
      <ReceiptDialog 
         open={isSuccessOpen} 
         onOpenChange={setIsSuccessOpen} 
         order={lastOrder}
         coopName={userData?.coopName || "Koperasi"}
         cashierName={userData?.fullName || "Member"}
      />
    </div>
  );
}