import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject, SettableMetadata } from "firebase/storage";

export interface UploadMetadata {
  uploaderName?: string;
  productName?: string;
}

export const storageService = {
  // Upload satu file dengan penamaan khusus & Cache Control
  uploadImage: async (file: File, path: string = "products", metadata?: UploadMetadata): Promise<string> => {
    try {
      // 1. Format Tanggal: YYYYMMDDHHMM
      const now = new Date();
      const dateStr = now.toISOString().replace(/[-:T]/g, "").slice(0, 12); 
      
      // 2. Bersihkan Nama (Hapus spasi & karakter aneh)
      const cleanUploader = (metadata?.uploaderName || "user").replace(/[^a-zA-Z0-9]/g, "").slice(0, 15);
      const cleanProduct = (metadata?.productName || "item").replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
      const randomSuffix = Math.floor(Math.random() * 1000).toString();

      // 3. Tentukan Ekstensi (Gunakan ekstensi dari file hasil kompresi, biasanya .webp)
      const extension = file.name.split('.').pop();
      const filename = `${dateStr}-${cleanUploader}-${cleanProduct}-${randomSuffix}.${extension}`;
      
      const storageRef = ref(storage, `images/${path}/${filename}`);
      
      // 4. METADATA CACHE (PENTING UNTUK PERFORMA)
      // 'public, max-age=31536000, immutable' -> Cache di browser selama 1 tahun.
      // Karena nama file kita unik (ada timestamp + random), kita aman melakukan cache permanen.
      const uploadMetadata: SettableMetadata = {
        cacheControl: 'public, max-age=31536000, immutable',
        contentType: file.type // Pastikan content type sesuai (misal image/webp)
      };

      // 5. Upload dengan metadata
      const snapshot = await uploadBytes(storageRef, file, uploadMetadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  deleteImage: async (imageUrl: string) => {
    // Implementasi delete fisik jika diperlukan nanti
    // Catatan: Menghapus file tidak menghapus cache di browser user yang sudah mendownloadnya
    // sampai cache expired, tapi URL download baru tidak akan bisa diakses.
    console.log("Request delete:", imageUrl);
    return true;
  }
};