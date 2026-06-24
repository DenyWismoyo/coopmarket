// Tipe untuk Pengeluaran Operasional
export interface Expense {
  id: string;
  coopId: string;
  title: string;
  amount: number;
  category: 'operasional' | 'gaji' | 'pemeliharaan' | 'aset' | 'lainnya';
  date: string; // ISO String
  description?: string;
  attachmentUrl?: string; // Bukti struk
  recordedBy: string; // Admin ID
  createdAt: string;
}

// Tipe untuk Mutasi Stok (Inventory)
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'return';

export interface StockMovement {
  id: string;
  coopId: string;
  productId: string;
  productName: string;
  sku?: string;
  type: StockMovementType;
  quantity: number; // Positif
  previousStock: number;
  newStock: number;
  
  // Konteks Keuangan (untuk HPP)
  buyPrice?: number; // Harga beli saat restock
  totalValue?: number; // quantity * buyPrice
  
  // Metadata
  reason?: string; // Wajib jika adjustment (opname)
  referenceId?: string; // ID Order atau ID Supplier
  performedBy: string; // Admin ID
  createdAt: string;
}

// Tipe untuk Pengumuman
export interface Announcement {
  id: string;
  coopId: string;
  title: string;
  content: string;
  targetAudience: 'all' | 'members' | 'public';
  isActive: boolean;
  bannerUrl?: string;
  authorName: string;
  createdAt: string;
  validUntil?: string;
}