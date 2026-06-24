import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc,
  doc,
  orderBy
} from "firebase/firestore";
import { Announcement } from "@/types/business";

const COLLECTION = "announcements";

export const announcementService = {
  createAnnouncement: async (data: Omit<Announcement, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, COLLECTION), {
        ...data,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (error) { throw error; }
  },

  getAnnouncements: async (coopId: string) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("coopId", "==", coopId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
    } catch (error) { 
      console.error(error);
      return []; 
    }
  },

  deleteAnnouncement: async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (error) { throw error; }
  }
};