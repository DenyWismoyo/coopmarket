"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { productService } from "@/services/product.service";
import { ProductForm } from "@/components/modules/products/product-form";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      if (params.id) {
        try {
          const data = await productService.getProductById(params.id as string);
          if (data) {
            setProduct(data);
          } else {
            toast.error("Produk tidak ditemukan");
            router.push("/admin/products");
          }
        } catch (error) {
          console.error(error);
          toast.error("Gagal memuat produk");
        } finally {
          setLoading(false);
        }
      }
    }
    fetchProduct();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-full">
        {/* Skeleton Header */}
        <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
           <Skeleton className="h-10 w-10 rounded-full" />
           <div className="space-y-2">
             <Skeleton className="h-6 w-48 rounded-lg" />
             <Skeleton className="h-4 w-64 rounded-lg" />
           </div>
        </div>
        
        {/* Skeleton Content - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-6">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
           </div>
           <div className="space-y-6">
              <Skeleton className="h-[150px] w-full rounded-xl" />
              <Skeleton className="h-[250px] w-full rounded-xl" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 w-full">
      {/* Header Page */}
      <div className="flex flex-col gap-1 pb-4 border-b border-zinc-200">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Edit Produk</h1>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span>Produk Unit</span>
              <span>•</span>
              <span className="font-medium text-zinc-700">{product?.name}</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-zinc-500 max-w-3xl ml-11">
          Perbarui informasi produk, harga, stok, atau varian. Perubahan akan langsung terlihat di marketplace.
        </p>
      </div>

      {/* Container Form
        ProductForm sudah didesain responsif (1 kolom di mobile, 2 kolom di desktop).
        Kita hanya perlu memastikan container pembungkusnya tidak membatasi lebar secara paksa.
      */}
      <div className="w-full">
        <ProductForm mode="edit" initialData={product} />
      </div>
    </div>
  );
}