// File: worker/index.js

// Kita menggunakan importScripts dari CDN agar ringan berjalan di background
self.importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
self.importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Karena file ini berada di folder /worker, next-pwa akan mengompilasinya.
// PROCESS.ENV SEKARANG BISA DIBACA DENGAN SEMPURNA!
firebase.initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
});

const messaging = firebase.messaging();

// Logika notifikasi di background
messaging.onBackgroundMessage((payload) => {
  console.log('[PWA Service Worker] Pesan background diterima: ', payload);
  
  const notificationTitle = payload.notification?.title || 'Notifikasi Baru';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icon/icon-192x192.png',
    badge: '/icon/icon-192x192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Aksi ketika notifikasi diklik
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(urlToOpen));
});