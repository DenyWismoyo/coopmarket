# Buku Panduan Penggunaan Sistem Kasir (POS) Koperasi
**Peran:** Unit Admin
**Sistem:** CoopMarket POS

---

## Pendahuluan
Sistem Point of Sale (POS) Koperasi dirancang dengan teknologi *multi-tenant*, memungkinkan Unit Admin untuk melayani penjualan produk koperasi sekaligus produk titipan member dalam satu keranjang belanja. Panduan ini akan membantu Anda memahami alur kerja kasir utama dan cara membimbing member untuk menggunakan kasir mandiri mereka.

---

## BAB 1: Menggunakan Kasir Utama (Admin POS)

### 1.1. Pencarian dan Pemilihan Produk
- **Cari Produk:** Gunakan kolom pencarian di bagian atas untuk mencari produk berdasarkan nama barang atau nama pemilik (member).
- **Filter Kategori:** Klik tombol kategori (misal: "Makanan", "Minuman", dll) di bawah kolom pencarian untuk menyaring produk yang tampil.
- **Pilih Produk:** Klik pada kartu produk untuk memasukkannya ke keranjang. Jika produk memiliki varian (misal: ukuran, warna, atau rasa), sistem akan memunculkan *pop-up* untuk memilih varian terlebih dahulu.
- **Status Stok:** Produk dengan stok habis tidak dapat diklik (berwarna abu-abu). Sistem secara *real-time* mengecek ketersediaan stok produk maupun varian.

### 1.2. Mengelola Keranjang Belanja
- **Tambah/Kurangi Jumlah:** Gunakan tombol **(+)** dan **(-)** di sebelah kiri nama produk dalam keranjang. Sistem akan memblokir penambahan jika melebihi stok yang tersedia.
- **Hapus Item:** Klik ikon tempat sampah (🗑️) berwarna merah di sebelah kanan produk untuk menghapusnya dari keranjang.
- Sistem akan otomatis menghitung total harga belanjaan secara *real-time*.
- Jika pesanan sudah sesuai, klik tombol biru **"Bayar Sekarang"** untuk masuk ke halaman *Checkout*.

### 1.3. Memasukkan Data Pelanggan
Pada halaman Checkout, Anda harus menentukan siapa pembelinya:
- **Pelanggan Member:** Ketik minimal 3 huruf nama member pada kolom pencarian pelanggan. Sistem akan otomatis mencari data member Koperasi Anda. Klik nama yang sesuai.
- **Pelanggan Umum (Non-Member):** Jika pelanggan bukan anggota, Anda bisa mengetik nama manual (kemudian tidak perlu memilih dari *dropdown*), atau biarkan kosong dan sistem akan mencatatnya sebagai pembeli "Umum".

### 1.4. Proses Pembayaran
Pilih metode pembayaran dengan mengklik tab **Tunai** atau **QRIS / Transfer**.

#### A. Pembayaran Tunai
1. Masukkan jumlah uang yang diterima dari pelanggan pada kolom "Uang Tunai".
2. Anda bisa mengetik manual atau mengklik tombol nominal cepat yang disediakan (misal: 10k, 20k, 50k, 100k, atau tombol "Uang Pas").
3. Sistem akan memunculkan **Kembalian**. Jika kotak kembalian berwarna merah (uang yang dimasukkan kurang dari total tagihan), tombol "Selesai" **tidak akan bisa ditekan**.

#### B. Pembayaran QRIS (Sistem Multi-Tenant)
Sistem secara otomatis akan memisahkan tagihan QRIS berdasarkan kepemilikan produk yang ada di keranjang:
1. **QRIS Koperasi (Utama):** Akan selalu muncul untuk membayar nominal produk milik Koperasi. Anda dapat **mengklik gambar QRIS** tersebut untuk memperbesarnya (*Zoom*) agar lebih mudah di-scan oleh pelanggan.
2. **QRIS Member (Penjual Titipan):** Jika keranjang berisi produk titipan member, sistem akan memunculkan QRIS milik member tersebut secara terpisah di bagian bawah.
3. **Penting:** Pastikan pelanggan men-scan QRIS sesuai dengan porsi tagihannya masing-masing.

### 1.5. Penyelesaian dan Cetak Struk
- Setelah pembayaran sesuai dan diterima, klik tombol hijau **"Selesai"**.
- Transaksi akan diproses ke server dan sistem akan menampilkan *Receipt Dialog* (Struk Digital) yang rapi.
- Anda dapat mencetak struk ini (jika terhubung printer thermal) atau memperlihatkannya kepada pelanggan.
- Setelah ditutup, kasir akan kembali kosong dan siap untuk transaksi berikutnya.

---

## BAB 2: Panduan Membimbing Member (Kasir Mandiri)

Member Koperasi Anda juga memiliki fitur POS (Kasir) mandiri di aplikasi mereka. Sebagai Unit Admin, Anda dapat mengarahkan mereka dengan tahapan berikut:

### 2.1. Persiapan Wajib Sebelum Berjualan
- Arahkan member untuk membuka menu **Pengaturan Toko** di akun mereka.
- **Upload QRIS:** Member WAJIB mengunggah foto QRIS pribadi mereka. Jika tidak diunggah, fitur pembayaran QRIS di kasir mereka tidak akan bisa digunakan dan memunculkan peringatan merah saat ada pembeli.

### 2.2. Cara Bertransaksi di Kasir Member
- **Hanya Produk Milik Sendiri:** Beritahu member bahwa mesin kasir mereka hanya akan menampilkan produk milik mereka sendiri yang sudah berstatus "Aktif".
- **Input Pembeli:** Pencarian data member global tidak tersedia di kasir member. Mereka cukup mengetik nama pembeli secara manual (atau biarkan "Umum").
- **Pembayaran:** Sama seperti Admin, mereka bisa menerima Uang Tunai (lengkap dengan kalkulator kembalian) atau QRIS.
- Pada metode QRIS, layar akan memunculkan QR Code pribadi milik member tersebut. Setelah pembeli men-scan, member dapat menekan **Selesai** untuk mencetak struk digital.

---

## BAB 3: Standar Operasional Prosedur (SOP) & Informasi Teknis

Untuk memastikan Unit Admin memahami keamanan data dan alur sistem:

1. **Sistem Anti-Rebutan Stok (*Atomic Transaction*):**
   Transaksi dilindungi oleh algoritma *Database Transaction*. Jika ada dua kasir (misal Anda dan kasir cabang lain) mencoba menjual barang yang sama dengan sisa stok 1 secara bersamaan, salah satu transaksi otomatis digagalkan oleh sistem. Tidak akan ada stok minus.
   
2. **Pemotongan Stok Otomatis:**
   Setiap transaksi Kasir (Offline) akan langsung memotong stok di gudang dan menambah angka terjual (*soldCount*) pada produk terkait. Tidak perlu mengurangi stok manual.

3. **Pelacakan Nomor Nota:**
   Tiap transaksi akan menghasilkan nomor unik dengan format `ORD-YYMMDD-XXXX` (contoh: ORD-260626-4021). Format ini dapat digunakan untuk pelacakan silang (*cross-check*) jika terjadi kesalahan pencatatan atau pengecekan di menu Riwayat Transaksi.
