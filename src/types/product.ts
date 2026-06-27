export interface ProductVariant {
  id: string; // ID unik untuk varian (bisa timestamp atau random string)
  name: string; // Contoh: "Merah - XL" atau "Kemasan 250gr"
  price: number;
  stock: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  
  // Harga & Stok Utama (Digunakan jika tidak ada varian)
  price: number; 
  stock: number; 
  
  images: string[];
  imageUrl?: string; // Legacy support
  
  // Fitur Varian (Rich Product)
  hasVariants: boolean;
  variants?: ProductVariant[];
  
  // Logistik & Atribut Tambahan
  weight: number; // Dalam gram
  condition: 'new' | 'used'; // Baru / Bekas
  minOrder: number; // Minimal pembelian
  
  isBundle?: boolean;
  bundleItems?: {
    productId: string;
    name: string;
    price: number;
    qty: number;
    sellerName: string;
  }[];
  // Relasi Penjual
  sellerId: string;
  sellerName: string;
  sellerType: 'coop' | 'member';
  coopId: string;
  coopName: string;
  
  // Status & Visibility
  isPublic: boolean;
  status: 'active' | 'archived' | 'draft' | 'inactive';
  marketplaceStatus: 'published_marketplace' | 'pending_review' | 'rejected' | 'draft';
  
  // [BARU] Status Visibilitas POS
  // Jika undefined/null, dianggap TRUE (Backward Compatibility untuk data lama)
  isPosActive?: boolean; 

  rejectionReason?: string | null;
  
  // Statistik
  viewCount?: number;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  
  // Metadata Admin
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}