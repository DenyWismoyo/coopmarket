// File: src/app/(admin)/admin/unit-products/[id]/page.tsx
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

export default function EditUnitProductPage() {
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
            router.push("/admin/unit-products");
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
        <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
           <Skeleton className="h-10 w-10 rounded-full" />
           <div className="space-y-2"><Skeleton className="h-6 w-48 rounded-lg" /><Skeleton className="h-4 w-64 rounded-lg" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 w-full">
      <div className="flex flex-col gap-1 pb-4 border-b border-zinc-200">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/unit-products">
            <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Edit Produk Unit</h1>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span className="font-medium text-zinc-700">{product?.name}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full">
        <ProductForm mode="edit" initialData={product} />
      </div>
    </div>
  );
}