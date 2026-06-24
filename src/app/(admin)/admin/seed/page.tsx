"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { productService } from "@/services/product.service";
import { cooperativeService } from "@/services/cooperative.service";
import { Cooperative } from "@/types/cooperative";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Database, AlertTriangle } from "lucide-react";

// Data Dummy Generator
const PRODUCT_TEMPLATES = [
  { name: "Beras Premium", category: "Sembako", price: 65000, img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80" },
  { name: "Minyak Goreng 2L", category: "Sembako", price: 35000, img: "https://images.unsplash.com/photo-1620698129787-73c3cb7a2a49?auto=format&fit=crop&w=400&q=80" },
  { name: "Gula Pasir 1kg", category: "Sembako", price: 16000, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80" },
  { name: "Kopi Robusta Lokal", category: "Minuman", price: 45000, img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80" },
  { name: "Keripik Pisang", category: "Makanan", price: 15000, img: "https://images.unsplash.com/photo-1599488615731-7e512819a088?auto=format&fit=crop&w=400&q=80" },
  { name: "Batik Tulis", category: "Fashion", price: 250000, img: "https://images.unsplash.com/photo-1598218679084-28b9824c94b7?auto=format&fit=crop&w=400&q=80" },
  { name: "Sabun Cuci Piring", category: "Kebutuhan Rumah", price: 12000, img: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=400&q=80" },
  { name: "Telur Ayam 1kg", category: "Sembako", price: 28000, img: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=400&q=80" },
  { name: "Mie Instan Dus", category: "Makanan", price: 110000, img: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=400&q=80" },
  { name: "Air Mineral Galon", category: "Minuman", price: 20000, img: "https://images.unsplash.com/photo-1616118132534-381148898bb4?auto=format&fit=crop&w=400&q=80" }
];

export default function SeedPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [coops, setCoops] = useState<Cooperative[]>([]);
  const [selectedCoopId, setSelectedCoopId] = useState("");

  // Hanya Super Admin yang boleh akses
  useEffect(() => {
    if (userData?.role === 'super_admin') {
      const fetchCoops = async () => {
        const data = await cooperativeService.getAllCooperatives();
        setCoops(data);
      };
      fetchCoops();
    }
  }, [userData]);

  const handleSeed = async () => {
    if (!selectedCoopId) {
      toast.error("Pilih unit koperasi terlebih dahulu!");
      return;
    }

    if (!confirm(`Yakin ingin menyuntikkan 20 produk dummy ke koperasi ini?`)) return;

    setLoading(true);
    try {
      const selectedCoop = coops.find(c => c.id === selectedCoopId);
      if (!selectedCoop) throw new Error("Koperasi tidak valid");

      const promises = [];

      // Generate 20 Produk
      for (let i = 0; i < 20; i++) {
        // Pilih template acak
        const template = PRODUCT_TEMPLATES[i % PRODUCT_TEMPLATES.length];
        const randomStock = Math.floor(Math.random() * 50) + 10;
        const randomPriceVar = Math.floor(Math.random() * 5000); // Variasi harga sedikit
        
        const productData = {
          name: `${template.name} ${i + 1}`, // Tambah suffix biar unik
          description: `Deskripsi lengkap untuk produk ${template.name}. Produk berkualitas dari koperasi ${selectedCoop.name}.`,
          category: template.category,
          price: template.price + randomPriceVar,
          stock: randomStock,
          weight: 500, // Default 500g
          condition: "new",
          minOrder: 1,
          images: [template.img], // Gambar placeholder dari Unsplash
          
          // Data Penjual (Atas nama Koperasi)
          sellerId: selectedCoop.id, // ID Koperasi sebagai seller
          sellerName: selectedCoop.name,
          sellerType: "coop",
          coopId: selectedCoop.id,
          coopName: selectedCoop.name,
          
          // Status Langsung Tayang
          status: "active",
          marketplaceStatus: "published_marketplace",
          isPublic: true,
          
          hasVariants: false, // Default simple product
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          soldCount: Math.floor(Math.random() * 20), // Fake sold count biar rame
          rating: (Math.random() * 2 + 3).toFixed(1) // Fake rating 3.0 - 5.0
        };

        // Panggil Service Create
        promises.push(productService.createProduct(productData as any));
      }

      await Promise.all(promises);
      toast.success("Berhasil injeksi 20 produk!");
      
    } catch (error) {
      console.error(error);
      toast.error("Gagal melakukan seeding");
    } finally {
      setLoading(false);
    }
  };

  if (userData?.role !== 'super_admin') {
    return <div className="p-8 text-center text-red-500">Akses Ditolak: Khusus Super Admin</div>;
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Database className="w-5 h-5" /> Data Seeding Tool
          </CardTitle>
          <CardDescription>
            Tools ini digunakan untuk mengisi data produk dummy secara otomatis untuk keperluan testing/demo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Target Unit Koperasi</label>
            <Select onValueChange={setSelectedCoopId} value={selectedCoopId}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Pilih Koperasi..." />
              </SelectTrigger>
              <SelectContent>
                {coops.map((coop) => (
                  <SelectItem key={coop.id} value={coop.id}>
                    {coop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-yellow-100 p-3 rounded text-xs text-yellow-800 flex gap-2">
             <AlertTriangle className="w-4 h-4 shrink-0" />
             <p>Peringatan: Aksi ini akan menambahkan 20 produk baru ke database Firestore. Pastikan kuota database cukup.</p>
          </div>

          <Button 
            className="w-full bg-orange-600 hover:bg-orange-700" 
            onClick={handleSeed}
            disabled={loading || !selectedCoopId}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sedang Menginjeksi...</>
            ) : (
              "Mulai Injeksi (Generate 20 Produk)"
            )}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}