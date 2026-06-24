export type CooperativeStatus = 'active' | 'inactive' | 'suspended';

export interface Cooperative {
  id: string;
  name: string;
  code?: string; // Kode unik, misal: KMP-SOLO
  city: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  status: CooperativeStatus;
  logoUrl?: string;
  
  // [BARU] Link Lokasi Maps
  mapsUrl?: string; 
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  
  // Optional: Statistik sederhana
  memberCount?: number; 
}