import { useState, useEffect } from "react";
import { productService } from "@/services/product.service";
import { Product } from "@/types/product"; // Pastikan path import tipe benar
import { DocumentSnapshot } from "firebase/firestore";

// Hook untuk mengambil produk publik (Marketplace)
export function usePublicProducts(category?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State tambahan untuk pagination jika nanti diperlukan di UI
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        // Panggil service yang sekarang mengembalikan object { data, lastVisible, hasMore }
        const response = await productService.getPublicProducts(category);
        
        // [FIX] Ambil array produk dari properti .data
        setProducts(response.data);
        
        // Simpan state pagination
        setLastDoc(response.lastVisible);
        setHasMore(response.hasMore);
        
      } catch (err) {
        console.error(err);
        setError("Gagal memuat produk.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [category]);

  return { products, loading, error, hasMore, lastDoc };
}

// Hook untuk mengambil detail satu produk
export function useProductDetail(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    async function fetchDetail() {
      try {
        setLoading(true);
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat detail produk.");
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [id]);

  return { product, loading, error };
}