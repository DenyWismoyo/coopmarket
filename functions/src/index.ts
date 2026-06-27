// File: functions/src/index.ts
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
// 1. Tambahkan import getFirestore secara modular
import { getFirestore } from "firebase-admin/firestore";

admin.initializeApp();

// Definisikan database "coopmarket" sesuai konfigurasi Anda
const TARGET_DATABASE = "coopmarket";

export const notifyNewOrder = onDocumentCreated(
  {
    document: "orders/{orderId}",
    database: TARGET_DATABASE // Memastikan trigger mendengarkan DB yang benar
  }, 
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const orderData = snapshot.data();
    
    // Hanya proses jika status pesanan adalah pending (pesanan baru)
    if (orderData.status !== "pending") return;

    const sellerId = orderData.sellerId;
    const buyerName = orderData.buyerName;
    const totalAmount = orderData.totalAmount || 0;

    try {
      // 2. Gunakan getFirestore modular untuk mengakses Named Database
      const dbInstance = getFirestore(admin.app(), TARGET_DATABASE);
      
      const sellerDoc = await dbInstance.collection("users").doc(sellerId).get();
      
      if (!sellerDoc.exists) return;
      
      const sellerData = sellerDoc.data();
      const tokens = sellerData?.fcmTokens || [];

      if (!tokens || tokens.length === 0) {
        console.log(`Tidak ada FCM token untuk seller ${sellerId}`);
        return;
      }

      // Siapkan payload notifikasi
      const payload = {
        notification: {
          title: "Pesanan Baru Masuk! 🎉",
          body: `${buyerName} baru saja membuat pesanan sebesar Rp${totalAmount.toLocaleString('id-ID')}. Segera proses pesanannya!`,
        },
        data: {
          url: `/member/sales`, 
        }
      };

      // Kirim pesan multicast
      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: payload.notification,
        data: payload.data,
      });

      // Hapus token yang kedaluwarsa atau tidak valid (pembersihan)
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        
        if (failedTokens.length > 0) {
          await dbInstance.collection("users").doc(sellerId).update({
            fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
          });
        }
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }
);