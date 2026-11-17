/*
 * Contoh terbimbing (ditulis ulang dengan kata sendiri dari materi dosen).
 * Setiap contoh berisi netlist (struktur gambar), pos (letak simpul untuk gambar),
 * dan langkah-langkah. Angka dihitung dengan Solver, bukan disalin.
 */
const CONTOH_S = Solver;
const CC = CONTOH_S.C;
const CT = CONTOH_S.tex;
const CR = (x) => CC.c(x, 0);
const CJ = (x) => CC.c(0, x);

// Penyelesaian sistem 2x2 dengan aturan Cramer (bilangan kompleks)
function cramer2(a11, a12, a21, a22, b1, b2) {
  const det = CC.sub(CC.mul(a11, a22), CC.mul(a12, a21));
  const x1 = CC.div(CC.sub(CC.mul(b1, a22), CC.mul(a12, b2)), det);
  const x2 = CC.div(CC.sub(CC.mul(a11, b2), CC.mul(a21, b1)), det);
  return { det, x1, x2 };
}

/* ---------- Contoh 1: tegangan simpul (rangkaian dengan sumber arus dan sumber tak-bebas) ---------- */
const CONTOH_NODE = {
  id: 'node',
  judul: 'Tegangan simpul dengan sumber arus dan sumber tak-bebas',
  soal: 'Sumber arus $10{,}6\\angle 0^\\circ$ A, resistor $1\\,\\Omega$ seri $j2\\,\\Omega$, resistor $10\\,\\Omega$ ke acuan, $5\\,\\Omega$ seri sumber tak-bebas $20\\,I_x$, dan kapasitor $-j5\\,\\Omega$. Cari arus cabang $I_a$, $I_b$, dan $I_c$.',
  pos: { g: [120, 340], n1: [240, 120], n2: [420, 120], m: [520, 120] },
  ground: 'g',
  elements() {
    return [
      { id: 'Is', kind: 'I', a: 'g', b: 'n1', J: CC.c(10.6, 0), path: [[120, 120]], label: '10,6∠0° A' },
      { id: 'Ia', kind: 'Z', a: 'n1', b: 'g', z: CR(10), path: [[240, 340]], label: '10 Ω' },
      { id: 'Jx', kind: 'Z', a: 'n1', b: 'n2', z: CC.c(1, 2), label: '1 Ω + j2 Ω' },
      { id: 'Ic', kind: 'Z', a: 'n2', b: 'g', z: CJ(-5), path: [[420, 340]], label: '−j5 Ω' },
      { id: 'Ib', kind: 'Z', a: 'n2', b: 'm', z: CR(5), label: '5 Ω' },
      { id: 'Dep', kind: 'CCVS', a: 'm', b: 'g', ctrl: 'Jx', k: CR(20), path: [[520, 340]], label: '20·Ix' },
    ];
  },
  hitung() {
    const s = CONTOH_S.run(this.elements(), this.ground);
    const V1 = s.v('n1'), V2 = s.v('n2');
    return {
      V1, V2,
      Ia: s.cur('Ia'), Ix: s.cur('Jx'), Ib: s.cur('Ib'), Ic: s.cur('Ic'),
    };
  },
  kunci: { V1: CC.c(68.40, -16.80), V2: CC.c(68, -26), Ia: CC.c(6.84, -1.68), Ix: CC.c(3.76, 1.68), Ib: CC.c(-1.44, -11.92), Ic: CC.c(5.2, 13.6) },
  langkah(r) {
    return [
      { j: 'Tentukan acuan dan simpul', t: `Pilih rel bawah sebagai acuan. Dengan ini, hanya ada dua simpul yang tegangannya belum diketahui: $V_1$ (kiri atas) dan $V_2$ (kanan atas).` },
      { j: 'Tulis arus cabang dengan hukum Ohm', t: `Setiap cabang punya arus yang dinyatakan dari tegangan simpulnya.\n$$I_a = \\dfrac{V_1}{10},\\qquad I_x = \\dfrac{V_1 - V_2}{1+j2},\\qquad I_c = \\dfrac{V_2}{-j5}$$` },
      { j: 'Tulis KCL di simpul V_1', t: `Arus dari sumber $10{,}6$ A masuk ke $V_1$ dan keluar lewat $10\\,\\Omega$ dan $1+j2\\,\\Omega$:\n$$-10{,}6 + \\dfrac{V_1}{10} + \\dfrac{V_1 - V_2}{1+j2} = 0$$\nKalikan dengan $1+j2$, lalu kumpulkan koefisien $V_1$ dan $V_2$:\n$$(1{,}1 + j0{,}2)\\,V_1 - V_2 = 10{,}6 + j21{,}2$$` },
      { j: 'Tulis KCL di simpul V_2 (dengan sumber tak-bebas)', t: `Sumber tak-bebas $20\\,I_x$ menghubungkan tegangannya ke cabang $5\\,\\Omega$. Tegangan di ujung sumber itu $V_m = 20\\,I_x$. Arus lewat $5\\,\\Omega$ adalah $I_b = (V_2 - 20I_x)/5$. Tulis KCL di $V_2$ dan ganti $I_x$ dengan $(V_1 - V_2)/(1+j2)$.` },
      { j: 'Selesaikan dua persamaan', t: `Dari dua persamaan simpul, hasilnya:\n$$\\mathbf{V}_1 = ${CT.rect(r.V1)}\\ \\text{V}\\qquad \\mathbf{V}_2 = ${CT.rect(r.V2)}\\ \\text{V}$$` },
      { j: 'Hitung arus cabang', t: `$$I_a = ${CT.rect(r.Ia)}\\ \\text{A},\\quad I_x = ${CT.rect(r.Ix)}\\ \\text{A},\\quad I_b = ${CT.rect(r.Ib)}\\ \\text{A},\\quad I_c = ${CT.rect(r.Ic)}\\ \\text{A}$$` },
      { j: 'Cek', t: `Jumlahkan arus di simpul $V_1$: $I_a + I_x = ${CT.rect(CC.add(r.Ia, r.Ix))}$ A. Ini sama dengan arus sumber $10{,}6$ A, jadi hasilnya konsisten.` },
    ];
  },
  pelajaran: [
    'Dengan tiga simpul dan satu acuan, cukup dua persamaan simpul. Setiap sumber tegangan yang menempel ke acuan membuat satu simpul tetap.',
    'Sumber tak-bebas $20I_x$ hanya berubah nilainya; kamu tetap harus menulis $I_x$ dalam tegangan simpul agar persamaan bisa diselesaikan.',
  ],
};

