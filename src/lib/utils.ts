import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV/${year}${month}${day}/${random}`;
}

/**
 * UPDATED: Fungsi Kompresi Gambar
 * - Menggunakan format WebP untuk ukuran lebih kecil & support transparansi
 * - Max width default dinaikkan ke 1200px untuk kualitas detail produk
 * - Kualitas default 0.8 (WebP 80% mirip JPEG 60-70% tapi lebih tajam)
 */
export async function compressImage(
  file: File, 
  quality = 0.8, 
  maxWidth = 1200
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize logika: pertahankan aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            reject(new Error('Gagal membuat canvas context'));
            return;
        }

        // Gambar ulang image ke canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert ke Blob/File WebP
        // WebP support transparansi & kompresi lebih baik dari JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Ganti ekstensi file asli ke .webp
              const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              
              const compressedFile = new File([blob], newName, {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Gagal kompresi gambar'));
            }
          },
          'image/webp', // Output format
          quality
        );
      };
      
      img.onerror = (error) => reject(error);
    };
    
    reader.onerror = (error) => reject(error);
  });
}