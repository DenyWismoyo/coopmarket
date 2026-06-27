// File: src/hooks/use-fcm.ts
import { useEffect } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, arrayUnion, updateDoc } from 'firebase/firestore';
import { db, app } from '@/lib/firebase';
import { User } from 'firebase/auth';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY; 

export function useFCM(user: User | null) { 
  useEffect(() => {
    console.log("[FCM Debug] Hook terpanggil. Data User:", user?.uid, "| VAPID_KEY terbaca?:", !!VAPID_KEY);

    const requestPermissionAndGetToken = async () => {
      if (!user) {
        console.log("[FCM Debug] Dibatalkan karena user belum login (User bernilai null).");
        return;
      }
      if (!VAPID_KEY) {
        console.error("[FCM FATAL] VAPID_KEY kosong! Pastikan file .env.local sudah benar dan Anda sudah merestart server.");
        return;
      }
      
      console.log("[FCM] 1. Mencoba inisiasi untuk user:", user.uid);

      try {
        if (!('serviceWorker' in navigator)) {
          console.warn("[FCM] Service Worker tidak didukung di browser ini.");
          return;
        }

        const supported = await isSupported();
        if (!supported) {
          console.warn("[FCM] Browser/OS ini tidak mendukung Firebase Messaging.");
          return;
        }

        console.log("[FCM] 2. Meminta izin notifikasi ke pengguna...");
        const permission = await Notification.requestPermission();
        console.log("[FCM] Status Izin:", permission);

        if (permission === 'granted') {
          const messaging = getMessaging(app);
          
          // =========================================================================
          // [PERBAIKAN UTAMA]
          // =========================================================================
          // Daftarkan service worker hasil build next-pwa (biasanya bernama /sw.js)
          // secara eksplisit. Jika sudah terdaftar, browser hanya akan mengembalikan referensinya.
          console.log("[FCM] 3. Mendaftarkan Service Worker secara manual...");
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          // Wajib menunggu hingga Service Worker benar-benar aktif!
          await navigator.serviceWorker.ready;
          console.log("[FCM] 4. Service Worker Ready! Menghasilkan token...");

          // Generate token dengan jaminan registration tidak undefined
          const token = await getToken(messaging, { 
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration 
          });
          
          if (token) {
            console.log("[FCM] 5. Token didapat! Menyimpan ke Firestore...");
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(token)
            });
            console.log("[FCM] 6. SUKSES: Token tersimpan ke Firestore.");
          }
        } else {
          console.warn("[FCM] Pengguna menolak izin notifikasi.");
        }
      } catch (error) {
        console.error("[FCM] Error fatal saat setup FCM:", error);
      }
    };

    requestPermissionAndGetToken();
  }, [user]); 
}