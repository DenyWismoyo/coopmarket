// File ini diperlukan untuk menghilangkan error 404/500 saat browser mencari service worker Firebase. 
// Jika Anda nanti ingin mengaktifkan push notification, isi dengan konfigurasi Firebase Anda. 

self.addEventListener('install', () => {   
  self.skipWaiting();
}); // Menambahkan kurung tutup yang sebelumnya terpotong

self.addEventListener('activate', () => {   
  console.log('Service Worker Activated'); 
});

// Menambahkan event fetch kosong untuk memenuhi standar offline PWA
self.addEventListener('fetch', (event) => {
  // Biarkan kosong jika belum ada strategi caching khusus
});