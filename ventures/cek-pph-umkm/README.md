# Cek Kelayakan PPh Final 0,5% UMKM

Alat web statis satu halaman. Pengguna mengisi jenis wajib pajak, profesi, dan omzet bruto, lalu melihat apakah kemungkinan memenuhi syarat PPh Final 0,5% menurut PP 20/2026, beserta estimasi pajaknya.

## Mengapa niche ini

- Kalkulator PPh Final sudah banyak dan gratis, tetapi kebanyakan hanya menghitung. Celah yang tersisa adalah **kelayakan** setelah PP 20/2026 (berlaku sejak 22 April 2026): batas omzet, pengecualian profesi, jenis badan usaha, dan batas tahun untuk koperasi.
- Tidak butuh backend, akun, atau basis data. Hosting gratis di Cloudflare Pages.

## Sumber

- [PP 20/2026: Tarif PPh 0,5% bagi UMKM Orang Pribadi Berlaku Selamanya (pajak.go.id)](https://www.pajak.go.id/id/artikel/pp-202026-tarif-pph-05-bagi-umkm-orang-pribadi-berlaku-selamanya)
- [Aturan PPh Final 0,5% untuk UMKM Direvisi (Metro TV)](https://www.metrotvnews.com/read/kpLCQ6yZ-aturan-pph-final-0-5-untuk-umkm-direvisi-ini-perbedaannya)
- [Aturan Baru Pajak UMKM: Dokter hingga Selebgram Tak Lagi Nikmati PPh Final 0,5% (Katadata)](https://katadata.co.id/amp/finansial/makro/6a1f85439218c/aturan-baru-pajak-umkm-dokter-hingga-selebgram-tak-lagi-nikmati-pph-final-0-5)

Sumber pemberitaan tidak sepenuhnya sepakat soal rincian. Sebelum rilis, aturan di `rules.js` harus dicocokkan dengan teks PP 20/2026 yang asli.

## Aturan yang diimplementasikan (`rules.js`)

| Kondisi | Hasil |
|---|---|
| Omzet di atas Rp4,8 miliar per tahun | Tidak memenuhi syarat |
| Profesi yang dikecualikan (atlet, guru, dokter, selebgram, dll.) | Tidak memenuhi syarat |
| CV, firma, atau PT dengan lebih dari satu pemilik | Tidak memenuhi syarat (catatan: ada masa transisi) |
| Koperasi yang sudah 4 tahun pajak atau lebih | Tidak memenuhi syarat |
| Orang pribadi, PT perorangan, koperasi di bawah 4 tahun | Memenuhi syarat |

Estimasi pajak: 0% untuk omzet sampai Rp500 juta per tahun, selain itu 0,5% dari omzet bruto. **Ini penyederhanaan.** Perhitungan bulanan belum dimodelkan.

## Menjalankan dan menguji

```bash
node --test ventures/cek-pph-umkm/rules.test.js
```

Buka `index.html` langsung di browser, atau sajikan folder ini sebagai situs statis.

## Disclaimer

Alat ini hanya membantu memperkirakan dan **bukan nasihat pajak**. Data yang diisi pengguna tidak dikirim ke server mana pun (semua logika berjalan di browser).

## Monetisasi (rencana)

1. **Tahap awal:** gratis, untuk mengukur penggunaan dan mengumpulkan pertanyaan yang sering muncul.
2. **Iklan:** tampilkan iklan yang tidak mengganggu di bawah hasil. Perlu dicek kebijakan jaringan iklannya.
3. **Premium (nanti):** ringkasan PDF yang bisa dicetak sebagai bahan konsultasi dengan konsultan pajak, atau fitur simulasi lebih lengkap.

Tidak ada langganan atau pembayaran di tahap ini.

## Publikasi

Hosting: Cloudflare Pages (paket gratis), dengan folder ini sebagai output statis. Membuat akun dan menghubungkan repo perlu dilakukan oleh pemilik akun.
