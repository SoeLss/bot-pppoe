const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const axios = require('axios');
const cron = require('node-cron');
const qrcode = require('qrcode-terminal');

// --- KONFIGURASI ---
// Ganti dengan ID Grup atau nomor WhatsApp personal tujuan (contoh: '6281234567890@s.whatsapp.net'/'YOUR_GROUP_ID@g.us')
const TARGET_ID = '6283114400575@s.whatsapp.net'; 
const API_URL = 'http://172.16.100.192/api/pppoe';
// -----------------

/**
 * Fungsi utama untuk mengambil data, memformat, dan mengirim pesan monitoring.
 */
async function sendMonitoringReport(sock) {
    console.log('Mengambil data monitoring...');
    try {
        // 1. Ambil data dari API
        const response = await axios.get(API_URL, { timeout: 20000 }); // Timeout 10 detik
        const data = response.data;

        let pppoeList = [];
        let hotspotList = [];
        let totalPppoeAktif = 0;
        let totalHotspotAktif = 0;

        // 2. Proses dan pilah data
        for (const key in data) {
            const item = data[key];

            // ===== LOGIKA BARU DI SINI =====

            // Aturan #1: Hapus SAMIRAN 2 secara permanen
            if (key === 'SAMIRAN 2') {
                continue; // Lanjut ke server berikutnya
            }
            
            // Ganti nama K1 menjadi K6
            let serverName = key;
            if (key === 'K1') {
                serverName = 'K6';
            }

            // Aturan #2: Jika ada error, beri keterangan Timeout
            if (item.error) {
                pppoeList.push(`${serverName}\nTimeout`);
                continue; // Lanjut ke server berikutnya
            }

            // Aturan #3: Proses data yang normal
            if (typeof item.total === 'number') {
                // Ini data PPPoE
                pppoeList.push(`${serverName}\n${item.active}/${item.total} PPPOE`);
                totalPppoeAktif += item.active;
            } else if (item.total === 'Active') {
                // Ini data Hotspot
                hotspotList.push(`${serverName}\n${item.active}/Active`);
                totalHotspotAktif += item.active;
            }
        }

        // 3. Format pesan akhir
        const now = new Date();
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = days[now.getDay()];
        const date = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        
        const hour = now.getHours();
        let timeOfDay = 'Sore';
        if (hour < 11) {
            timeOfDay = 'Pagi';
        } else if (hour < 15) {
            timeOfDay = 'Siang';
        }

        let finalMessage = `*Hasil Monitoring Daily ${dayName} ${timeOfDay}, ${date}/${month}/${year}*\n\n`;
        
        finalMessage += `*PPPoE:*\n`;
        finalMessage += pppoeList.join('\n\n') + '\n\n';
        finalMessage += `*Total Aktif PPPoE: ${totalPppoeAktif} PPPOE*\n\n`;

        finalMessage += `*Hotspot:*\n`;
        finalMessage += hotspotList.join('\n\n') + '\n\n';
        finalMessage += `*Total Aktif Hotspot: ${totalHotspotAktif} Active*`;
        
        // 4. Kirim pesan
        await sock.sendMessage(TARGET_ID, { text: finalMessage });
        console.log('Laporan monitoring berhasil dikirim!');

    } catch (error) {
        console.error('Gagal mengambil atau mengirim data monitoring:', error.message);
        // Kirim notifikasi error jika perlu
        // await sock.sendMessage(TARGET_ID, { text: `⚠️ Gagal menjalankan monitoring: ${error.message}` });
    }
}


/**
 * Fungsi untuk koneksi ke WhatsApp
 */
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Bot PPPOE", "Chrome", "1.0.0"],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('Pindai QR code di bawah ini dengan WhatsApp Anda:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus karena:', lastDisconnect.error, ', menyambungkan kembali:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Koneksi WhatsApp terbuka. Bot siap!');
            
            const cronOptions = {
                scheduled: true,
                timezone: "Asia/Jakarta" // Sesuaikan dengan zona waktu Anda
            };

            // Jadwal Pagi jam 08:00
            cron.schedule('0 10 * * *', () => {
                console.log('Menjalankan laporan terjadwal: Pagi (08:00)');
                sendMonitoringReport(sock);
            }, cronOptions);

            // Jadwal Siang jam 12:00
            cron.schedule('2 10 * * *', () => {
                console.log('Menjalankan laporan terjadwal: Siang (12:00)');
                sendMonitoringReport(sock);
            }, cronOptions);

            // Jadwal Sore jam 16:00
            cron.schedule('0 15 * * *', () => {
                console.log('Menjalankan laporan terjadwal: Sore (16:00)');
                sendMonitoringReport(sock);
            }, cronOptions);
        }
    });

    return sock;
}

// Jalankan bot
connectToWhatsApp();
