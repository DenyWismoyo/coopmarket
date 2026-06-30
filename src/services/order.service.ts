import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  getDoc,
  serverTimestamp,
  orderBy,
  runTransaction,
  increment,
  limit,
  startAfter,
  DocumentSnapshot,
  DocumentReference
} from "firebase/firestore";
import { Order } from "@/types/order";

const COLLECTION = "orders";

export const orderService = {
  // =========================================
  // 1. CREATE ORDER (POS & ONLINE)
  // =========================================
  createOrder: async (orderData: Partial<Order>) => {
    try {
      const date = new Date();
      const dateStr = date.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
      const random = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `ORD-${dateStr}-${random}`;

      const isPOS = !!orderData.isOffline;
      const initialStatus = isPOS ? 'completed' : 'pending';
      const initialPayment = isPOS ? 'paid' : 'unpaid';

      await runTransaction(db, async (transaction) => {
        const productReads: { ref: DocumentReference, doc: DocumentSnapshot, item: any }[] = [];

        if (orderData.items && orderData.items.length > 0) {
          for (const item of orderData.items) {
            if (!item.productId) continue; 
            const productRef = doc(db, "products", item.productId);
            const productDoc = await transaction.get(productRef);
            productReads.push({ ref: productRef, doc: productDoc, item: item });
          }
        }

        for (const read of productReads) {
            const { doc, item } = read;
            if (!doc.exists()) throw new Error(`Produk ID ${item.productId} tidak ditemukan.`);

            const productData = doc.data();
            const currentStock = productData.stock || 0;
            
            if (item.variant && item.variant.id) {
               const variants = productData.variants || [];
               const targetVariant = variants.find((v: any) => v.id === item.variant?.id);
               if (!targetVariant) throw new Error(`Varian produk ${item.productName} tidak valid.`);
               if (targetVariant.stock < item.quantity) throw new Error(`Stok varian ${item.productName} kurang.`);
            } else {
               if (currentStock < item.quantity) throw new Error(`Stok produk ${item.productName} kurang.`);
            }
        }

        const newOrderRef = doc(collection(db, COLLECTION));
        const cleanOrderData = JSON.parse(JSON.stringify(orderData));

        // [BARU] Kumpulkan semua pihak yang terlibat dalam transaksi ini
        const sellerIds = cleanOrderData.items?.map((item: any) => item.sellerId).filter(Boolean) || [];
        if (cleanOrderData.sellerId) sellerIds.push(cleanOrderData.sellerId);
        const participatingSellerIds = [...new Set(sellerIds)];

        transaction.set(newOrderRef, {
          ...cleanOrderData,
          participatingSellerIds, // Menyimpan array ID pemilik
          orderNumber,
          status: initialStatus,
          paymentStatus: initialPayment,
          sellerType: orderData.sellerType || 'coop', 
          paymentMethod: orderData.paymentMethod || (isPOS ? 'pos_cash' : 'manual_wa'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        if (isPOS) {
            for (const read of productReads) {
                const { ref, doc, item } = read;
                const productData = doc.data();

                if (item.variant && item.variant.id && productData?.variants) {
                    const updatedVariants = productData.variants.map((v: any) => {
                        if (v.id === item.variant?.id) {
                            const newStock = Math.max(0, v.stock - item.quantity);
                            return { ...v, stock: newStock };
                        }
                        return v;
                    });
                    const newTotalStock = updatedVariants.reduce((acc: number, v: any) => acc + v.stock, 0);
                    transaction.update(ref, { variants: updatedVariants, stock: newTotalStock, soldCount: increment(item.quantity) });
                } else {
                    transaction.update(ref, { stock: increment(-item.quantity), soldCount: increment(item.quantity) });
                }
            }
        }
      });

      return { id: orderNumber, orderNumber }; 
    } catch (error: any) {
      console.error("Error creating order:", error);
      throw new Error(error.message || "Gagal memproses transaksi");
    }
  },

  // =========================================
  // 2. READ ORDERS
  // =========================================
  getOrderById: async (orderId: string) => {
    try {
      const docRef = doc(db, COLLECTION, orderId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Order;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  getMyOrders: async (userId: string) => {
    try {
      const q = query(collection(db, COLLECTION), where("buyerId", "==", userId), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      return [];
    }
  },

  getOrdersBySeller: async (sellerId: string) => {
    try {
      // [PERBAIKAN] Menggunakan array-contains untuk mencari order yang menyertakan produk member
      const q = query(collection(db, COLLECTION), where("participatingSellerIds", "array-contains", sellerId), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      return [];
    }
  },

  getOrdersByCoopWithPagination: async (coopId: string, pageSize: number = 20, lastDoc?: DocumentSnapshot) => {
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
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

      return {
        data,
        lastVisible: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      return { data: [], lastVisible: undefined, hasMore: false };
    }
  },
  
  getOrdersByCoop: async (coopId: string) => {
     try {
      const q = query(collection(db, COLLECTION), where("coopId", "==", coopId), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      return [];
    }
  },

  // =========================================
  // 3. UPDATE & STATUS
  // =========================================
  updateOrderStatus: async (orderId: string, status: string, notes?: string, adminId: string = "system") => {
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, COLLECTION, orderId);
        const orderDoc = await transaction.get(orderRef);
        
        if (!orderDoc.exists()) throw new Error("Order tidak ditemukan");
        const orderData = orderDoc.data() as Order;

        const isCancelling = status === 'cancelled' && orderData.status !== 'cancelled';
        const hasDeductedStock = orderData.isOffline || 
                                 ['processing', 'shipped', 'ready_for_pickup', 'completed'].includes(orderData.status) || 
                                 orderData.paymentStatus === 'paid';
        
        const shouldRollbackStock = isCancelling && hasDeductedStock;
        const productReads: { ref: DocumentReference, doc: DocumentSnapshot, item: any }[] = [];

        if (shouldRollbackStock && orderData.items && orderData.items.length > 0) {
          for (const item of orderData.items) {
            if (!item.productId) continue;
            const productRef = doc(db, "products", item.productId);
            const productDoc = await transaction.get(productRef);
            productReads.push({ ref: productRef, doc: productDoc, item: item });
          }
        }

        const updateData: any = {
            status: status,
            updatedAt: new Date().toISOString()
        };
        
        if (status === 'completed') updateData.paymentStatus = 'paid';
        if (notes) updateData.notes = notes;

        transaction.update(orderRef, updateData);

        if (shouldRollbackStock) {
          for (const read of productReads) {
            const { ref, doc: pDoc, item } = read;
            if (!pDoc.exists()) continue;

            const productData = pDoc.data();
            let currentStock = productData.stock || 0;
            let newTotalStock = currentStock + item.quantity;

            if (item.variant && item.variant.id && productData?.variants) {
                const updatedVariants = productData.variants.map((v: any) => {
                    if (v.id === item.variant?.id) {
                        return { ...v, stock: v.stock + item.quantity };
                    }
                    return v;
                });
                newTotalStock = updatedVariants.reduce((acc: number, v: any) => acc + v.stock, 0);
                transaction.update(ref, { 
                  variants: updatedVariants, 
                  stock: newTotalStock, 
                  soldCount: increment(-item.quantity) 
                });
            } else {
                transaction.update(ref, { 
                  stock: increment(item.quantity), 
                  soldCount: increment(-item.quantity) 
                });
            }

            const movementRef = doc(collection(db, "stock_movements"));
            transaction.set(movementRef, {
              coopId: orderData.coopId,
              productId: item.productId,
              productName: item.productName,
              type: 'return',
              quantity: item.quantity,
              previousStock: currentStock,
              newStock: newTotalStock,
              referenceId: orderData.orderNumber || orderId,
              reason: `Pembatalan pesanan ${orderData.orderNumber || orderId}`,
              performedBy: adminId,
              createdAt: new Date().toISOString()
            });
          }
        }
      });
      return true;
    } catch (error: any) {
      throw new Error(error.message || "Gagal mengupdate status pesanan");
    }
  },

  // =========================================
  // 4. DATABASE MAINTENANCE & AUTO-HEAL
  // =========================================
  autoHealLegacyOrderItems: async (coopId: string) => {
    try {
      const q = query(collection(db, COLLECTION), where("coopId", "==", coopId));
      const snapshot = await getDocs(q);

      const cache: Record<string, { name: string, type: 'coop' | 'member' }> = {};
      let updatedCount = 0;

      const resolveSellerInfo = async (sellerId: string) => {
        if (cache[sellerId]) return cache[sellerId];
        
        const coopSnap = await getDoc(doc(db, "cooperatives", sellerId));
        if (coopSnap.exists()) {
          cache[sellerId] = { name: coopSnap.data().name, type: 'coop' };
          return cache[sellerId];
        }

        const userSnap = await getDoc(doc(db, "users", sellerId));
        if (userSnap.exists()) {
          cache[sellerId] = { name: userSnap.data().fullName, type: 'member' };
          return cache[sellerId];
        }

        cache[sellerId] = { name: `Anggota (ID: ${sellerId.slice(0,5)})`, type: 'member' };
        return cache[sellerId];
      };

      for (const orderDoc of snapshot.docs) {
        const order = orderDoc.data();
        let needsUpdate = false;
        const newItems = [];

        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            const newItem = { ...item };
            
            if (!newItem.sellerName || newItem.sellerName.startsWith('Anggota (ID:')) {
               const resolved = await resolveSellerInfo(newItem.sellerId || coopId);
               newItem.sellerName = resolved.name;
               newItem.sellerType = resolved.type;
               needsUpdate = true;
            }
            newItems.push(newItem);
          }
        }

        // [BARU] Pastikan array participatingSellerIds terisi di data lama
        let participatingSellerIds = order.participatingSellerIds || [];
        if (!order.participatingSellerIds || order.participatingSellerIds.length === 0) {
           const allSellers = newItems.map((i: any) => i.sellerId).filter(Boolean);
           if (order.sellerId) allSellers.push(order.sellerId);
           participatingSellerIds = [...new Set(allSellers)];
           needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(doc(db, COLLECTION, orderDoc.id), { 
             items: newItems,
             participatingSellerIds
          });
          updatedCount++;
        }
      }

      return updatedCount;
    } catch (error) {
      console.error("Auto heal error:", error);
      throw error;
    }
  }
};