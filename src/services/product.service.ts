import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentSnapshot,
  getCountFromServer 
} from "firebase/firestore";
import { Product } from "@/types/product";

const COLLECTION = "products";

export const productService = {
  // [UPDATED] Mengambil produk admin, defaultnya mengecualikan yang 'archived'
  getAllProductsByCoop: async (coopId: string) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("coopId", "==", coopId),
        where("status", "!=", "archived"), // Filter out archived
        orderBy("status", "asc"), // Firestore limitation: if using !=, must order by that field first or have composite index
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      
      // Fallback filtering jika index belum siap
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      return products.filter(p => p.status !== 'archived');
    } catch (error) {
      console.error("Error fetching all coop products:", error);
      // Fallback query simpel jika query di atas gagal karena index
      const qSimple = query(
        collection(db, COLLECTION),
        where("coopId", "==", coopId),
        orderBy("createdAt", "desc")
      );
      const snapSimple = await getDocs(qSimple);
      return snapSimple.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .filter(p => p.status !== 'archived');
    }
  },

  getAllProductsByCoopPaginated: async (coopId: string, pageSize = 20, lastDoc?: DocumentSnapshot) => {
    try {
      // Query dasar tanpa filter status != archived untuk menghindari masalah index kompleks
      // Filter dilakukan di client side atau query spesifik jika diperlukan
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
      // Filter client-side untuk soft delete
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .filter(p => p.status !== 'archived');

      return {
        data,
        lastVisible: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error("Error fetching coop products paginated:", error);
      return { data: [], hasMore: false };
    }
  },

  // PUBLIC: Ambil Produk Etalase
  getPublicProducts: async (
    category?: string, 
    pageSize = 12, 
    lastDoc?: DocumentSnapshot
  ) => {
    try {
      const constraints: QueryConstraint[] = [
        where("marketplaceStatus", "==", "published_marketplace"), 
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      ];

      if (category && category !== "Semua") {
        constraints.push(where("category", "==", category));
      }

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(collection(db, COLLECTION), ...constraints);
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));

      return { 
        data, 
        lastVisible: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error("Error fetching public products:", error);
      throw error;
    }
  },

  // PUBLIC: Ambil Produk per Toko
  getPublicProductsByCoop: async (coopId: string) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("coopId", "==", coopId),
        where("marketplaceStatus", "==", "published_marketplace"),
        where("status", "==", "active"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      console.error("Error fetching coop products:", error);
      return [];
    }
  },

  // KHUSUS POS: Ambil produk aktif & POS Active
  getPOSProducts: async (coopId: string) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("coopId", "==", coopId),
        where("status", "==", "active"), 
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      // Filter isPosActive (undefined dianggap true untuk backward compatibility)
      return allProducts.filter(p => p.isPosActive !== false);
    } catch (error) {
      console.error("Error fetching POS products:", error);
      return [];
    }
  },

  // CRUD Dasar
  getProductById: async (id: string) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() } as Product;
    } catch (error) {
      console.error("Error fetching product detail:", error);
      throw error;
    }
  },

  createProduct: async (data: any) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION), data);
        return docRef.id;
    } catch (error) { throw error; }
  },

  updateProduct: async (id: string, data: any) => {
    try {
        const docRef = doc(db, COLLECTION, id);
        await updateDoc(docRef, data);
    } catch (error) { throw error; }
  },

  // [UPDATED] Soft Delete Implementation
  deleteProduct: async (id: string) => {
    try {
        const docRef = doc(db, COLLECTION, id);
        // Soft Delete: Ubah status jadi archived
        await updateDoc(docRef, { 
          status: 'archived',
          marketplaceStatus: 'draft', // Cabut dari marketplace juga
          deletedAt: new Date().toISOString()
        });
    } catch (error) { throw error; }
  },

  // MEMBER: Ambil Produk Saya (Updated Paginated)
  getSellerProductsPaginated: async (sellerId: string, pageSize = 15, lastDoc?: DocumentSnapshot) => {
    try {
      let q = query(
        collection(db, COLLECTION), 
        where("sellerId", "==", sellerId), 
        // Filter out archived for sellers too
        where("status", "!=", "archived"),
        orderBy("status", "asc"),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      // Fallback filter
      const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(p => p.status !== 'archived');
      
      return {
        data,
        lastVisible: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) { throw error; }
  },
  
  // Legacy support
  getSellerProducts: async (sellerId: string) => {
      try {
        const q = query(collection(db, COLLECTION), where("sellerId", "==", sellerId), where("status", "!=", "archived"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      } catch (error) { throw error; }
  },

  // ADMIN: Ambil Produk Pending Review
  getPendingProducts: async (coopId: string) => {
    try {
      const q = query(
        collection(db, COLLECTION), 
        where("coopId", "==", coopId), 
        where("marketplaceStatus", "==", "pending_review"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) { throw error; }
  },

  // ADMIN ACTIONS: Approve & Reject
  approveProduct: async (id: string, adminId: string) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        marketplaceStatus: "published_marketplace",
        status: "active",
        approvedBy: adminId,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) { throw error; }
  },

  rejectProduct: async (id: string, reason: string, adminId: string) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        marketplaceStatus: "rejected",
        status: "inactive",
        rejectionReason: reason,
        rejectedBy: adminId,
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) { throw error; }
  }
};