"use client";

import { useCartStore } from "@/lib/store/use-cart-store";
import { formatCurrency } from "@/lib/utils";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetClose 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CartSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CartSheet({ open, onClose }: CartSheetProps) {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Keranjang Belanja
            <span className="text-sm font-normal text-zinc-500 ml-auto">
                {items.length} Barang
            </span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8 text-center">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-zinc-300" />
            </div>
            <div>
                <h3 className="font-semibold text-lg">Keranjang Kosong</h3>
                <p className="text-zinc-500 text-sm mt-1">
                    Belum ada barang yang ditambahkan. Yuk mulai belanja!
                </p>
            </div>
            <SheetClose asChild>
                <Button variant="outline">Lanjut Belanja</Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="py-6 space-y-6">
                {items.map((item) => (
                  <div key={item.cartId} className="flex gap-4 group">
                    {/* Image */}
                    <div className="relative w-20 h-20 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-100">
                      {item.images && item.images.length > 0 ? (
                        <Image
                          src={item.images[0]}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-300">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-medium text-sm text-zinc-900 truncate pr-6" title={item.name}>
                            {item.name}
                        </h4>
                        
                        {/* Varian Info */}
                        {item.selectedVariant && (
                            <p className="text-xs text-zinc-500 mt-0.5 bg-zinc-50 px-1.5 py-0.5 rounded w-fit border border-zinc-100">
                                Varian: {item.selectedVariant.name}
                            </p>
                        )}
                        
                        <p className="text-sm font-bold text-red-600 mt-1">
                            {formatCurrency(item.price)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-zinc-50 rounded-md p-1 border border-zinc-100">
                          <button
                            onClick={() => updateQuantity(item.cartId, Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-zinc-600 transition-all disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-zinc-600 transition-all"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.cartId)}
                          className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                          title="Hapus item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 border-t bg-zinc-50/50 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-zinc-500 text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totalPrice())}</span>
                </div>
                <div className="flex justify-between text-zinc-900 font-bold text-lg">
                    <span>Total</span>
                    <span className="text-red-600">{formatCurrency(totalPrice())}</span>
                </div>
              </div>
              <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-base font-bold shadow-lg shadow-red-100" onClick={handleCheckout}>
                Checkout ({items.length}) <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}