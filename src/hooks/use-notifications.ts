// File: src/hooks/use-notifications.ts
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-provider";

export function useNotifications() {
  const { user, userData } = useAuth();

  // 1. Query untuk Admin: Hitung Pesanan Masuk (Pending)
  const { data: adminPendingOrdersCount = 0 } = useQuery({
    queryKey: ['notif-admin-orders', userData?.coopId],
    queryFn: async () => {
      if (!userData?.coopId || !['admin', 'super_admin', 'unit_admin'].includes(userData.role)) return 0;
      const q = query(collection(db, "orders"), where("coopId", "==", userData.coopId), where("status", "==", "pending"));
      const snap = await getCountFromServer(q);
      return snap.data().count;
    },
    enabled: !!userData?.coopId,
    refetchInterval: 30000, // Cek otomatis setiap 30 detik
  });

  // 2. Query untuk Admin: Hitung Validasi Anggota Baru
  const { data: adminPendingMembersCount = 0 } = useQuery({
    queryKey: ['notif-admin-members', userData?.coopId],
    queryFn: async () => {
      if (!userData?.coopId || !['admin', 'super_admin', 'unit_admin'].includes(userData.role)) return 0;
      const q = query(collection(db, "users"), where("coopId", "==", userData.coopId), where("status", "==", "pending"));
      const snap = await getCountFromServer(q);
      return snap.data().count;
    },
    enabled: !!userData?.coopId,
    refetchInterval: 30000,
  });

  // 3. Query untuk Member: Hitung Pesanan Masuk ke Tokonya (Seller)
  const { data: memberPendingSalesCount = 0 } = useQuery({
    queryKey: ['notif-member-sales', user?.uid],
    queryFn: async () => {
      if (!user?.uid || userData?.role !== 'member') return 0;
      const q = query(collection(db, "orders"), where("sellerId", "==", user.uid), where("status", "==", "pending"));
      const snap = await getCountFromServer(q);
      return snap.data().count;
    },
    enabled: !!user?.uid,
    refetchInterval: 30000,
  });

  // 4. Kompilasi Daftar Notifikasi untuk Navbar Dropdown
  const notificationsList = [];
  if (adminPendingOrdersCount > 0) {
    notificationsList.push({ 
      id: 'admin-orders', 
      title: `${adminPendingOrdersCount} Pesanan Koperasi Baru`, 
      desc: 'Ada pesanan pelanggan yang menunggu diproses.', 
      href: '/admin/orders' 
    });
  }
  if (adminPendingMembersCount > 0) {
    notificationsList.push({ 
      id: 'admin-members', 
      title: `${adminPendingMembersCount} Pendaftar Baru`, 
      desc: 'Butuh validasi untuk menjadi anggota aktif.', 
      href: '/admin/approvals' 
    });
  }
  if (memberPendingSalesCount > 0) {
    notificationsList.push({ 
      id: 'member-sales', 
      title: `${memberPendingSalesCount} Pesanan Toko Baru`, 
      desc: 'Segera proses pesanan yang masuk ke toko Anda.', 
      href: '/member/sales' 
    });
  }

  const totalNotifications = adminPendingOrdersCount + adminPendingMembersCount + memberPendingSalesCount;

  return {
    hasAdminOrders: adminPendingOrdersCount > 0,
    hasAdminMembers: adminPendingMembersCount > 0,
    hasMemberSales: memberPendingSalesCount > 0,
    totalNotifications,
    notificationsList
  };
}