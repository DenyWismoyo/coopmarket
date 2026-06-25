// File: src/types/cooperative.ts
export type CooperativeStatus = 'active' | 'inactive' | 'suspended';

export interface Cooperative {
  id: string;
  name: string;
  code?: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  status: CooperativeStatus;
  logoUrl?: string;
  qrisUrl?: string;
  mapsUrl?: string;
  qrStoreUrl?: string; // [BARU] Field untuk QR Code Link Toko / Pameran
  
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}