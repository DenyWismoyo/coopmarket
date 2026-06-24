import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy, 
  limit, 
  startAfter, 
  DocumentSnapshot,
  deleteDoc,
  doc
} from "firebase/firestore";
import { Expense } from "@/types/business";

const COLLECTION = "expenses";

export const expenseService = {
  addExpense: async (data: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      const payload = {
        ...data,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, COLLECTION), payload);
      return true;
    } catch (error) { throw error; }
  },

  getExpensesPaginated: async (coopId: string, pageSize = 20, lastDoc?: DocumentSnapshot) => {
    try {
      let q = query(
        collection(db, COLLECTION),
        where("coopId", "==", coopId),
        orderBy("date", "desc"),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      
      return {
        data,
        lastVisible: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error("Error fetching expenses:", error);
      // [FIX] Tambahkan lastVisible: undefined agar konsisten dengan tipe return
      return { data: [], hasMore: false, lastVisible: undefined };
    }
  },

  // Fungsi Khusus SHU
  getExpenses: async (coopId: string) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("coopId", "==", coopId),
        orderBy("date", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    } catch (error) {
      console.error("Error fetching all expenses for SHU:", error);
      return [];
    }
  },

  deleteExpense: async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (error) { throw error; }
  },
  
  getExpensesByDateRange: async (coopId: string, startDate: Date, endDate: Date) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("coopId", "==", coopId),
        where("date", ">=", startDate.toISOString()),
        where("date", "<=", endDate.toISOString()),
        orderBy("date", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    } catch (error) {
      console.error("Error fetching expenses report:", error);
      return [];
    }
  }
};