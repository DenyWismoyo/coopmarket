import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  runTransaction,
  serverTimestamp,
  increment,
  getAggregateFromServer,
  sum,
  limit,
  startAfter,
  DocumentSnapshot
} from "firebase/firestore";
import { SavingTransaction } from "@/types";

const COLLECTION = "savings_transactions";

export const financeService = {
  addTransaction: async (data: Omit<SavingTransaction, 'id' | 'date'>) => {
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", data.userId);
        const newTxRef = doc(collection(db, COLLECTION));
        
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User tidak ditemukan!");

        transaction.set(newTxRef, {
          ...data,
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        });

        const fieldToUpdate = 
          data.type === 'pokok' ? 'savingsPokok' :
          data.type === 'wajib' ? 'savingsWajib' : 
          'savingsSukarela';

        transaction.update(userRef, {
          [fieldToUpdate]: increment(data.amount),
          updatedAt: serverTimestamp()
        });
      });
      return true;
    } catch (error) {
      console.error("Error adding saving transaction:", error);
      throw error;
    }
  },

  // [LEGACY] Tetap dipertahankan untuk backward compatibility
  getTransactionsByCoop: async (coopId: string) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("coopId", "==", coopId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingTransaction));
    } catch (error) {
      console.error("Error fetching coop transactions:", error);
      return [];
    }
  },

  // [BARU] Pagination untuk History Admin
  getTransactionsByCoopPaginated: async (coopId: string, pageSize = 20, lastDoc?: DocumentSnapshot) => {
    try {
      let q = query(
        collection(db, COLLECTION),
        where("coopId", "==", coopId),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingTransaction));

      return {
        data,
        lastVisible: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error("Error fetching paginated coop transactions:", error);
      return { data: [], lastVisible: undefined, hasMore: false };
    }
  },

  getCoopTotalAssets: async (coopId: string) => {
    try {
      const q = query(collection(db, COLLECTION), where("coopId", "==", coopId));
      const snapshot = await getAggregateFromServer(q, {
        totalAssets: sum('amount')
      });
      return snapshot.data().totalAssets || 0;
    } catch (error) {
      return 0;
    }
  },

  // ... (Fungsi member transaction yang sudah diupdate sebelumnya) ...
  getMemberTransactions: async (userId: string) => {
    try {
      const q = query(collection(db, COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingTransaction));
    } catch (error) { return []; }
  },

  getMemberTransactionsPaginated: async (userId: string, pageSize = 15, lastDoc?: DocumentSnapshot) => {
    try {
      let q = query(
        collection(db, COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
      if (lastDoc) q = query(q, startAfter(lastDoc));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingTransaction));
      return { data, lastVisible: snapshot.docs[snapshot.docs.length - 1], hasMore: snapshot.docs.length === pageSize };
    } catch (error) { return { data: [], lastVisible: undefined, hasMore: false }; }
  },

  getMemberBalance: async (userId: string) => {
    try {
      const { getDoc, doc } = await import("firebase/firestore"); 
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          pokok: data.savingsPokok || 0,
          wajib: data.savingsWajib || 0,
          sukarela: data.savingsSukarela || 0,
          total: (data.savingsPokok || 0) + (data.savingsWajib || 0) + (data.savingsSukarela || 0)
        };
      }
      return { pokok: 0, wajib: 0, sukarela: 0, total: 0 };
    } catch (error) { return { pokok: 0, wajib: 0, sukarela: 0, total: 0 }; }
  }
};