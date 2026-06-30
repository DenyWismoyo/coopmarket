import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  runTransaction,
  serverTimestamp,
  orderBy,
  updateDoc,
  getDoc,
  limit,
  startAfter,
  DocumentSnapshot
} from "firebase/firestore";
import { UserProfile } from "@/types/user";

export const memberService = {
  // =========================================
  // ADMIN FUNCTIONS (Verifikasi & Manajemen)
  // =========================================

  // [BARU] Ambil List Anggota per Unit dengan Pagination
  // Digunakan di: Halaman Admin Members
  getMembersByCoopPaginated: async (coopId: string, pageSize = 20, lastDoc?: DocumentSnapshot) => {
    try {
      let q = query(
        collection(db, "users"),
        where("coopId", "==", coopId),
        where("role", "==", "member"), // Hanya ambil role member
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      
      return {
        data,
        lastVisible: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error("Error fetching paginated members:", error);
      return { data: [], lastVisible: undefined, hasMore: false };
    }
  },

  getPendingMembers: async (coopId?: string) => {
    try {
      let q;
      if (coopId && coopId !== 'pusat') {
        q = query(
          collection(db, "users"),
          where("role", "==", "member"),
          where("status", "==", "pending"),
          where("coopId", "==", coopId),
          orderBy("createdAt", "desc")
        );
      } else {
        q = query(
          collection(db, "users"),
          where("role", "==", "member"),
          where("status", "==", "pending"),
          orderBy("createdAt", "desc")
        );
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    } catch (error) {
      console.error("Error fetching pending members:", error);
      throw error;
    }
  },

  approveMember: async (userId: string, adminId: string, coopId: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userId);
        const savingsRef = doc(collection(db, "savings_transactions"));
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) throw new Error("User tidak ditemukan");

        transaction.update(userRef, {
          status: "active",
          joinedAt: serverTimestamp(),
          savingsPokok: 100000,
          updatedAt: serverTimestamp(),
          approvedBy: adminId
        });

        transaction.set(savingsRef, {
          userId: userId,
          coopId: coopId,
          type: "pokok",
          amount: 100000,
          date: new Date().toISOString(),
          notes: "Setoran Awal Simpanan Pokok (Aktivasi Anggota)",
          adminId: adminId,
          createdAt: serverTimestamp()
        });
      });
      return true;
    } catch (error) { throw error; }
  },

  rejectMember: async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        status: "rejected",
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) { throw error; }
  },

