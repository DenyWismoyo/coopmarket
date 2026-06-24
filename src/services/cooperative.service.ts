import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  orderBy 
} from "firebase/firestore";
import { Cooperative } from "@/types/cooperative";

const COLLECTION = "cooperatives";

export const cooperativeService = {
  // 1. Ambil semua unit koperasi (dengan opsi filter status active)
  getAllCooperatives: async (onlyActive = true) => {
    try {
      let q = query(collection(db, COLLECTION), orderBy("name", "asc"));
      
      if (onlyActive) {
        q = query(q, where("status", "==", "active"));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Cooperative));
    } catch (error) {
      console.error("Error fetching cooperatives:", error);
      return [];
    }
  },

  // 2. Ambil detail satu koperasi berdasarkan ID
  getCooperativeById: async (id: string) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Cooperative;
      }
      return null;
    } catch (error) {
      console.error("Error fetching cooperative detail:", error);
      return null;
    }
  },

  // 3. Buat Unit Baru
  createCooperative: async (data: Omit<Cooperative, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const timestamp = new Date().toISOString();
      const payload = {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      const docRef = await addDoc(collection(db, COLLECTION), payload);
      return docRef.id;
    } catch (error) {
      console.error("Error creating cooperative:", error);
      throw error;
    }
  },

  // 4. Update Unit Koperasi
  updateCooperative: async (id: string, data: Partial<Cooperative>) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      
      const payload = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      delete (payload as any).id;

      // [FIX ERROR FIREBASE]: Hapus semua key yang bernilai undefined
      Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);

      await updateDoc(docRef, payload);
      return true;
    } catch (error) {
      console.error("Error updating cooperative:", error);
      throw error;
    }
  },

  // 5. Hapus Unit Koperasi
  deleteCooperative: async (id: string) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting cooperative:", error);
      throw error;
    }
  }
};