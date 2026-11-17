# Proyek: Belajar Rangkaian Listrik Bab 9

## Tujuan
Situs statis untuk belajar 14 soal analisis fasor. Setiap soal punya langkah, animasi arus, dan hasil yang diverifikasi dengan solver.

## Aturan teknis
- Situs statis di `site/`. Tanpa framework build, tanpa npm.
- Solver, data soal, dan antarmuka dipisah di `site/js/`. Urutan muat: solver.js → problems.js → app.js.
- Setiap perubahan pada soal harus lolos `node tests/verify.js`.

## Konvensi konten
- Netlist mengikuti gambar soal. Koordinat `pos` dipakai untuk menggambar.
- Langkah pengerjaan ditulis dengan kata sendiri, bukan disalin dari buku soal.
- Arus dalam fasor memakai konvensi kosinus. Sumber sinus diubah ke kosinus lebih dulu.
