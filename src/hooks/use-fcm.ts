import { useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { doc, arrayUnion, updateDoc } from 'firebase/firestore';
import { db, messaging } from '@/lib/firebase';
import { useAuth } from '@/components/auth/auth-provider';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY; 

export function useFCM() {
  const { user } = useAuth();

  useEffect(() => {
    const requestPermissionAndGetToken = async () => {
      if (!user || !messaging || !VAPID_KEY) return;

      try {
        // Pastikan browser mendukung Service Worker
        if (!('serviceWorker' in navigator)) return;

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          
          // 1. Ambil pendaftaran Service Worker yang sudah dibuat oleh next-pwa
          const registration = await navigator.serviceWorker.getRegistration();
          
          // Jika SW tidak ada (misal saat Anda di mode Dev (npm run dev) dan next-pwa dimatikan), batalkan.
          if (!registration) {
             console.warn("Service Worker PWA tidak aktif. Menunda inisiasi FCM.");
             return;
          }

          // 2. Beritahu Firebase untuk menggunakan SW milik next-pwa
          const token = await getToken(messaging, { 
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration 
          });
          
          if (token) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(token)
            });
            console.log("FCM Token berhasil disambungkan dengan PWA Worker.");
          }
        }
      } catch (error) {
        console.error("Error setting up FCM:", error);
      }
    };

    requestPermissionAndGetToken();
  }, [user]);
}