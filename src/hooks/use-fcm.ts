// File: src/hooks/use-fcm.ts
import { useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { doc, arrayUnion, updateDoc } from 'firebase/firestore';
import { db, messaging } from '@/lib/firebase';
import { useAuth } from '@/components/auth/auth-provider';

// Mengambil VAPID Key langsung dari Environment Variable Next.js
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY; 

export function useFCM() {
  const { user } = useAuth();

  useEffect(() => {
    const requestPermissionAndGetToken = async () => {
      if (!user || !messaging || !VAPID_KEY) return;

      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Menggunakan VAPID_KEY dari env
          const token = await getToken(messaging, { vapidKey: VAPID_KEY });
          
          if (token) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(token)
            });
            console.log("FCM Token successfully synced.");
          }
        } else {
          console.log("Notification permission denied.");
        }
      } catch (error) {
        console.error("Error setting up FCM:", error);
      }
    };

    requestPermissionAndGetToken();
  }, [user]);
}