/* ---------- Contoh 2: arus mesh (dua loop dengan sumber tak-bebas) ---------- */
const CONTOH_MESH = {
  id: 'mesh',
  judul: 'Arus mesh dengan sumber tak-bebas',
  soal: 'Sumber $150\\angle 0^\\circ$ V di loop kiri. Loop kiri berisi $1\\,\\Omega$ seri $j2\\,\\Omega$, $12\\,\\Omega$ seri $-j16\\,\\Omega$ di bagian tengah. Loop kanan berisi $1\\,\\Omega$ seri $j3\\,\\Omega$ dan sumber tak-bebas $39\\,I_x$. Cari $\\mathbf{V}_1$, $\\mathbf{V}_2$, dan $\\mathbf{V}_3$.',
  pos: { p: [100, 120], B: [260, 120], M: [260, 260], Rn: [460, 120], g: [100, 340] },
  ground: 'g',
  elements() {
    return [
      { id: 'Vg', kind: 'V', a: 'p', b: 'g', E: CC.c(150, 0), label: '150∠0° V' },
      { id: 'Z1', kind: 'Z', a: 'p', b: 'B', z: CC.c(1, 2), label: '1 Ω + j2 Ω' },
      { id: 'Z12', kind: 'Z', a: 'B', b: 'M', z: CR(12), label: '12 Ω' },
      { id: 'Zc', kind: 'Z', a: 'M', b: 'g', z: CJ(-16), path: [[260, 340]], label: '−j16 Ω' },
      { id: 'Z3', kind: 'Z', a: 'B', b: 'Rn', z: CC.c(1, 3), label: '1 Ω + j3 Ω' },
      { id: 'Dep', kind: 'CCVS', a: 'Rn', b: 'g', ctrl: 'Z12', k: CR(39), path: [[460, 340]], label: '39·Ix' },
    ];
  },
  hitung() {
    // Persamaan loop (dengan Ix = I1 − I2 dan konvensi searah jarum jam)
    // Loop 1: (13 − j14) I1 − (12 − j16) I2 = 150
    // Loop 2: (27 + j16) I1 − (26 + j13) I2 = 0
    const a11 = CC.c(13, -14), a12 = CC.neg(CC.c(12, -16));
    const a21 = CC.c(27, 16), a22 = CC.neg(CC.c(26, 13));
    const { x1: I1, x2: I2 } = cramer2(a11, a12, a21, a22, CR(150), CR(0));
    const Ix = CC.sub(I1, I2);
    const V1 = CC.mul(CC.c(1, 2), I1);
    const V2 = CC.mul(CC.c(12, -16), Ix);
    const V3 = CC.mul(CC.c(1, 3), I2);
    // Cek dengan solver nodal
    const s = CONTOH_S.run(this.elements(), this.ground);
    return { I1, I2, Ix, V1, V2, V3, cekV1: s.cur('Z1'), cekV3: CC.sub(s.v('B'), s.v('Rn')) };
  },
  kunci: { I1: CC.c(-26, -52), I2: CC.c(-24, -58), Ix: CC.c(-2, 6), V1: CC.c(78, -104), V2: CC.c(72, 104), V3: CC.c(150, -130) },
  langkah(r) {
    return [
      { j: 'Tentukan arus mesh', t: `Beri arus $I_1$ di loop kiri dan $I_2$ di loop kanan, keduanya searah jarum jam. Arus di bagian tengah yang dipakai bersama adalah $I_x = I_1 - I_2$.` },
      { j: 'KVL loop 1', t: `Jumlahkan tegangan di loop kiri: sumber 150 V sama dengan jatuh tegangan di $1+j2$ dan $12-j16$.\n$$150 = (1+j2)I_1 + (12-j16)(I_1 - I_2)\\quad\\Rightarrow\\quad (13-j14)I_1 - (12-j16)I_2 = 150$$` },
      { j: 'KVL loop 2', t: `Tegangan di loop kanan sama dengan nol. Ganti $39I_x$ dengan $39(I_1 - I_2)$:\n$$0 = (12-j16)(I_2 - I_1) + (1+j3)I_2 + 39(I_1 - I_2)\\quad\\Rightarrow\\quad (27+j16)I_1 - (26+j13)I_2 = 0$$` },
      { j: 'Selesaikan dua persamaan', t: `Dengan aturan Cramer:\n$$I_1 = ${CT.rect(r.I1)}\\ \\text{A},\\qquad I_2 = ${CT.rect(r.I2)}\\ \\text{A}$$` },
      { j: 'Hitung Ix dan tegangan', t: `$$I_x = I_1 - I_2 = ${CT.rect(r.Ix)}\\ \\text{A}$$\n$$\\mathbf{V}_1 = (1+j2)I_1 = ${CT.rect(r.V1)}\\ \\text{V}$$\n$$\\mathbf{V}_2 = (12-j16)I_x = ${CT.rect(r.V2)}\\ \\text{V}$$\n$$\\mathbf{V}_3 = (1+j3)I_2 = ${CT.rect(r.V3)}\\ \\text{V}$$` },
      { j: 'Cek', t: `Jumlah tegangan di loop kiri: $-150 + \\mathbf{V}_1 + \\mathbf{V}_2 = -150 + (78-j104) + (72+j104) = 0$. Nilainya nol, jadi konsisten.` },
    ];
  },
  pelajaran: [
    'Arus mesh cocok untuk rangkaian dengan beberapa loop dan sumber tegangan. Tulis satu KVL untuk setiap loop.',
    'Arus di bagian yang dipakai dua loop adalah selisih arus mesh. Ini kunci untuk mengganti $I_x$ dalam persamaan.',
  ],
};

