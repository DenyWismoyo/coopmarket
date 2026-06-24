// File ini diperlukan untuk menghilangkan error 404/500 saat browser mencari service worker Firebase.
// Jika Anda nanti ingin mengaktifkan push notification, isi dengan konfigurasi Firebase Anda.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Service Worker Activated');
});