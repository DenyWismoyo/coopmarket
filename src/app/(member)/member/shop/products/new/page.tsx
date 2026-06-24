"use client";

import { ProductForm } from "@/components/modules/products/product-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MemberCreateProductPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/member/shop/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Jual Produk Baru</h1>
          <p className="text-sm text-zinc-500">
            Tambahkan produk ke etalase toko Anda untuk divalidasi admin.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
           <CardTitle>Formulir Produk</CardTitle>
           <CardDescription>Lengkapi detail produk dengan jelas.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Hapus props onSubmit dan loading karena ProductForm menanganinya sendiri */}
          <ProductForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}