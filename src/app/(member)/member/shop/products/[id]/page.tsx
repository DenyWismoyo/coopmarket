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
import { ArrowLeft } from "lucide-react";

export default function MemberEditProductPage() {
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
            router.push("/member/shop/products");
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
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
           <Skeleton className="h-8 w-8 rounded-full" />
           <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
        <div className="flex flex-col md:flex-row gap-8">
           <Skeleton className="flex-1 h-[500px] rounded-xl" />
           <Skeleton className="flex-1 h-[500px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/member/shop/products">
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 text-zinc-500 hover:text-zinc-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Edit Produk</h1>
        </div>
        <p className="text-sm text-zinc-500">
          Perbarui informasi produk <strong>{product?.name}</strong>.
        </p>
      </div>

      <ProductForm mode="edit" initialData={product} />
    </div>
  );
}