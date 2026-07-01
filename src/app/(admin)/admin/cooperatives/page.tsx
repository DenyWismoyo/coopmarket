// File: src/app/(admin)/admin/cooperatives/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { cooperativeService } from "@/services/cooperative.service";
import { Cooperative } from "@/types/cooperative";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
   Loader2, Plus, Building2, MapPin, Phone, Search, Trash2, Edit, CheckCircle, Mail 
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
      // [PERBAIKAN]: Ambil semua data dengan melempar argumen 'false' pada onlyActive
      const data = await cooperativeService.getAllCooperatives(false);
      setCooperatives(data);
    } catch (error) {
      toast.error("Gagal memuat data unit organisasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.role === 'super_admin') {
      fetchData();
    }
  }, [userData]);

  // Handler Hapus / Tolak
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus/menolak unit "${name}"? Data yang terhapus tidak bisa dikembalikan.`)) return;
    
    try {
      await cooperativeService.deleteCooperative(id);
      toast.success("Unit organisasi berhasil dihapus");
      fetchData(); // Refresh
    } catch (error) {
      toast.error("Gagal menghapus unit");
    }
  };

  // Handler Persetujuan Pengajuan Baru
  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`Setujui pengajuan unit "${name}"?`)) return;

    try {
      await cooperativeService.updateCooperative(id, { status: "active" });
      toast.success("Unit berhasil disetujui! Jangan lupa buatkan Akun Admin untuk unit ini.");
      
      // Refresh data agar pindah ke tab aktif
      fetchData();
    } catch (error) {
      toast.error("Gagal menyetujui unit");
    }
  };

  // Filter Data
  const activeCoops = cooperatives.filter(c => 
     c.status === 'active' && 
     (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingCoops = cooperatives.filter(c => 
     c.status === 'suspended' && 
     (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Manajemen Unit Organisasi</h1>
          <p className="text-zinc-500">
            Kelola daftar unit organisasi ("Tenant") yang terdaftar dan tinjau pengajuan baru.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <Link href="/admin/admins/new" className="flex-1 md:flex-none">
             <Button variant="outline" className="w-full text-blue-700 border-blue-200 hover:bg-blue-50">
               Buat Akun Admin
             </Button>
           </Link>
           <Link href="/admin/cooperatives/new" className="flex-1 md:flex-none">
             <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
               <Plus className="w-4 h-4 mr-2" /> Tambah Unit
             </Button>
           </Link>
        </div>
      </div>

      <Card>
        <Tabs defaultValue="active" className="w-full">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4 border-b">
            <TabsList className="bg-zinc-100">
              <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold">
                 Unit Aktif
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">
                 Pengajuan Baru {pendingCoops.length > 0 && <span className="ml-2 bg-blue-200 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full">{pendingCoops.length}</span>}
              </TabsTrigger>
            </TabsList>
            
            <div className="w-full md:w-72 relative">
               <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
               <Input 
                  placeholder="Cari nama atau kota..." 
                  className="pl-8 bg-zinc-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            
            {/* TAB UNIT AKTIF */}
            <TabsContent value="active" className="mt-0">
              <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead>Nama Organisasi</TableHead>
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
                  ) : activeCoops.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                        Belum ada unit organisasi aktif yang terdaftar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeCoops.map((coop) => (
                      <TableRow key={coop.id} className="hover:bg-zinc-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 overflow-hidden border">
                               {coop.logoUrl ? (
                                 <img src={coop.logoUrl} alt={coop.name} className="w-full h-full object-cover" />
                               ) : (
                                 <Building2 className="w-5 h-5" />
                               )}
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900">{coop.name}</div>
                              <div className="text-xs text-zinc-500 font-mono">ID: {coop.id.slice(0,8)}</div>
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
                          <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200 border-0 shadow-none">
                            Aktif
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                             <Link href={`/admin/cooperatives/new?edit=${coop.id}`}>
                               <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-blue-600">
                                 <Edit className="w-4 h-4" />
                               </Button>
                             </Link>
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
            </TabsContent>

            {/* TAB PENGAJUAN BARU */}
            <TabsContent value="pending" className="mt-0">
              <Table>
                <TableHeader className="bg-blue-50/50">
                  <TableRow>
                    <TableHead>Pengajuan Organisasi</TableHead>
                    <TableHead>Domisili</TableHead>
                    <TableHead>Kontak Pendaftar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi Persetujuan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-zinc-300" />
                      </TableCell>
                    </TableRow>
                  ) : pendingCoops.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16 text-zinc-500 flex flex-col items-center justify-center border-b-0">
                         <CheckCircle className="w-10 h-10 text-zinc-300 mb-2" />
                         Semua bersih. Tidak ada pengajuan baru.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingCoops.map((coop) => (
                      <TableRow key={coop.id} className="hover:bg-blue-50/30">
                        <TableCell>
                          <div className="font-semibold text-zinc-900 text-base">{coop.name}</div>
                          <div className="text-xs text-zinc-500 max-w-[250px] line-clamp-2 mt-1">{coop.description || "Tidak ada deskripsi."}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-zinc-800">{coop.city}</div>
                          <div className="text-xs text-zinc-500 truncate max-w-[150px]">{coop.address}</div>
                        </TableCell>
                        <TableCell>
                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-zinc-600">
                                <Phone className="w-3 h-3 text-zinc-400" /> {coop.phone}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-zinc-600">
                                <Mail className="w-3 h-3 text-zinc-400" /> {coop.email}
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0 shadow-none">
                            Menunggu
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                             <Button 
                                variant="outline" 
                                className="h-9 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleDelete(coop.id, coop.name)} 
                              >
                               Tolak
                             </Button>
                             <Button 
                                className="h-9 bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleApprove(coop.id, coop.name)} 
                              >
                               <CheckCircle className="w-4 h-4 mr-2" /> Setujui
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}