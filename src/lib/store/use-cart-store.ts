import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, ProductVariant } from '@/types/product';

export interface CartItem extends Product {
  cartId: string; // ID Unik per item di keranjang (karena produk sama beda varian = beda item)
  quantity: number;
  selectedVariant?: ProductVariant; // Data varian yang dipilih
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number, variant?: ProductVariant) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity, variant) => {
        const currentItems = get().items;
        
        // Buat ID unik kombinasi produk + varian
        const variantSuffix = variant ? `-${variant.id}` : '';
        const uniqueCartId = `${product.id}${variantSuffix}`;
        
        const existingItem = currentItems.find((item) => item.cartId === uniqueCartId);

        if (existingItem) {
          // Jika sudah ada, update quantity
          set({
            items: currentItems.map((item) =>
              item.cartId === uniqueCartId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          // Jika belum ada, tambah item baru
          const price = variant ? variant.price : product.price;
          
          set({
            items: [
              ...currentItems,
              { 
                ...product, 
                cartId: uniqueCartId,
                quantity, 
                selectedVariant: variant,
                price: price // Override harga dengan harga varian jika ada
              },
            ],
          });
        }
      },

      removeItem: (cartId) => {
        set({ items: get().items.filter((item) => item.cartId !== cartId) });
      },

      updateQuantity: (cartId, quantity) => {
        set({
          items: get().items.map((item) =>
            item.cartId === cartId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),

      totalPrice: () => get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
    }),
    {
      name: 'coop-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);