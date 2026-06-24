// File: src/app/(admin)/admin/products/new/page.tsx
import { ProductForm } from "@/components/modules/products/product-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CreateProductPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Produk</h1>
          <p className="text-sm text-zinc-500">
            Tambahkan produk baru ke inventaris koperasi.
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <ProductForm mode="create" />
      </div>
    </div>
  );
}