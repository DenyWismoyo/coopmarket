// File: src/types/user.ts
export type UserRole = 'super_admin' | 'admin' | 'unit_admin' | 'member' | 'customer';
export type UserStatus = 'active' | 'archived' | 'needs_reactivation' | 'pending';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  
  // Data Opsional
  photoURL?: string;
  phone?: string;
  address?: string;
  
  // Multi-Tenant Context
  coopId?: string;
  coopName?: string;
  
  // Khusus Anggota Koperasi
  nik?: string; 
  joinedAt?: string;
  
  // [BARU] Saldo Teragregasi (Denormalisasi untuk performa)
  savingsPokok?: number;
  savingsWajib?: number;
  savingsSukarela?: number;

  // Khusus Penjual
  shopName?: string;
  shopDescription?: string;
  qrisUrl?: string;
  
  createdAt: string;
  updatedAt: string;
}