// [TAMBAHAN BARU] Traksi Anggota & Produk Hari ke Hari
  getMemberTractionByDateRange: async (coopId: string, startDate: Date, endDate: Date) => {
    try {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
  
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      // 1. Ambil Data Anggota Baru
      let qUsers = query(
        collection(db, "users"),
        where("coopId", "==", coopId),
        where("role", "==", "member")
      );
      const snapshotUsers = await getDocs(qUsers);

      // 2. Ambil Data Produk Titipan Anggota
      let qProducts = query(
        collection(db, "products"),
        where("coopId", "==", coopId),
        where("sellerType", "==", "member")
      );
      const snapshotProducts = await getDocs(qProducts);
  
      // Inisialisasi wadah untuk grouping per tanggal
      const tractionMap: Record<string, any> = {};

      // Helper untuk memastikan objek tanggal ada
      const initDate = (date: string) => {
        if (!tractionMap[date]) {
          tractionMap[date] = { 
            date, 
            newMembers: 0, 
            active: 0, 
            pending: 0, 
            totalSimpanan: 0,
            newProducts: 0,
            potentialProductValue: 0
          };
        }
      };
      
      // Proses & Grouping Data Anggota
      snapshotUsers.docs.forEach(doc => {
        const user = doc.data() as UserProfile;
        let dateStr = new Date().toISOString().split('T')[0];
        
        if (user.createdAt) {
          if (typeof user.createdAt === 'string') dateStr = user.createdAt.split('T')[0];
          else if ((user.createdAt as any).toDate) dateStr = (user.createdAt as any).toDate().toISOString().split('T')[0];
        }
          
        if (dateStr >= startStr && dateStr <= endStr) {
          initDate(dateStr);
          tractionMap[dateStr].newMembers += 1;
          if (user.status === 'active') tractionMap[dateStr].active += 1;
          if (user.status === 'pending') tractionMap[dateStr].pending += 1;
          
          const simpananTotal = (user.savingsPokok || 0) + (user.savingsWajib || 0) + (user.savingsSukarela || 0);
          tractionMap[dateStr].totalSimpanan += simpananTotal;
        }
      });

      // Proses & Grouping Data Produk
      snapshotProducts.docs.forEach(doc => {
        const product = doc.data();
        let dateStr = new Date().toISOString().split('T')[0];
        
        if (product.createdAt) {
          if (typeof product.createdAt === 'string') dateStr = product.createdAt.split('T')[0];
          else if ((product.createdAt as any).toDate) dateStr = (product.createdAt as any).toDate().toISOString().split('T')[0];
        }

        if (dateStr >= startStr && dateStr <= endStr) {
          initDate(dateStr);
          tractionMap[dateStr].newProducts += 1;
          // Menghitung potensi penjualan (Harga x Stok yang diupload hari itu)
          const potentialValue = (product.price || 0) * (product.stock || 0);
          tractionMap[dateStr].potentialProductValue += potentialValue;
        }
      });
  
      // Urutkan dari tanggal terlama ke terbaru
      return Object.values(tractionMap).sort((a: any, b: any) => a.date.localeCompare(b.date));
      
    } catch (error) {
      console.error("Error fetching member & product traction:", error);
      throw error;
    }
  },

  // =========================================
  // MEMBER FUNCTIONS (Fitur Anggota)
  // =========================================

  getMyOrders: async (userId: string) => { /* Legacy */
    try {
      const q = query(collection(db, "orders"), where("buyerId", "==", userId), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    } catch (error) { return []; }
  },

  getMyOrdersPaginated: async (userId: string, pageSize = 10, lastDoc?: DocumentSnapshot) => {
    try {
      let q = query(
        collection(db, "orders"),
        where("buyerId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
      if (lastDoc) q = query(q, startAfter(lastDoc));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      return { data, lastVisible: snapshot.docs[snapshot.docs.length - 1], hasMore: snapshot.docs.length === pageSize };
    } catch (error) { return { data: [], lastVisible: undefined, hasMore: false }; }
  },

getMySales: async (userId: string) => { /* Legacy */
    try {
      // [PERBAIKAN] Menggunakan array-contains
      const q = query(collection(db, "orders"), where("participatingSellerIds", "array-contains", userId), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    } catch (error) { return []; }
  },

  getMySalesPaginated: async (userId: string, pageSize = 10, lastDoc?: DocumentSnapshot) => {
    try {
      // [PERBAIKAN] Menggunakan array-contains
      let q = query(
        collection(db, "orders"),
        where("participatingSellerIds", "array-contains", userId),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (lastDoc) q = query(q, startAfter(lastDoc));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      return { data, lastVisible: snapshot.docs[snapshot.docs.length - 1], hasMore: snapshot.docs.length === pageSize };
    } catch (error) { return { data: [], lastVisible: undefined, hasMore: false }; }
  },

  getMemberStats: async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.data();
      return {
        savingsTotal: (userData?.savingsPokok || 0) + (userData?.savingsWajib || 0) + (userData?.savingsSukarela || 0),
        loanTotal: userData?.loanTotal || 0,
        status: userData?.status || 'pending'
      };
    } catch (error) { return { savingsTotal: 0, loanTotal: 0, status: 'unknown' }; }
  },
// [DISEDIAKAN AUTO-HEAL] Rekap Penjualan Harian (Milik Unit & Anggota)
  getMemberDailySalesByDateRange: async (coopId: string, startDate: Date, endDate: Date) => {
    try {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const startStr = startDate.toISOString();
      const endStr = end.toISOString();

      const qOrders = query(
        collection(db, "orders"),
        where("coopId", "==", coopId),
        where("createdAt", ">=", startStr),
        where("createdAt", "<=", endStr)
      );
      const snapshotOrders = await getDocs(qOrders);

      const salesMap: Record<string, any> = {};

      snapshotOrders.docs.forEach(doc => {
        const order = doc.data();
        if (order.status === 'cancelled') return;

        const dateStr = order.createdAt.split('T')[0];

        order.items?.forEach((item: any) => {
          const sellerId = item.sellerId || coopId;
          const sellerType = item.sellerType || (sellerId === coopId ? 'coop' : 'member');
          
          let sellerName = item.sellerName;
          if (!sellerName) {
            sellerName = sellerType === 'coop' 
              ? (order.coopName || 'Unit Koperasi') 
              : `Anggota (ID: ${sellerId.slice(0, 5)})`;
          }

          const key = `${dateStr}_${sellerId}`;

          if (!salesMap[key]) {
            salesMap[key] = {
              date: dateStr,
              sellerId,
              sellerName,
              sellerType,
              totalItems: 0,
              totalOmset: 0
            };
          }

          salesMap[key].totalItems += item.quantity;
          salesMap[key].totalOmset += (item.price * item.quantity);
        });
      });

      // --- AWAL LOGIKA AUTO-HEAL ON-THE-FLY ---
      // Cari data yang namanya masih menggunakan fallback "Anggota (ID:..."
      const missingIds = [...new Set(
        Object.values(salesMap)
          .filter((s: any) => s.sellerName.startsWith('Anggota (ID:'))
          .map((s: any) => s.sellerId)
      )];

      if (missingIds.length > 0) {
        // Lakukan fetch profil user yang namanya hilang secara paralel (Sangat Cepat)
        const userPromises = missingIds.map(id => getDoc(doc(db, "users", id)));
        const userSnaps = await Promise.all(userPromises);
        const nameMap: Record<string, string> = {};
        
        userSnaps.forEach(snap => {
          if (snap.exists()) {
            nameMap[snap.id] = snap.data().fullName || snap.data().shopName || 'Member';
          }
        });

        // Terapkan (Patch) nama asli ke dalam map laporan
        Object.values(salesMap).forEach((s: any) => {
          if (s.sellerName.startsWith('Anggota (ID:') && nameMap[s.sellerId]) {
            s.sellerName = nameMap[s.sellerId];
          }
        });
      }
      // --- AKHIR LOGIKA AUTO-HEAL ON-THE-FLY ---

      return Object.values(salesMap).sort((a: any, b: any) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.sellerName.localeCompare(b.sellerName);
      });

    } catch (error) {
      console.error("Error fetching daily sales:", error);
      throw error;
    }
  },
};