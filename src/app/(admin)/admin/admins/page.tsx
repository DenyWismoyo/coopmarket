"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, UserPlus, Building2, Trash2, ShieldOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";

export default function AdminManagementPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Proteksi: Hanya Super Admin
  useEffect(() => {
    if (userData && userData.role !== 'super_admin') {
      toast.error("Akses ditolak.");
      router.push('/admin');
    }
  }, [userData, router]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // Ambil semua user dengan role 'unit_admin'
      const q = query(
        collection(db, "users"), 
        where("role", "==", "unit_admin"),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data() as UserProfile);
      setAdmins(data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleDeactivate = async (uid: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const action = currentStatus === 'active' ? 'non-aktifkan' : 'aktifkan';
    
    if(!confirm(`Yakin ingin men-${action} admin ini?`)) return;

    try {
      await updateDoc(doc(db, "users", uid), { status: newStatus as any });
      toast.success(`Admin berhasil di-${action}`);
      setAdmins(admins.map(a => a.uid === uid ? { ...a, status: newStatus as any } : a));
    } catch (error) {
      toast.error("Gagal mengubah status");
    }
  };

  const filteredAdmins = admins.filter(a => 
    a.fullName.toLowerCase().includes(search.toLowerCase()) || 
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    (a.coopName && a.coopName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Admin Unit Koperasi</h1>
          <p className="text-zinc-500">
            Kelola akses admin untuk setiap unit koperasi.
          </p>
        </div>
        <Link href="/admin/admins/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="mr-2 h-4 w-4" /> Tambah Admin Baru
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-zinc-500" />
        <Input 
          placeholder="Cari nama, email, atau unit..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Admin</TableHead>
              <TableHead>Email (Login)</TableHead>
              <TableHead>Unit Koperasi</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-500">Memuat data...</TableCell></TableRow>
            ) : filteredAdmins.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-500">Belum ada admin unit terdaftar.</TableCell></TableRow>
            ) : (
              filteredAdmins.map((admin) => (
                <TableRow key={admin.uid}>
                  <TableCell className="font-medium">{admin.fullName}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-zinc-400" />
                        <span>{admin.coopName || "Unit Tidak Diketahui"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{admin.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={admin.status === 'active' ? 'success' : 'destructive'}>
                      {admin.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={admin.status === 'active' ? "text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"}
                        title={admin.status === 'active' ? "Suspend" : "Activate"}
                        onClick={() => handleDeactivate(admin.uid, admin.status)}
                    >
                        {admin.status === 'active' ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}