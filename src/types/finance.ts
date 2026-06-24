// File: src/types/finance.ts

export type SavingType = 'pokok' | 'wajib' | 'sukarela';

export interface SavingTransaction {
  id: string;
  userId: string;
  userName?: string; // Tambahkan ini
  coopId: string;
  type: 'pokok' | 'wajib' | 'sukarela';
  amount: number;
  date: string;
  notes?: string;
  adminId?: string;
  createdAt?: any;
}

export interface MemberFinancialSummary {
  userId: string;
  totalSimpananPokok: number;
  totalSimpananWajib: number;
  totalSimpananSukarela: number;
  totalBelanja: number; // Untuk hitung SHU Jasa Anggota
  estimatedSHU: number;
}