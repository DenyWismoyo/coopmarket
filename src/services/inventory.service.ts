import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  runTransaction,
  orderBy, 
  limit,
  doc,
  DocumentSnapshot,
  startAfter
} from "firebase/firestore";
import { StockMovement } from "@/types/business";

const MOVEMENT_COLLECTION = "stock_movements";
const PRODUCT_COLLECTION = "products";

export const inventoryService = {
  // 1. RESTOCK (Barang Masuk)
  // Menambah stok produk + Mencatat riwayat + (Opsional) Update HPP/BuyPrice
  restockProduct: async (
    productId: string, 
    qty: number, 
    buyPrice: number, 
    meta: { coopId: string, performedBy: string, productName: string }
  ) => {
    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, PRODUCT_COLLECTION, productId);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) throw new Error("Produk tidak ditemukan");
        
        const currentStock = productDoc.data().stock || 0;
        const newStock = currentStock + qty;

        // Update Produk
        transaction.update(productRef, {
          stock: newStock,
          updatedAt: new Date().toISOString()
          // Disini bisa ditambahkan logika Average Costing jika diperlukan nanti
        });

        // Catat Mutasi
        const movementRef = doc(collection(db, MOVEMENT_COLLECTION));
        const movementData: Omit<StockMovement, 'id'> = {
          coopId: meta.coopId,
          productId,
          productName: meta.productName,
          type: 'in',
          quantity: qty,
          previousStock: currentStock,
          newStock: newStock,
          buyPrice: buyPrice,
          totalValue: qty * buyPrice,
          performedBy: meta.performedBy,
          createdAt: new Date().toISOString()
        };
        transaction.set(movementRef, movementData);
      });
      return true;
    } catch (error) {
      console.error("Restock error:", error);
      throw error;
    }
  },

  // 2. STOCK OPNAME (Penyesuaian Stok Fisik)
  // Memaksa stok produk menjadi angka tertentu (bisa naik/turun)
  stockOpname: async (
    productId: string, 
    actualQty: number, 
    reason: string,
    meta: { coopId: string, performedBy: string, productName: string }
  ) => {
    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, PRODUCT_COLLECTION, productId);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) throw new Error("Produk tidak ditemukan");
        
        const currentStock = productDoc.data().stock || 0;
        const diff = actualQty - currentStock;
        
        if (diff === 0) return; // Tidak ada perubahan

        // Update Produk
        transaction.update(productRef, {
          stock: actualQty,
          updatedAt: new Date().toISOString()
        });

        // Catat Mutasi
        const movementRef = doc(collection(db, MOVEMENT_COLLECTION));
        const movementData: Omit<StockMovement, 'id'> = {
          coopId: meta.coopId,
          productId,
          productName: meta.productName,
          type: 'adjustment', // Opname
          quantity: Math.abs(diff),
          previousStock: currentStock,
          newStock: actualQty,
          reason: reason,
          performedBy: meta.performedBy,
          createdAt: new Date().toISOString()
        };
        transaction.set(movementRef, movementData);
      });
      return true;
    } catch (error) {
      console.error("Opname error:", error);
      throw error;
    }
  },

  // 3. RIWAYAT MUTASI
  getMovementsPaginated: async (coopId: string, pageSize = 20, lastDoc?: DocumentSnapshot) => {
    try {
      let q = query(
        collection(db, MOVEMENT_COLLECTION),
        where("coopId", "==", coopId),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement));
      
      return {
        data,
        lastVisible: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error("Fetch movements error:", error);
      return { data: [], hasMore: false };
    }
  },

  // Untuk Export Laporan
  getMovementsByDateRange: async (coopId: string, startDate: Date, endDate: Date) => {
    try {
      const q = query(
        collection(db, MOVEMENT_COLLECTION),
        where("coopId", "==", coopId),
        where("createdAt", ">=", startDate.toISOString()),
        where("createdAt", "<=", endDate.toISOString()),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement));
    } catch (error) { return []; }
  }
};