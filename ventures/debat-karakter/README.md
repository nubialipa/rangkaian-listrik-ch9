# Sidang Karakter

Platform debat karakter fiksi. Argumen wajib merujuk ke kejadian cerita, dan kejadian yang belum dibuka pengguna disembunyikan di server (bukan hanya di tampilan), supaya tidak ada spoiler.

Versi ini berjalan di Cloudflare Workers dengan database D1, dan melayani halaman statis dari folder `public/`.

## Struktur

```
ventures/debat-karakter/
├── public/                 Situs statis (dilayani Workers Assets)
│   ├── index.html          Landing page
│   ├── app/                Aplikasi debat (index.html + app.js)
│   ├── privacy.html        Kebijakan privasi
│   ├── style.css, logo.svg
│   ├── _headers            Header keamanan (CSP, X-Frame-Options, dll.)
│   ├── robots.txt, sitemap.xml
└── worker/
    ├── src/index.js        Router API, autentikasi, batas laju, anti-penyalahgunaan
    ├── src/logic.js        Logika murni: anti-spoiler, validasi, ringkasan, urutan
    ├── src/auth.js         Hash PBKDF2 dan token sesi (Web Crypto)
    ├── src/characters.js   Data karakter dan kronologi (dengan sumber)
    ├── schema.sql          Skema D1
    ├── wrangler.toml       Konfigurasi Worker, aset, dan D1
    └── test/               Tes unit dan integrasi
```

## Arsitektur dan alasan

| Pilihan | Alasan |
|---|---|
| Cloudflare Workers + Workers Assets | Satu deployment untuk API dan situs. Paket gratis cukup untuk tahap awal. |
| D1 (SQLite) | Data relasional (akun, argumen, suara, laporan) dengan biaya nol di tahap awal. |
| PBKDF2-SHA256 (100.000 iterasi) | Hash kata sandi yang didukung Web Crypto di Workers tanpa dependensi tambahan. |
| Token sesi acak, disimpan sebagai hash SHA-256 | Kebocoran tabel sesi tidak langsung memberi akses. |
| Tanpa framework di sisi klien | Tidak ada langkah build, dan halaman tetap ringan di ponsel. |

## Keamanan dan anti-penyalahgunaan

- **Anti-spoiler di server.** Kejadian dan argumen yang rujukannya di atas progres pengguna tidak dikirim sama sekali. Tes integrasi memastikan argumen titik 2 tidak muncul di `?at=1`.
- **Satu suara per akun per argumen.** Dijamin oleh kunci primer tabel `votes`.
- **Suara harus berdasarkan kejadian yang sudah dibuka.** Akun hanya bisa memberi suara pada argumen yang rujukannya sudah ia capai.
- **Tidak bisa memberi suara pada argumen sendiri.**
- **Laporan dan penyembunyian otomatis.** Satu akun melapor sekali. Argumen disembunyikan setelah 3 akun berbeda melapor.
- **Batas laju (fixed window)** untuk registrasi (5/jam per IP), login (20/15 menit per IP), posting argumen (5/jam per akun), suara (60/jam per akun), dan laporan (20/jam per akun).
- **Pemeriksaan origin** untuk metode yang mengubah data. Permintaan dari situs lain ditolak dengan 403.
- **Pesan galat login generik.** Waktu verifikasi tetap dijalankan saat akun tidak ada, sehingga keberadaan username tidak bisa ditebak dari respons.
- **Input dibatasi.** Body maksimal 8 KB, JSON wajib, teks argumen 20–600 karakter, karakter kontrol dibuang.
- **Teks ditampilkan sebagai teks.** Frontend memakai `textContent`. Tes browser memastikan markup dari argumen tidak tereksekusi.
- **CSP** di `public/_headers` (`script-src 'self'`, `style-src 'self'`, `frame-ancestors 'none'`).

Batasan yang diketahui:
- Pembatas laju memakai baca-lalu-tulis di D1, jadi di bawah beban paralel yang sangat tinggi batasnya bisa sedikit terlewati. Cukup untuk tahap awal.
- Belum ada verifikasi email. Akun baru bisa dibuat tanpa email. Ini sengaja, supaya hambatan awal rendah, tetapi memperbesar risiko spam. Pembatas per IP adalah mitigasinya.
- Belum ada moderasi manual atau panel admin.

## Kronologi dan sumber

Setiap karakter di `worker/src/characters.js` punya daftar `sources`. Status `sumber_dirujuk` berarti ringkasan ditulis ulang dari sumber tersebut, tetapi **belum dicocokkan baris per baris**. Sebelum rilis publik, setiap kronologi harus diverifikasi terhadap sumber asli, lalu statusnya diubah.

Urutan `at` adalah urutan titik cerita yang disederhanakan, bukan nomor episode resmi.

## Menjalankan secara lokal

```bash
cd ventures/debat-karakter/worker
npm install
npm run test:unit            # tes logika dan autentikasi
npm run db:init              # buat skema D1 lokal
npm run dev                  # jalankan di http://localhost:8787
npm run test:api             # tes integrasi (butuh `npm run dev` berjalan)
```

Tes browser (Playwright) tidak disertakan dalam repo, karena butuh Chromium. Alur yang sudah diuji: tamu melihat kronologi tertutup, progres pindah ke akun saat masuk, posting argumen, dan tidak ada error di konsol.

## Deploy (butuh akun Cloudflare pemilik proyek)

1. `npx wrangler login`
2. `npx wrangler d1 create sidang-karakter`. Salin `database_id` ke `wrangler.toml`.
3. `npx wrangler d1 execute sidang-karakter --remote --file=schema.sql`
4. `npm run deploy`
5. Ganti `REPLACE-DOMAIN` di `public/index.html`, `public/robots.txt`, dan `public/sitemap.xml` dengan domain asli, setelah domain dibuat.
6. Verifikasi header CSP di respons produksi (`curl -I`). Di mode lokal, `_headers` belum tentu diterapkan.

## Monetisasi (hipotesis, belum tervalidasi)

1. **Gratis:** akses penuh ke debat dan kronologi karakter dasar.
2. **Premium:** karakter tambahan, ekspor ringkasan debat, dan ruang debat privat untuk kelompok belajar atau klub bacaan.
3. **Iklan:** opsional di tier gratis, setelah trafik ada.

Belum ada bukti bahwa pengguna mau membayar. Urutan validasi yang disarankan: (a) ukur retensi mingguan dan jumlah argumen per pengguna aktif; (b) tawarkan fitur premium sebagai pra-pemesanan sebelum membangun pembayaran; (c) baru setelah itu pasang sistem pembayaran.

## Langkah berikutnya

1. Verifikasi kronologi tiap karakter terhadap sumber asli, lalu ubah status.
2. Tambah karakter populer dari anime, manga, film, dan serial.
3. Verifikasi email dan panel moderasi sederhana.
4. Pengujian performa dan responsivitas di perangkat nyata.
5. Akun pemilik untuk domain, hosting, dan analitik.