/* ---------- Contoh 3: ekuivalen Thévenin dengan sumber tak-bebas ---------- */
const CONTOH_THEV = {
  id: 'thevenin',
  judul: 'Ekuivalen Thévenin dengan sumber tak-bebas',
  soal: 'Sumber $120\\angle 0^\\circ$ V, resistor $12\\,\\Omega$, resistor $60\\,\\Omega$ dengan tegangan $V_x$, kapasitor $-j40\\,\\Omega$, resistor $120\\,\\Omega$, dan sumber tak-bebas $10\\,V_x$. Cari ekuivalen Thévenin di terminal $a$–$b$.',
  pos: { p: [100, 120], A: [240, 120], a: [460, 120], D: [460, 260], g: [100, 340], bt: [460, 340] },
  ground: 'g',
  elements(aktif = true) {
    return [
      { id: 'Vs', kind: 'V', a: 'p', b: 'g', E: aktif ? CR(120) : CR(0), label: '120∠0° V' },
      { id: 'R12', kind: 'Z', a: 'p', b: 'A', z: CR(12), label: '12 Ω' },
      { id: 'Cj40', kind: 'Z', a: 'A', b: 'a', z: CJ(-40), label: '−j40 Ω' },
      { id: 'R60', kind: 'Z', a: 'A', b: 'g', z: CR(60), path: [[240, 340]], label: '60 Ω (Vx)' },
      { id: 'R120', kind: 'Z', a: 'a', b: 'D', z: CR(120), label: '120 Ω' },
      { id: 'Dep', kind: 'VCVS', a: 'D', b: 'g', c: 'A', d: 'g', k: CR(10), path: [[460, 340]], label: '10·Vx' },
      { id: 'Wb', kind: 'V', a: 'bt', b: 'g', E: CR(0), wire: true },
    ];
  },
  hitung() {
    const s = CONTOH_S.run(this.elements(true), this.ground);
    const Vth = CC.sub(s.v('a'), s.v('bt'));
    // Impedansi Thévenin: matikan sumber bebas, pasang sumber uji 1 A di a
    const els = this.elements(false).concat([{ id: 'It', kind: 'I', a: 'bt', b: 'a', J: CR(1) }]);
    const s2 = CONTOH_S.run(els, this.ground);
    const Zth = CC.sub(s2.v('a'), s2.v('bt'));
    return { Vth, Zth, Vx: s.v('A') };
  },
  kunci: { Vth: CC.c(784, -288), Zth: CC.c(91.2, -38.4) },
  langkah(r) {
    return [
      { j: 'Sumber tak-bebas tetap dipertahankan', t: `Sumber $10\\,V_x$ bergantung pada tegangan $V_x$, jadi tidak boleh dimatikan. Pada langkah pertama kita cari $V_{Th}$ dengan semua sumber aktif.` },
      { j: 'Cari V_Th (terminal terbuka)', t: `Dengan $a$–$b$ terbuka, tidak ada arus keluar. Tulis KCL di simpul $A$ dan simpul $a$. Hasilnya:\n$$\\mathbf{V}_{Th} = ${CT.rect(r.Vth)}\\ \\text{V} = ${CT.polar(r.Vth)}\\ \\text{V}$$` },
      { j: 'Matikan sumber bebas untuk Z_Th', t: `Ganti $120\\angle 0^\\circ$ V dengan hubung singkat. Sumber $10V_x$ tetap ada. Pasang sumber uji $1$ A di $a$–$b$ dan hitung tegangan $\\mathbf{V}_{ab}$ yang muncul.` },
      { j: 'Hitung Z_Th', t: `$$\\mathbf{Z}_{Th} = \\dfrac{\\mathbf{V}_{ab}}{\\mathbf{I}_{uji}} = ${CT.rect(r.Zth)}\\ \\Omega$$` },
      { j: 'Tulis ekuivalen', t: `Sumber tegangan $${CT.rect(r.Vth)}$ V seri dengan $Z_{Th} = ${CT.rect(r.Zth)}\\ \\Omega$.` },
    ];
  },
  pelajaran: [
    'Untuk sumber tak-bebas, $Z_{Th}$ dicari dengan sumber uji, bukan dengan mematikan sumber tak-bebas.',
    'Mulai dari sumber tegangan yang menempel ke acuan. Itu membuat simpul tetap dan mengurangi persamaan.',
  ],
};

