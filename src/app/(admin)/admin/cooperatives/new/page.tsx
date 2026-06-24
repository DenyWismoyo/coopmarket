"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cooperativeService } from "@/services/cooperative.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { Cooperative, CooperativeStatus } from "@/types/cooperative";

// Definisi tipe form agar type-safe
interface CooperativeFormData {
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  status: CooperativeStatus;
}

export default function CooperativeFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState<CooperativeFormData>({
    name: "",
    code: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (editId) {
      setIsEditMode(true);
      const fetchDetail = async () => {
        setLoading(true);
        try {
          const data = await cooperativeService.getCooperativeById(editId);
          if (data) {
            setFormData({
              name: data.name || "",
              code: data.code || "",
              city: data.city || "",
              address: data.address || "",
              phone: data.phone || "",
              email: data.email || "",
              description: data.description || "",
              status: data.status || "active",
            });
          }
        } catch (error) {
          console.error("Gagal memuat data:", error);
          toast.error("Gagal memuat data koperasi");
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [editId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode && editId) {
        // Update
        await cooperativeService.updateCooperative(editId, formData);
        toast.success("Data koperasi berhasil diperbarui");
      } else {
        // Create - Service akan handle createdAt/updatedAt
        await cooperativeService.createCooperative(formData);
        toast.success("Unit koperasi baru berhasil dibuat");
      }
      router.push("/admin/cooperatives");
    } catch (error) {
      toast.error("Gagal menyimpan data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CooperativeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/cooperatives">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            {isEditMode ? "Edit Unit Koperasi" : "Tambah Unit Baru"}
          </h1>
          <p className="text-zinc-500">
            Lengkapi profil unit koperasi untuk ditampilkan di sistem.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profil Koperasi</CardTitle>
            <CardDescription>Informasi dasar mengenai unit koperasi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Unit Koperasi <span className="text-red-500">*</span></Label>
                <Input 
                  id="name"
                  required
                  placeholder="Koperasi Merah Putih Unit..."
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Kode Unit (Opsional)</Label>
                <Input 
                  id="code"
                  placeholder="Contoh: KMP-JOGJA"
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Kota / Kabupaten <span className="text-red-500">*</span></Label>
                <Input 
                  id="city"
                  required
                  placeholder="Nama Kota"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status Operasional</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val) => handleChange("status", val as CooperativeStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Non-Aktif</SelectItem>
                    <SelectItem value="suspended">Ditangguhkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea 
                id="address"
                required
                placeholder="Jalan, No, RT/RW..."
                className="h-24"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="email">Email Resmi</Label>
                <Input 
                  id="email"
                  type="email"
                  required
                  placeholder="admin@koperasi..."
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No. Telepon / WhatsApp</Label>
                <Input 
                  id="phone"
                  required
                  placeholder="08..."
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 mt-6" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {isEditMode ? "Simpan Perubahan" : "Buat Unit Baru"}
            </Button>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}