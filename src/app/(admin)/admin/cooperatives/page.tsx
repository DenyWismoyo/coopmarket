"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { cooperativeService } from "@/services/cooperative.service";
import { Cooperative } from "@/types/cooperative";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Building2, 
  MapPin, 
  Phone, 
  Search, 
  Trash2, 
  Edit 
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminCooperativesPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect jika bukan super_admin
  useEffect(() => {
    if (userData && userData.role !== 'super_admin') {
      toast.error("Akses ditolak. Halaman ini khusus Super Admin.");
      router.push("/admin");
    }
  }, [userData, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await cooperativeService.getAllCooperatives();
      setCooperatives(data);
    } catch (error) {
      toast.error("Gagal memuat data koperasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.role === 'super_admin') {
      fetchData();
    }
  }, [userData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus unit koperasi "${name}"? Data yang terhapus tidak bisa dikembalikan.`)) return;
    
    try {
      await cooperativeService.deleteCooperative(id);
      toast.success("Unit koperasi berhasil dihapus");
      fetchData(); // Refresh
    } catch (error) {
      toast.error("Gagal menghapus unit");
    }
  };

  const filteredCoops = cooperatives.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Manajemen Unit Koperasi</h1>
          <p className="text-zinc-500">
            Kelola daftar unit koperasi ("Tenant") yang terdaftar dalam sistem.
          </p>
        </div>
        <Link href="/admin/cooperatives/new">
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Tambah Unit Baru
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Daftar Unit Aktif</CardTitle>
          <div className="w-72 relative">
             <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
             <Input 
                placeholder="Cari nama atau kota..." 
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Koperasi</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-zinc-300" />
                  </TableCell>
                </TableRow>
              ) : filteredCoops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                    Belum ada unit koperasi yang terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCoops.map((coop) => (
                  <TableRow key={coop.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 overflow-hidden">
                           {coop.logoUrl ? (
                             <img src={coop.logoUrl} alt={coop.name} className="w-full h-full object-cover" />
                           ) : (
                             <Building2 className="w-5 h-5" />
                           )}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900">{coop.name}</div>
                          <div className="text-xs text-zinc-500">{coop.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <MapPin className="w-4 h-4 text-zinc-400" />
                        {coop.city}
                      </div>
                      <div className="text-xs text-zinc-400 pl-6 truncate max-w-[150px]">{coop.address}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <Phone className="w-4 h-4 text-zinc-400" />
                        {coop.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={coop.status === 'active' ? 'default' : 'secondary'} className={coop.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}>
                        {coop.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                         {/* Edit Button Placeholder */}
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-blue-600">
                           <Edit className="w-4 h-4" />
                         </Button>
                         <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-zinc-500 hover:text-red-600"
                            onClick={() => handleDelete(coop.id, coop.name)}
                          >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}