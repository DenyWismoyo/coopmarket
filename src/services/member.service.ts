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

  // ... (Fungsi getPendingMembers, approveMember, rejectMember tetap sama) ...
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

  // =========================================
  // MEMBER FUNCTIONS (Fitur Anggota)
  // =========================================

  // [Function yang sudah diupdate sebelumnya]
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
      const q = query(collection(db, "orders"), where("sellerId", "==", userId), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    } catch (error) { return []; }
  },

  getMySalesPaginated: async (userId: string, pageSize = 10, lastDoc?: DocumentSnapshot) => {
    try {
      let q = query(
        collection(db, "orders"),
        where("sellerId", "==", userId),
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
  }
};