/* ---------- Contoh 4: transformasi sumber (seri–paralel dengan sumber tegangan) ---------- */
const CONTOH_SRC = {
  id: 'transformasi',
  judul: 'Transformasi sumber untuk menyederhanakan rangkaian',
  soal: 'Sumber $40\\angle 0^\\circ$ V dengan $1\\,\\Omega$ seri $j3\\,\\Omega$. Cabang tengah berisi $9\\,\\Omega$ seri $-j3\\,\\Omega$. Cabang kanan berisi $0{,}2\\,\\Omega$ seri $j0{,}6\\,\\Omega$, lalu $10\\,\\Omega$ seri $-j19\\,\\Omega$. Cari tegangan $\\mathbf{V}_0$ di ujung kanan.',
  pos: { p: [80, 120], N1: [260, 120], V0: [430, 120], g: [80, 340] },
  ground: 'g',
  elements() {
    return [
      { id: 'Vs', kind: 'V', a: 'p', b: 'g', E: CR(40), label: '40∠0° V' },
      { id: 'Z1', kind: 'Z', a: 'p', b: 'N1', z: CC.c(1, 3), label: '1 Ω + j3 Ω' },
      { id: 'Z2', kind: 'Z', a: 'N1', b: 'g', z: CC.c(9, -3), path: [[260, 340]], label: '9 Ω − j3 Ω' },
      { id: 'Z3', kind: 'Z', a: 'N1', b: 'V0', z: CC.c(0.2, 0.6), label: '0,2 Ω + j0,6 Ω' },
      { id: 'Z4', kind: 'Z', a: 'V0', b: 'g', z: CC.c(10, -19), path: [[430, 340]], label: '10 Ω − j19 Ω' },
    ];
  },
  hitung() {
    const s = CONTOH_S.run(this.elements(), this.ground);
    const V0 = s.v('V0');
    // Langkah transformasi: sumber tegangan 40 V seri (1+j3) → sumber arus 40/(1+j3) paralel (1+j3)
    const Zs = CC.c(1, 3);
    const Is = CC.div(CR(40), Zs);
    return { V0, Is, Zs };
  },
  kunci: { V0: CC.c(36.12, -18.84) },
  langkah(r) {
    return [
      { j: 'Ubah sumber tegangan menjadi sumber arus', t: `Sumber $40$ V seri $1+j3\\,\\Omega$ setara dengan sumber arus $$\\mathbf{I}_s = \\dfrac{40}{1+j3} = ${CT.rect(r.Is)}\\ \\text{A}$$ paralel dengan $1+j3\\,\\Omega$.` },
      { j: 'Sederhanakan dengan pembagi', t: `Sekarang sumber arus $\\mathbf{I}_s$ bertemu dengan cabang paralel. Gabungkan elemen yang seri di satu cabang, lalu gunakan pembagi arus atau ubah lagi ke sumber tegangan.` },
      { j: 'Ubah kembali ke sumber tegangan', t: `Sumber arus paralel dengan impedansi dapat diubah lagi menjadi sumber tegangan seri impedansi. Setelah itu, rangkaian berbentuk satu loop dan $\\mathbf{V}_0$ dihitung dengan pembagi tegangan.` },
      { j: 'Hasil', t: `$$\\mathbf{V}_0 = ${CT.rect(r.V0)}\\ \\text{V} = ${CT.polar(r.V0)}\\ \\text{V}$$` },
      { j: 'Kenapa hasil ini masuk akal', t: `Pada akhirnya kamu hanya perlu tahu bahwa transformasi sumber tidak mengubah tegangan di terminal yang tidak ikut diubah. Jadi, hasil di $V_0$ tetap sama.` },
    ];
  },
  pelajaran: [
    'Transformasi sumber berjalan dua arah. Pilih arah yang membuat impedansi bisa digabung, lalu cek bahwa arahnya benar.',
    'Ketika ada sumber arus paralel dengan impedansi, impedansi itu bisa diabaikan saat menghitung arus sumber, tapi tidak saat menghitung tegangan terminal.',
  ],
};

