# Belajar Rangkaian Listrik — Bab 9 (Analisis Fasor)

Panduan belajar untuk 14 soal Bab 9 (analisis keadaan tunak sinusoid): langkah pengerjaan, animasi arus sesaat, dan hasil yang sudah diverifikasi.

## Isi situs
- **Peta belajar**: enam langkah umum, tabel tipe soal dan metode yang cocok.
- **Soal 1–14**: setiap soal punya langkah yang bisa diklik, gambar rangkaian dengan titik arus yang bergerak, daftar hasil (fasor dan bentuk waktu), pelajaran, dan jebakan yang sering terjadi.
- **Kunci verifikasi**: solver menghitung ulang semua hasil di browser, lalu dibandingkan dengan kunci jawaban dari buku soal.

## Cara kerja
- `site/js/solver.js`: solver fasor memakai Modified Nodal Analysis dengan bilangan kompleks. Mendukung R, L, C, sumber tegangan, sumber arus, dan keempat jenis sumber tak-bebas.
- `site/js/problems.js`: netlist setiap soal, koordinat gambar, kunci jawaban, dan langkah pengerjaan.
- `site/js/app.js`: antarmuka, gambar rangkaian, dan animasi.

## Verifikasi
```bash
node tests/verify.js
```
Semua 20 hasil yang memiliki kunci harus cocok (selisih di bawah 1%).

## Catatan
- Animasi diperlambat agar mudah diamati. Bentuk gelombang arus tetap sama dengan hasil fasor.
- Langkah dan penjelasan ditulis ulang sendiri. Angka kunci berasal dari soal Bab 9 yang dipakai sebagai bahan belajar.
- Frekuensi sudut yang tidak disebut di soal (soal 5–11) ditampilkan sebagai impedansi tanpa frekuensi tertentu.
