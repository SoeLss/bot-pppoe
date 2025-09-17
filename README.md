# 📡 Bot Monitoring PPPoE & Hotspot MikroTik

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Axios](https://img.shields.io/badge/axios-671ddf?style=for-the-badge&logo=axios&logoColor=white)
![Cron](https://img.shields.io/badge/cron-005a9c?style=for-the-badge&logo=cron&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Sebuah bot WhatsApp sederhana yang dibuat dengan Node.js untuk memonitoring status **user aktif PPPoE** dan **Hotspot** dari beberapa server MikroTik. Bot ini mengambil data melalui API, memformatnya menjadi laporan harian, dan mengirimkannya secara otomatis ke nomor atau grup WhatsApp yang telah ditentukan.



---

### ✨ Fitur Utama

-   ✅ **Monitoring Otomatis**: Mengirim laporan status PPPoE dan Hotspot secara otomatis sesuai jadwal.
-   🕒 **Jadwal Fleksibel**: Laporan dikirim tiga kali sehari (pagi, siang, sore) menggunakan `node-cron` dan dapat diubah sesuai kebutuhan.
-   📊 **Laporan Terstruktur**: Memisahkan data PPPoE dan Hotspot, serta menghitung total user aktif dari semua server.
-   ⚙️ **Logika Kustom**: Menerapkan aturan spesifik pada data yang diterima, seperti mengganti nama server, mengabaikan server tertentu, dan menangani *timeout* koneksi.
-   📲 **Notifikasi WhatsApp**: Menggunakan `@whiskeysockets/baileys` untuk terhubung dan mengirim pesan ke WhatsApp dengan andal.
-   🔄 **Koneksi Ulang Otomatis**: Bot dirancang untuk mencoba menyambung kembali secara otomatis jika koneksi WhatsApp terputus.

---

### 🛠️ Teknologi yang Digunakan

-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Koneksi WhatsApp**: [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
-   **Permintaan API**: [Axios](https://axios-http.com/)
-   **Penjadwal Tugas**: [node-cron](https://github.com/node-cron/node-cron)
-   **QR Code Generator**: [qrcode-terminal](https://github.com/gtanner/qrcode-terminal)

---

### 🚀 Cara Menjalankan Bot

Ikuti langkah-langkah berikut untuk menginstalasi dan menjalankan bot ini.

#### 1. Prasyarat

-   **Node.js**: Pastikan Anda telah menginstal Node.js versi 18 atau yang lebih baru.
-   **API Endpoint**: Anda harus memiliki sebuah API yang dapat diakses oleh bot untuk mengambil data dari MikroTik. Dalam contoh ini, API diharapkan mengembalikan data JSON.

#### 2. Instalasi

1.  **Clone repositori ini:**
    ```sh
    git clone [https://github.com/USERNAME/REPO_NAME.git](https://github.com/USERNAME/REPO_NAME.git)
    ```
2.  **Masuk ke direktori proyek:**
    ```sh
    cd REPO_NAME
    ```
3.  **Install semua dependensi yang dibutuhkan:**
    ```sh
    npm install @whiskeysockets/baileys @hapi/boom axios node-cron qrcode-terminal
    ```

#### 3. Konfigurasi

Buka file kode utama (misalnya `index.js`) dan ubah konstanta berikut di bagian atas file:

-   `TARGET_ID`: Masukkan ID Grup atau nomor WhatsApp tujuan laporan.
    -   Untuk nomor pribadi: `'6281234567890@s.whatsapp.net'`
    -   Untuk grup: `'YOUR_GROUP_ID@g.us'`
-   `API_URL`: Masukkan URL lengkap dari API endpoint Anda.

Anda juga bisa mengubah jadwal `cron` di dalam fungsi `connectToWhatsApp()` jika diperlukan.

#### 4. Menjalankan Bot

1.  **Jalankan aplikasi melalui terminal:**
    ```sh
    node index.js
    ```
2.  **Scan QR Code**: Saat pertama kali dijalankan, sebuah QR code akan muncul di terminal. Buka aplikasi WhatsApp di ponsel Anda, masuk ke **Menu > Perangkat tertaut > Tautkan perangkat**, lalu pindai QR code tersebut.
3.  Setelah berhasil, sesi login akan disimpan dalam folder `auth_info_baileys` dan bot akan berjalan secara otomatis.

---

### 📖 Alur Kerja Bot

1.  **Koneksi**: Bot akan terhubung ke WhatsApp dan menunggu koneksi stabil.
2.  **Penjadwalan**: `node-cron` akan memicu fungsi `sendMonitoringReport` pada waktu yang telah ditentukan (misal: 10:00, 10:02, dan 15:00 WIB).
3.  **Pengambilan Data**: Bot melakukan permintaan GET ke `API_URL` menggunakan `axios` untuk mengambil data status MikroTik terbaru.
4.  **Pemrosesan Data**: Data JSON yang diterima akan diproses:
    -   Server `SAMIRAN 2` akan diabaikan.
    -   Nama server `K1` akan diubah menjadi `K6`.
    -   Jika sebuah server mengalami *error* (timeout), statusnya akan ditandai sebagai "Timeout".
    -   Data dipisahkan menjadi kategori PPPoE dan Hotspot.
5.  **Pembuatan Pesan**: Semua data yang telah diproses diformat menjadi sebuah pesan teks yang terstruktur dan mudah dibaca.
6.  **Pengiriman Pesan**: Pesan laporan dikirim ke `TARGET_ID` melalui WhatsApp.
7.  **Siklus**: Proses ini akan berulang sesuai jadwal yang telah ditentukan.
