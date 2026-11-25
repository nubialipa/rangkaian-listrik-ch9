# Debat & Analisis Karakter

Aplikasi web untuk berdebat tentang karakter fiksi. Argumen wajib merujuk ke kejadian cerita, dan kejadian yang belum dicapai pengguna disembunyikan supaya tidak ada spoiler.

## Riset kompetitor

| Pemain | Kekuatan | Celah yang dimanfaatkan |
|---|---|---|
| Reddit | Komunitas besar, debat per topik | Tidak terstruktur per karakter, tidak ada rujukan wajib, spoiler tercampur |
| Discord | Obrolan real-time | Sulit diarsipkan dan dicari, tidak cocok untuk debat panjang |
| Fandom | Wiki karakter | Fokus ke referensi, bukan debat |
| Inkspell: Character Tracker | Melacak motif dan busur karakter per bab, dengan batas bacaan | Tidak ada debat atau voting |
| InDelve, CharacterLinks, BookLinker | Kronologi dan relasi karakter | Tidak ada komunitas atau debat |
| Letterboxd | Komunitas film yang kuat, model freemium | Bukan untuk karakter, tapi contoh model komunitas yang berhasil |

Sumber: [Inkspell (Google Play)](https://play.google.com/store/apps/details?id=com.inkspell.app), [InDelve (App Store)](https://apps.apple.com/us/app/-/id6754034626), [CharacterLinks (App Store)](https://mwm.ai/de/apps/characterlinks/6759692159), [Letterboxd pro](https://letterboxd.com/about/pro/), [Discord / Reddit (diskusi umum)](https://fanlore.org/wiki/Discord).

Catatan: riset ini bersumber dari hasil pencarian dan listing toko. Angka pengguna dan rating belum diverifikasi.

## Keputusan

- **Dipilih:** gabungan ide 1 (papan debat karakter) dan ide 2 (kronologi motif). Pelacak karakter sudah ada, tapi belum ada yang menggabungkannya dengan debat berbasis rujukan.
- **Ditunda:** ide 3 (analisis AI). Butuh biaya API per permintaan dan sudah banyak alat serupa, jadi tidak murah dan tidak punya pembeda kuat di tahap awal.

## Versi sekarang

- Pilih karakter, lalu geser progres untuk membuka kronologi (anti-spoiler).
- Tulis argumen pro atau kontra dengan rujukan titik cerita.
- Beri suara pada argumen. Papan menampilkan skor dan kecenderungan.
- Data disimpan di `localStorage`. Ini hanya untuk satu perangkat dan belum mendukung debat antarpengguna.

Struktur:
- `data.js`: data karakter dan kejadian (ringkasan saya tulis sendiri, perlu verifikasi).
- `logic.js`: logika murni (anti-spoiler, validasi, ringkasan, urutan).
- `app.js` dan `index.html`: antarmuka.
- `logic.test.js`: tes unit.

## Menjalankan dan menguji

```bash
node --test ventures/debat-karakter/logic.test.js
```

Buka `index.html` di browser.

## Monetisasi (rencana)

1. **Gratis:** debat terbuka dan karakter dasar.
2. **Premium:** karakter tambahan, ekspor ringkasan debat, dan grup debat privat untuk kelompok belajar atau klub bacaan.
3. **Iklan:** opsional di tier gratis, setelah trafik ada.

Belum ada bukti willingness to pay. Model ini perlu diuji dengan pengguna nyata.

## Langkah berikutnya

1. Backend untuk debat antarpengguna. Opsi biaya rendah: Cloudflare Workers dan D1 (keduanya punya paket gratis).
2. Lebih banyak karakter, dengan kronologi yang diverifikasi terhadap sumber asli.
3. Moderasi konten sebelum rilis publik.
4. Akun pengguna dan hosting, yang harus dilakukan pemilik akun.

## Batasan

- Ringkasan kejadian dan urutan `at` belum diverifikasi terhadap sumber resmi.
- Suara saat ini hanya bisa dicatat sekali per perangkat, dan belum dicegah dari manipulasi.