/* ---------- Contoh 5: arus cabang paralel (pembagi arus dengan tiga cabang) ---------- */
const CONTOH_PARALEL = {
  id: 'paralel',
  judul: 'Tiga cabang paralel dan pembagi arus',
  soal: 'Sumber arus $8\\angle 0^\\circ$ A dipasang paralel dengan $10\\,\\Omega$, dengan cabang $6\\,\\Omega$ seri $j8\\,\\Omega$, dan kapasitor $-j5\\,\\Omega$. Cari tegangan $\\mathbf{V}$ dan arus cabang $\\mathbf{I}_1$, $\\mathbf{I}_2$, $\\mathbf{I}_3$.',
  pos: { t: [100, 120], g: [100, 340] },
  ground: 'g',
  elements() {
    return [
      { id: 'Is', kind: 'I', a: 'g', b: 't', J: CR(8), label: '8∠0° A' },
      { id: 'I1', kind: 'Z', a: 't', b: 'g', z: CR(10), path: [[250, 120], [250, 340]], label: 'I₁ (10 Ω)' },
      { id: 'I2', kind: 'Z', a: 't', b: 'g', z: CC.c(6, 8), path: [[400, 120], [400, 340]], label: 'I₂ (6 + j8)' },
      { id: 'I3', kind: 'Z', a: 't', b: 'g', z: CJ(-5), path: [[550, 120], [550, 340]], label: 'I₃ (−j5)' },
    ];
  },
  hitung() {
    const s = CONTOH_S.run(this.elements(), this.ground);
    return { V: s.v('t'), I1: s.cur('I1'), I2: s.cur('I2'), I3: s.cur('I3') };
  },
  kunci: { V: CC.c(32, -24), I1: CC.c(3.2, -2.4), I2: CC.c(0, -4), I3: CC.c(4.8, 6.4) },
  langkah(r) {
    return [
      { j: 'Semua cabang paralel, tegangan sama', t: `Ketiga elemen terhubung ke simpul $t$ dan rel bawah, jadi tegangannya sama: $\\mathbf{V}$. Pembagi arus berlaku.` },
      { j: 'Impedansi tiap cabang', t: `$$Z_1 = 10\\ \\Omega,\\qquad Z_2 = 6+j8\\ \\Omega = 10\\angle 53{,}13^\\circ\\ \\Omega,\\qquad Z_3 = -j5\\ \\Omega = 5\\angle -90^\\circ\\ \\Omega$$` },
      { j: 'Admitansi total dan tegangan', t: `Admitansi total $Y = 1/10 + 1/(6+j8) + 1/(-j5) = 0{,}16 + j0{,}12 = 0{,}2\\angle 36{,}87^\\circ$ S. Impedansi ekuivalen $Z = 5\\angle -36{,}87^\\circ\\ \\Omega$. Tegangan $\\mathbf{V} = \\mathbf{I}_s Z = 8\\angle 0^\\circ \\cdot 5\\angle -36{,}87^\\circ = ${CT.polar(r.V)}\\ \\text{V}$.` },
      { j: 'Arus tiap cabang', t: `$$\\mathbf{I}_1 = \\dfrac{\\mathbf{V}}{10} = ${CT.rect(r.I1)}\\ \\text{A},\\qquad \\mathbf{I}_2 = \\dfrac{\\mathbf{V}}{6+j8} = ${CT.rect(r.I2)}\\ \\text{A}$$\n$$\\mathbf{I}_3 = \\dfrac{\\mathbf{V}}{-j5} = ${CT.rect(r.I3)}\\ \\text{A}$$` },
      { j: 'Cek', t: `Jumlahkan arus cabang: $\\mathbf{I}_1 + \\mathbf{I}_2 + \\mathbf{I}_3 = 8 + j0$ A. Ini sama dengan arus sumber, jadi benar.` },
    ];
  },
  pelajaran: [
    'Pembagi arus untuk cabang paralel: setiap cabang mendapat arus berbanding terbalik dengan impedansinya.',
    'Cek selalu dengan menjumlahkan arus cabang. Hasilnya harus sama dengan arus sumber.',
  ],
};

const CONTOH = [CONTOH_NODE, CONTOH_MESH, CONTOH_THEV, CONTOH_SRC, CONTOH_PARALEL];

if (typeof module !== 'undefined') module.exports = { CONTOH, cramer2 };
