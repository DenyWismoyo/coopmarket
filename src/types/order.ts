// Status Pesanan
export type OrderStatus = 
  | 'pending'              // Menunggu konfirmasi penjual
  | 'pending_payment'      // Menunggu pembayaran
  | 'pending_confirmation' // Menunggu konfirmasi (setelah bayar)
  | 'processing'           // Sedang diproses
  | 'shipped'              // Dikirim
  | 'ready_for_pickup'     // Siap diambil
  | 'completed'            // Selesai
  | 'cancelled';           // Batal

// Status Pembayaran
export type PaymentStatus = 'paid' | 'unpaid' | 'refunded';

// Metode Pembayaran
export type PaymentMethod = 
  | 'transfer' 
  | 'cod' 
  | 'pos_cash' 
  | 'gateway' 
  | 'manual_wa';

// Detail Item dalam Pesanan
export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
  
  // Info Varian (Penting untuk POS & Marketplace)
  variantName?: string | null; // Legacy support
  variant?: {                  // Struktur baru yang detail
    id?: string;
    name: string;
    price: number;
  } | null;
  
  sellerId: string;
  note?: string;
}

// Interface Utama Order
export interface Order {
  id: string;
  
  invoiceNumber?: string; // Legacy
  orderNumber?: string;   // Format baru (ORD-...)
  
  // Pembeli
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  shippingAddress: string;
  
  // Penjual
  sellerId: string;
  sellerName: string;
  sellerType?: 'coop' | 'member';
  sellerPhone?: string;
  coopId: string;
  
  // Data
  items: OrderItem[];
  
  // Keuangan
  totalAmount: number;
  subtotal?: number;
  shippingCost?: number;
  
  // Status
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProofUrl?: string;
  
  // Metadata
  notes?: string;
  rejectionReason?: string;
  isOffline?: boolean; // Penanda transaksi POS
  
  createdAt: string;
  updatedAt: string;
}