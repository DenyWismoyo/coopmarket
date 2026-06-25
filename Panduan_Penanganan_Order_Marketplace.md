# Panduan Penanganan Pesanan (Order) Marketplace Koperasi
**Sistem:** CoopMarket
**Peran:** Unit Admin & Member (Penjual Mandiri)

---

Mengingat aplikasi ini menggunakan arsitektur *multi-tenant*, pesanan dari pelanggan di *marketplace* akan otomatis dipisahkan oleh sistem berdasarkan siapa pemilik produk tersebut. Produk milik Koperasi akan masuk ke dasbor Unit Admin, sedangkan produk titipan/milik Member akan masuk ke dasbor Member masing-masing.

---

## BAB 1: Panduan Untuk Unit Admin (Pesanan Koperasi)

Unit Admin bertanggung jawab untuk memproses semua pesanan *online* yang berisi produk-produk milik Koperasi.

### 1.1. Memeriksa Pesanan Masuk
1. Masuk ke Dasbor Admin dan buka menu **Pesanan** atau **Orders**.
2. Di halaman ini, Anda akan melihat daftar semua pesanan *online* yang masuk dari *marketplace*.
3. Perhatikan **Status Pembayaran** (misal: *Belum Dibayar*, *Sudah Dibayar/Lunas*).
   * **Penting:** Jangan memproses atau menyiapkan barang jika status pembayaran belum lunas, kecuali jika pelanggan menggunakan sistem *Bayar di Tempat (COD)* (jika fitur ini diaktifkan oleh koperasi).

### 1.2. Memproses Pesanan
1. Klik pada nomor pesanan (Contoh: `ORD-260626-1234`) untuk melihat detail barang apa saja yang dibeli oleh pelanggan.
2. Kumpulkan barang di gudang/toko sesuai dengan rincian pesanan.
3. Ubah status pesanan di sistem menjadi **"Sedang Diproses"** atau **"Dikemas"**. Ini akan memberikan notifikasi kepada pelanggan di aplikasi mereka bahwa pesanan sedang disiapkan.

### 1.3. Menyelesaikan Pesanan
1. Jika pesanan menggunakan metode **"Ambil di Toko" (Pickup)**: Serahkan barang saat pelanggan datang dan minta pelanggan menunjukkan nomor pesanan.
2. Jika pesanan menggunakan metode **Pengiriman**: Pastikan barang diserahkan kepada kurir yang bertugas atau driver pengiriman lokal.
3. Setelah barang berpindah tangan ke pelanggan, ubah status pesanan menjadi **"Selesai" (Completed)**.

---

## BAB 2: Panduan Untuk Member (Pesanan Toko Mandiri)

Member yang mengaktifkan produknya di *marketplace* bertindak sebagai penjual mandiri dan bertanggung jawab penuh atas pesanannya sendiri.

### 2.1. Memeriksa Pesanan Masuk
1. Masuk ke panel/dasbor Member Anda dan buka menu **Pesanan (Orders)**.
2. Anda akan melihat daftar pesanan dari pembeli yang khusus membeli produk milik Anda.
3. Pastikan Anda mengecek apakah pembeli sudah melakukan pembayaran (status *Paid/Lunas*). 
   * Jika pembeli menggunakan metode QRIS, pastikan dana sudah masuk ke rekening dari QRIS yang telah Anda unggah di menu "Pengaturan Toko".

### 2.2. Menyiapkan Produk
1. Buka detail pesanan untuk melihat jenis, jumlah produk, serta **varian** (jika ada, misal: warna/ukuran) yang dipesan pembeli.
2. Segera kemas pesanan agar pembeli tidak menunggu terlalu lama.
3. Perbarui status pesanan menjadi **"Diproses"** agar pembeli tahu Anda sedang menyiapkan barangnya.

### 2.3. Penyerahan dan Penyelesaian
1. Lakukan serah terima barang kepada pembeli sesuai dengan metode yang dipilih pembeli (diantar langsung, dikirim, atau diambil di tempat).
2. Setelah barang diterima oleh pembeli, segera perbarui status pesanan menjadi **"Selesai" (Completed)**.
3. Sama seperti pada transaksi kasir, sistem akan mencatat transaksi ini sebagai penjualan yang sukses dan menerbitkan Struk Digital.

---

## BAB 3: Informasi Penting Tambahan (SOP)

Untuk memastikan kelancaran operasional *marketplace*, seluruh pengguna (Admin maupun Member) harus memahami aturan sistem berikut:

1. **Sinkronisasi Stok Aman (Anti-Overselling):** Stok produk di *marketplace* dan di mesin Kasir (POS) saling terhubung secara *real-time*. Jika ada pelanggan yang membeli secara *online*, sistem akan langsung mengamankan stok tersebut menggunakan algoritma *Atomic Transaction* (Anti-Rebutan). Anda tidak perlu takut terjadi kelebihan penjualan barang yang sama.

2. **Pemotongan Stok Otomatis:** Begitu pesanan *online* berhasil dibuat dan dibayar, stok barang di gudang Koperasi maupun etalase Member akan terpotong secara otomatis oleh sistem. Tidak perlu mengurangi stok secara manual.

3. **Pencatatan Penjualan & Laporan:** Pesanan *marketplace* yang sudah diubah statusnya menjadi **"Selesai"** akan otomatis diakumulasikan ke dalam laporan penjualan Anda. Ini juga akan menambah metrik jumlah produk terjual (*soldCount*) yang akan membuat produk Anda terlihat lebih laris di halaman depan marketplace.
