import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (Mencegah inisialisasi ganda saat Hot Module Replacement di Next.js)
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Services dengan Type eksplisit
const auth: Auth = getAuth(app);

// INISIALISASI FIRESTORE DENGAN NAMED DATABASE "coopmarket"
// Catatan: Parameter kedua pada getFirestore digunakan untuk mendefinisikan nama database.
// Pastikan Anda benar-benar menggunakan Named Database baru di console bernama "coopmarket".
// Jika Anda menggunakan database bawaan (default), hapus parameter "coopmarket" menjadi: getFirestore(app)
const db: Firestore = getFirestore(app, "coopmarket");

const storage: FirebaseStorage = getStorage(app);

// Initialize Analytics (Hanya berjalan di client-side/browser dengan tipe yang jelas)
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((error) => {
      console.error("Firebase Analytics gagal diinisialisasi:", error);
    });
}

export { app, auth, db, storage, analytics };