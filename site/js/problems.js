/*
 * Data 14 soal Bab 9 (analisis fasor). Setiap soal berisi:
 *  - pos      : koordinat simpul untuk gambar (viewBox 600 x 400)
 *  - elements : netlist sesuai gambar soal
 *  - analyze(): hitung hasil dengan Solver, mengembalikan daftar `outs`
 *               (kind 'aux' = nilai antara, tidak ditampilkan di Hasil)
 *  - expect   : nilai kunci dari buku soal, dipakai untuk verifikasi
 *  - display(): kasus-kasus rangkaian untuk animasi
 *  - steps(o) : langkah pengerjaan dalam notasi matematika (LaTeX di dalam $...$)
 * Langkah dan penjelasan ditulis ulang dengan kata-kata sendiri.
 */
const S = Solver;
const { C, L, Cap, run, fmt, tex: T } = S;
const R = (x) => C.c(x, 0);       // resistansi real
const JX = (x) => C.c(0, x);      // reaktansi j·x
const PH = (r, d) => C.polar(r, d);
const P = (z) => T.polar(z);      // bentuk polar untuk LaTeX
const Rc = (z) => T.rect(z);      // bentuk rektangular untuk LaTeX
const Tm = (z, w) => T.time(z, w);
const mA = (z) => C.scale(1000, z);

/* Helper untuk membuat keluaran hasil */
function out(key, label, z, kind, unit, omega) {
  return { key, label, z, kind, unit, omega: omega ?? null };
}

/* ---------- Soal 1: P9.22 ---------- */
const P1 = {
  id: 'P9.22', judul: 'Impedansi seri–paralel, cari Zab',
  tipe: 'Impedansi (tanpa sumber)', omega: null, ground: 'b',
  ringkas: 'Gabungkan impedansi pasif antara terminal a dan b. Jawaban diminta dalam bentuk rektangular dan polar.',
  pos: { a: [40, 180], X: [140, 180], T: [320, 60], N: [320, 200], R: [460, 200], P: [320, 300], Q: [460, 300], b: [320, 400] },
  elements: [
    { id: 'R5', kind: 'Z', a: 'a', b: 'X', z: R(5), label: '5 Ω' },
    { id: 'L8', kind: 'Z', a: 'X', b: 'T', z: JX(8), path: [[140, 60]], label: 'j8 Ω' },
    { id: 'R10', kind: 'Z', a: 'T', b: 'N', z: R(10), label: '10 Ω' },
    { id: 'C20', kind: 'Z', a: 'T', b: 'R', z: JX(-20), path: [[460, 60]], label: '−j20 Ω' },
    { id: 'W1', kind: 'V', a: 'N', b: 'R', E: C.c(0, 0), wire: true },
    { id: 'L16', kind: 'Z', a: 'N', b: 'P', z: JX(16), label: 'j16 Ω' },
    { id: 'R8', kind: 'Z', a: 'P', b: 'b', z: R(8), label: '8 Ω' },
    { id: 'R40', kind: 'Z', a: 'R', b: 'Q', z: R(40), label: '40 Ω' },
    { id: 'C80', kind: 'Z', a: 'Q', b: 'b', z: JX(-80), path: [[460, 400]], label: '−j80 Ω' },
    { id: 'IT', kind: 'I', a: 'b', b: 'a', J: C.c(1, 0), path: [[40, 400]], label: 'I_uji = 1 A' },
  ],
  analyze() {
    const s = run(this.elements, this.ground);
    return [out('Zab', 'Z_ab', C.sub(s.v('a'), s.v('b')), 'imp', 'Ω', null)];
  },
  expect: { Zab: C.c(25, 20) },
  display() { return [{ omega: null, elements: this.elements }]; },
  steps(o) {
    const z2 = C.div(C.mul(R(10), JX(-20)), C.c(10, -20));
    const z3 = C.div(C.mul(C.c(8, 16), C.c(40, -80)), C.c(48, -64));
    return [
      { j: 'Cari bagian yang seri', t: `Kawat dari $a$ ke simpul atas tidak bercabang. Jadi $5\\,\\Omega$ dan $j8\\,\\Omega$ langsung seri: $Z_1 = 5 + j8\\ \\Omega$.` },
      { j: 'Paralelkan cabang kanan atas', t: `$10\\,\\Omega$ paralel $-j20\\,\\Omega$:\n$$Z_2 = \\dfrac{(10)(-j20)}{10 - j20} = ${Rc(z2)}\\ \\Omega$$` },
      { j: 'Paralelkan cabang kanan bawah', t: `Kawat tengah menyatukan dua cabang yang keluar dari simpul yang sama. $(8+j16)\\parallel(40-j80)$:\n$$Z_3 = \\dfrac{(8+j16)(40-j80)}{(8+j16)+(40-j80)} = ${Rc(z3)}\\ \\Omega$$` },
      { j: 'Jumlahkan semua yang seri', t: `$$Z_{ab} = (5+j8) + (8-j4) + (12+j16) = ${Rc(o.Zab.z)}\\ \\Omega$$` },
      { j: 'Ubah ke polar', t: `$$|Z_{ab}| = \\sqrt{25^2 + 20^2} = ${T.num(C.abs(o.Zab.z))}\\ \\Omega,\\qquad \\theta = \\tan^{-1}\\dfrac{20}{25} = ${T.num(C.deg(o.Zab.z))}^\\circ$$` },
    ];
  },
  pelajaran: [
    'Gabungkan dulu cabang yang paling jauh dari terminal, lalu mundur ke $a$ dan $b$.',
    'Kawat tanpa komponen berarti dua simpul sama. Tandai itu sebelum menghitung.',
  ],
  jebakan: [
    'Tanda kapasitor selalu negatif pada bagian khayal: $Z_C = \\dfrac{1}{j\\omega C} = -\\dfrac{j}{\\omega C}$.',
    'Periksa dulu kawat yang menyatukan simpul sebelum memparalelkan apa pun.',
  ],
};

/* ---------- Soal 2: P9.28 ---------- */
const P2 = {
  id: 'P9.28', judul: 'Rangkaian seri R–C–L, cari io(t) keadaan tunak',
  tipe: 'Seri satu loop', omega: 2000, ground: 'm',
  ringkas: 'Sumber 80 cos(2000t) V menggerakkan satu loop berisi R, C, dan L. Cari arus io(t) dalam bentuk kosinus.',
  pos: { p: [80, 60], n2: [300, 60], n3: [300, 300], m: [80, 300] },
  elements(w) {
    return [
      { id: 'R3k', kind: 'Z', a: 'p', b: 'n2', z: R(3000), label: '3 kΩ' },
      { id: 'C100n', kind: 'Z', a: 'n2', b: 'n3', z: Cap(100e-9, w), label: '100 nF' },
      { id: 'L500m', kind: 'Z', a: 'n3', b: 'm', z: L(0.5, w), label: '500 mH' },
      { id: 'Vs', kind: 'V', a: 'p', b: 'm', E: PH(80, 0), label: 'vs = 80 cos 2000t' },
    ];
  },
  analyze() {
    const w = this.omega;
    const s = run(this.elements(w), this.ground);
    return [out('io', 'i_o', s.cur('R3k'), 'phasor', 'A', w)];
  },
  expect: { io: PH(0.016, 53.13) },
  display() { return [{ omega: this.omega, elements: this.elements(this.omega) }]; },
  steps(o) {
    const z = C.c(3000, -4000);
    return [
      { j: 'Tentukan frekuensi sudut', t: `Dari sumber, $\\omega = 2000$ rad/s. Semua elemen dihitung pada frekuensi ini.` },
      { j: 'Hitung reaktansi', t: `$$X_L = \\omega L = 2000 \\cdot 0{,}5 = 1000\\ \\Omega$$\n$$X_C = -\\dfrac{1}{\\omega C} = -\\dfrac{1}{2000 \\cdot 100\\cdot 10^{-9}} = -5000\\ \\Omega$$` },
      { j: 'Jumlahkan impedansi seri', t: `Satu loop berarti semua elemen seri: $$Z = 3000 + j1000 - j5000 = ${Rc(z)}\\ \\Omega$$` },
      { j: 'Hukum Ohm fasor', t: `$$\\mathbf{I}_o = \\dfrac{\\mathbf{V}_s}{Z} = \\dfrac{80\\angle 0^\\circ}{${P(z)}\\ \\Omega} = ${P(o.io.z)}\\ \\text{A}$$` },
      { j: 'Kembali ke waktu', t: `$$i_o(t) = ${Tm(mA(o.io.z), 2000)}\\ \\text{mA}$$` },
    ];
  },
  pelajaran: [
    'Pada loop tunggal cukup satu pembagian $\\mathbf{V}/Z$. Tidak perlu persamaan simpul atau loop tambahan.',
    'Sumber sinus harus diubah ke kosinus lebih dulu. Itu aturan baku dosen, bukan opsional.',
  ],
  jebakan: [
    'Kapasitor menghasilkan bagian khayal negatif. Menulis $Z_C = +j5000$ membalik tanda sudut jawaban.',
    'Jawaban bentuk waktu harus fungsi waktu, bukan fasor saja.',
  ],
};

/* ---------- Soal 3: P9.30 ---------- */
const P3 = {
  id: 'P9.30', judul: 'Rangkaian R–L–C campuran, cari io(t) untuk sumber sinus',
  tipe: 'Seri–paralel, sumber sinus', omega: 4000, ground: 'g',
  ringkas: 'Sumber 25 sin(4000t) V. Cari io(t), yaitu arus dari sumber yang melewati resistor 5 Ω paling atas.',
  // Susunan gambar mengikuti soal: 5 Ω, lalu simpul A (2,5 mH menggantung),
  // 10 Ω, lalu simpul B (20 Ω dan 12,5 µF paralel ke bawah).
  pos: { p: [60, 80], A: [220, 80], B: [380, 80], g: [60, 340] },
  elements(w) {
    return [
      { id: 'Vs', kind: 'V', a: 'p', b: 'g', E: PH(25, -90), label: 'vs = 25 sin 4000t' },
      { id: 'R5', kind: 'Z', a: 'p', b: 'A', z: R(5), label: '5 Ω' },
      { id: 'L25m', kind: 'Z', a: 'A', b: 'g', z: L(2.5e-3, w), path: [[220, 340]], label: '2,5 mH' },
      { id: 'R10', kind: 'Z', a: 'A', b: 'B', z: R(10), label: '10 Ω' },
      { id: 'R20', kind: 'Z', a: 'B', b: 'g', z: R(20), path: [[380, 340]], label: '20 Ω' },
      { id: 'C125', kind: 'Z', a: 'B', b: 'g', z: Cap(12.5e-6, w), path: [[480, 80], [480, 340]], label: '12,5 µF' },
    ];
  },
  analyze() {
    const w = this.omega;
    const s = run(this.elements(w), this.ground);
    return [
      out('io', 'i_o', s.cur('R5'), 'phasor', 'A', w),
      out('ZT', 'Z_T', C.add(R(5), C.div(C.mul(JX(10), C.add(R(10), C.div(C.mul(R(20), JX(-20)), C.add(R(20), JX(-20))))), C.add(JX(10), C.add(R(10), C.div(C.mul(R(20), JX(-20)), C.add(R(20), JX(-20))))))), 'aux', 'Ω', w),
    ];
  },
  expect: { io: PH(1.77, -135) },
  display() { return [{ omega: this.omega, elements: this.elements(this.omega) }]; },
  steps(o) {
    const z1 = C.div(C.mul(R(20), JX(-20)), C.add(R(20), JX(-20)));   // 20 ∥ (−j20)
    const z2 = C.add(R(10), z1);                                      // 10 + Z1
    const z3 = C.div(C.mul(JX(10), z2), C.add(JX(10), z2));           // j10 ∥ Z2
    return [
      { j: 'Ubah sinus menjadi kosinus', t: `$\\sin\\theta = \\cos(\\theta - 90^\\circ)$, jadi $$v_s = 25\\cos(4000t - 90^\\circ)\\ \\text{V}\\qquad\\Rightarrow\\qquad \\mathbf{V}_s = 25\\angle -90^\\circ = -j25\\ \\text{V}$$` },
      { j: 'Hitung reaktansi', t: `$$X_L = \\omega L = 4000 \\cdot 2{,}5\\cdot 10^{-3} = 10\\ \\Omega \\;\\Rightarrow\\; j10\\ \\Omega$$\n$$X_C = -\\dfrac{1}{\\omega C} = -\\dfrac{1}{4000 \\cdot 12{,}5\\cdot 10^{-6}} = -20\\ \\Omega \\;\\Rightarrow\\; -j20\\ \\Omega$$` },
      { j: 'Paralelkan 20 Ω dengan kapasitor', t: `$$Z_1 = 20 \\parallel (-j20) = \\dfrac{(20)(-j20)}{20 - j20} = ${Rc(z1)}\\ \\Omega$$` },
      { j: 'Tambahkan 10 Ω, lalu paralelkan dengan induktor', t: `$$Z_2 = 10 + Z_1 = ${Rc(z2)}\\ \\Omega$$\n$$Z_3 = j10 \\parallel Z_2 = \\dfrac{(j10)(${Rc(z2)})}{j10 + ${Rc(z2)}} = ${Rc(z3)}\\ \\Omega$$` },
      { j: 'Impedansi total', t: `Resistor 5 Ω seri dengan sisanya: $$Z_T = 5 + Z_3 = ${Rc(C.add(R(5), z3))}\\ \\Omega = ${P(C.add(R(5), z3))}\\ \\Omega$$` },
      { j: 'Arus sumber', t: `$$\\mathbf{I}_o = \\dfrac{\\mathbf{V}_s}{Z_T} = \\dfrac{25\\angle -90^\\circ}{${P(C.add(R(5), z3))}} = ${P(o.io.z)}\\ \\text{A}$$` },
      { j: 'Kembali ke waktu', t: `$$i_o(t) = ${Tm(o.io.z, 4000)}\\ \\text{A}$$` },
    ];
  },
  pelajaran: [
    'Sumber sinus harus diubah ke kosinus lebih dulu. Ini aturan baku, bukan trik tambahan.',
    'Reduksi dari cabang yang paling jauh. Di sini itu kapasitor dan $20\\,\\Omega$, lalu $10\\,\\Omega$, baru induktor.',
  ],
  jebakan: [
    'Jika kalkulator menunjukkan $-135^\\circ$ dan kamu lupa menggeser fasor, hasil akhirnya salah $90^\\circ$.',
    'Periksa kuadran setelah mengubah ke polar: $\\tan^{-1}$ tidak tahu kuadran.',
  ],
};

/* ---------- Soal 4: P9.31 ---------- */
const P4 = {
  id: 'P9.31', judul: 'Sumber arus, cari vo(t) dan selisih waktu',
  tipe: 'Sumber arus + tangga R–L–C', omega: 50000, ground: 'g',
  ringkas: 'Sumber arus ig = 25 cos(50000t) mA. Cari vo(t) keadaan tunak, lalu hitung berapa mikrodetik vo mendahului ig.',
  pos: { g: [60, 320], A: [200, 80], B: [400, 80] },
  elements(w) {
    return [
      { id: 'Ig', kind: 'I', a: 'g', b: 'A', J: C.c(0.025, 0), path: [[60, 80]], label: 'ig = 25 mA' },
      { id: 'L4m', kind: 'Z', a: 'A', b: 'g', z: L(4e-3, w), path: [[200, 320]], label: '4 mH' },
      { id: 'R100', kind: 'Z', a: 'A', b: 'B', z: R(100), label: '100 Ω' },
      { id: 'C80n', kind: 'Z', a: 'B', b: 'g', z: Cap(80e-9, w), path: [[400, 320]], label: '80 nF' },
      { id: 'R500', kind: 'Z', a: 'B', b: 'g', z: R(500), path: [[500, 80], [500, 320]], label: '500 Ω' },
    ];
  },
  analyze() {
    const w = this.omega;
    const s = run(this.elements(w), this.ground);
    const vo = s.v('B');
    const dt = ((C.deg(vo) * Math.PI) / 180) / w; // selisih waktu dari fase
    return [
      out('vo', 'v_o', vo, 'phasor', 'V', w),
      out('dt', 'Δt', C.c(dt * 1e6, 0), 'value', 'µs', w),
    ];
  },
  expect: { vo: PH(5.59, 26.57), dt: C.c(9.27, 0) },
  display() { return [{ omega: this.omega, elements: this.elements(this.omega) }]; },
  steps(o) {
    return [
      { j: 'Tentukan ω dan reaktansi', t: `$\\omega = 50000$ rad/s.\n$$X_L = \\omega L = 50000 \\cdot 4\\cdot 10^{-3} = 200\\ \\Omega \\;\\Rightarrow\\; j200\\ \\Omega$$\n$$X_C = -\\dfrac{1}{50000 \\cdot 80\\cdot 10^{-9}} = -250\\ \\Omega \\;\\Rightarrow\\; -j250\\ \\Omega$$` },
      { j: 'Sumber arus ke fasor', t: `$i_g = 25\\cos(50000t)$ mA berarti $\\mathbf{I}_g = 25\\angle 0^\\circ$ mA $= 0{,}025\\angle 0^\\circ$ A. Sumber arus tidak perlu diubah.` },
      { j: 'Tegangan simpul', t: `Simpul $A$ dan $B$ belum diketahui. Dari $A$ keluar $j200\\,\\Omega$ ke acuan dan $100\\,\\Omega$ ke $B$. Dari $B$ keluar $-j250\\,\\Omega$ dan $500\\,\\Omega$ ke acuan.` },
      { j: 'Hasil fasor v_o', t: `$$\\mathbf{V}_o = ${P(o.vo.z)}\\ \\text{V}$$` },
      { j: 'Bentuk waktu', t: `$$v_o(t) = ${Tm(o.vo.z, 50000)}\\ \\text{V}$$` },
      { j: 'Selisih waktu', t: `Ubah sudut ke radian lalu bagi $\\omega$:\n$$\\Delta t = \\dfrac{\\theta_{\\text{rad}}}{\\omega} = \\dfrac{${T.num(C.deg(o.vo.z))}^\\circ \\cdot \\frac{\\pi}{180}}{50000} = ${T.num(o.dt.z.re)}\\ \\mu\\text{s}$$` },
    ];
  },
  pelajaran: [
    'Sudut fase dalam radian dibagi $\\omega$ memberi selisih waktu. Jangan membagi sudut derajat langsung.',
    'Sumber arus dengan dua simpul tak diketahui cocok untuk analisis simpul.',
  ],
  jebakan: [
    'Membagi $26{,}57^\\circ$ langsung dengan $50000$ memberi satuan yang salah. Ubah ke radian dulu.',
    'Pembulatan sudut di tengah perhitungan menggeser $\\Delta t$. Simpan angka penuh sampai akhir.',
  ],
};

/* ---------- Soal 5: P9.33 ---------- */
const P5 = {
  id: 'P9.33', judul: 'Node-voltage untuk mencari impedansi Z yang belum diketahui',
  tipe: 'Impedansi tak diketahui', omega: null, ground: 'g',
  ringkas: 'Diketahui Vg, Ig, dan V1. Tentukan impedansi Z yang berada di antara terminal sumber tegangan dan simpul V1.',
  pos: { g: [60, 320], L: [60, 80], V2: [200, 200], M: [300, 200], V1: [460, 80] },
  elements(zUnknown) {
    return [
      { id: 'Vg', kind: 'V', a: 'L', b: 'g', E: C.c(100, -50), label: 'Vg = 100 − j50 V' },
      { id: 'ZX', kind: 'Z', a: 'L', b: 'V1', z: zUnknown, path: [[260, 80]], label: 'Z = ?' },
      { id: 'R20', kind: 'Z', a: 'L', b: 'V2', z: R(20), path: [[130, 80], [130, 200]], label: '20 Ω' },
      { id: 'J5', kind: 'Z', a: 'V2', b: 'g', z: JX(5), path: [[200, 320]], label: 'j5 Ω' },
      { id: 'R12', kind: 'Z', a: 'V2', b: 'M', z: R(12), label: '12 Ω' },
      { id: 'J16', kind: 'Z', a: 'M', b: 'V1', z: JX(16), path: [[460, 200]], label: 'j16 Ω' },
      { id: 'Cm10', kind: 'Z', a: 'V1', b: 'g', z: JX(-10), path: [[460, 320]], label: '−j10 Ω' },
      { id: 'Ig', kind: 'I', a: 'g', b: 'V1', J: C.c(30, 20), path: [[540, 320], [540, 80]], label: 'Ig = 30 + j20 A' },
    ];
  },
  analyze() {
    // V1 diketahui: pasang sumber tegangan paksa di V1 agar V2 bisa dihitung.
    // Arus yang keluar dari sumber paksa ke V1 sama dengan arus lewat Z.
    const V1 = C.c(140, 30);
    const els = this.elements(null).filter((e) => e.id !== 'ZX');
    els.push({ id: 'VF', kind: 'V', a: 'V1', b: 'g', E: V1, wire: false });
    const s = run(els, this.ground);
    const VL = s.v('L');
    const Iz = s.J('VF');
    const Z = C.div(C.sub(VL, V1), Iz);
    return [
      out('Z', 'Z', Z, 'imp', 'Ω', null),
      out('V2', 'V_2', s.v('V2'), 'aux', 'V', null),
      out('Iz', 'I_Z', Iz, 'aux', 'A', null),
    ];
  },
  expect: { Z: C.c(2, 2) },
  display() {
    const z = this.analyze()[0].z;
    return [{ omega: null, elements: this.elements(z) }];
  },
  steps(o) {
    return [
      { j: 'Pilih acuan', t: `Rel bawah sebagai acuan. Sumber $\\mathbf{V}_g$ menempel pada simpul kiri atas, jadi $\\mathbf{V}_L = 100 - j50$ V sudah diketahui.` },
      { j: 'Tegangan simpul V_1 sudah diberikan', t: `$\\mathbf{V}_1 = 140 + j30$ V. Dengan $\\mathbf{V}_1$ diketahui, kita tidak perlu menyelesaikan seluruh jaringan.` },
      { j: 'KCL di V_2', t: `Dari $V_2$ ada cabang $20\\,\\Omega$, $j5\\,\\Omega$, dan $12 + j16\\,\\Omega$. Tulis KCL di $V_2$, lalu selesaikan:\n$$\\mathbf{V}_2 = ${Rc(o.V2.z)}\\ \\text{V}$$` },
      { j: 'Arus lewat Z dari KCL di V_1', t: `Arus yang masuk ke $V_1$ lewat $Z$ adalah $$\\mathbf{I}_Z = ${Rc(o.Iz.z)}\\ \\text{A}$$` },
      { j: 'Hitung impedansi', t: `$$Z = \\dfrac{\\mathbf{V}_L - \\mathbf{V}_1}{\\mathbf{I}_Z} = \\dfrac{-40 - j80}{${Rc(o.Iz.z)}} = ${Rc(o.Z.z)}\\ \\Omega = ${P(o.Z.z)}\\ \\Omega$$` },
    ];
  },
  pelajaran: [
    'Jika satu tegangan simpul diberikan, kamu bisa menyelesaikan bagian jaringan tanpa menyusun semua persamaan.',
    'Impedansi tak diketahui dihitung dari $V/I$. Arusnya didapat dari KCL di simpul yang terhubung.',
  ],
  jebakan: [
    'Arah $\\mathbf{I}_Z$ harus konsisten dengan arah $\\mathbf{V}_Z = \\mathbf{V}_L - \\mathbf{V}_1$. Kalau dibalik, tanda $Z$ ikut terbalik.',
  ],
};

/* ---------- Soal 6: P9.44 ---------- */
const P6 = {
  id: 'P9.44', judul: 'Transformasi sumber berantai menuju ekuivalen Norton',
  tipe: 'Norton (transformasi sumber)', omega: null, ground: 'g',
  ringkas: 'Cari ekuivalen Norton di terminal a dan b. Gunakan transformasi sumber, bukan Vth/Isc sebagai jawaban utama.',
  pos: { p: [60, 80], X: [240, 80], a: [400, 80], g: [60, 320], bt: [400, 320] },
  elements(vOn) {
    return [
      { id: 'Vs', kind: 'V', a: 'p', b: 'g', E: vOn ? PH(180, 90) : C.c(0, 0), label: '180∠90° V' },
      { id: 'J30', kind: 'Z', a: 'p', b: 'X', z: JX(30), label: 'j30 Ω' },
      { id: 'R15', kind: 'Z', a: 'X', b: 'g', z: R(15), path: [[240, 320]], label: '15 Ω' },
      { id: 'Cm30', kind: 'Z', a: 'X', b: 'a', z: JX(-30), label: '−j30 Ω' },
      { id: 'Wb', kind: 'V', a: 'bt', b: 'g', E: C.c(0, 0), wire: true },
    ];
  },
  analyze() {
    // Isc: hubung singkat a–bt, arus yang masuk ke a dari Cm30
    const sc = this.elements(true).concat([{ id: 'Ssh', kind: 'V', a: 'a', b: 'bt', E: C.c(0, 0), wire: true }]);
    const s1 = run(sc, this.ground);
    const Isc = s1.cur('Cm30');
    // Zn: sumber tegangan dimatikan, arus uji 1 A dimasukkan ke a
    const zt = this.elements(false).concat([{ id: 'IT', kind: 'I', a: 'g', b: 'a', J: C.c(1, 0) }]);
    const s2 = run(zt, this.ground);
    const Zn = C.sub(s2.v('a'), s2.v('bt'));
    return [
      out('IN', 'I_N', Isc, 'phasor', 'A', null),
      out('ZN', 'Z_N', Zn, 'imp', 'Ω', null),
    ];
  },
  expect: { IN: PH(3, 90), ZN: C.c(12, -24) },
  display() { return [{ omega: null, elements: this.elements(true) }]; },
  steps(o) {
    const yPar = C.add(R(12), JX(6));
    return [
      { j: 'Transformasi sumber pertama', t: `Sumber $180\\angle 90^\\circ$ V seri dengan $j30\\,\\Omega$ diubah menjadi sumber arus:$$\\dfrac{180\\angle 90^\\circ}{j30} = 6\\angle 0^\\circ\\ \\text{A}\\quad\\text{paralel dengan}\\quad j30\\,\\Omega$$` },
      { j: 'Gabungkan impedansi paralel', t: `Setelah transformasi, $j30\\,\\Omega$ paralel $15\\,\\Omega$:\n$$\\dfrac{(j30)(15)}{15 + j30} = ${Rc(yPar)}\\ \\Omega$$` },
      { j: 'Arus Norton', t: `Dengan $a$–$b$ dihubung singkat, arus yang mengalir melewatinya adalah $$\\mathbf{I}_N = ${P(o.IN.z)}\\ \\text{A}$$` },
      { j: 'Impedansi Norton', t: `Sumber tegangan dimatikan, lalu ukur impedansi di $a$–$b$:$$Z_N = ${Rc(o.ZN.z)}\\ \\Omega$$` },
      { j: 'Tulis ekuivalen', t: `Ekuivalen Norton: $\\mathbf{I}_N = ${P(o.IN.z)}$ A paralel $Z_N = ${Rc(o.ZN.z)}\\ \\Omega$.` },
    ];
  },
  pelajaran: [
    'Transformasi sumber berjalan satu arah: sumber tegangan seri impedansi ↔ sumber arus paralel impedansi.',
    'Impedansi yang seri dengan terminal harus digabung lebih dulu sebelum transformasi dilanjutkan.',
  ],
  jebakan: [
    'Jangan memparalelkan $-j30\\,\\Omega$ dengan cabang lain sebelum mentransformasi sumber yang di dekatnya.',
    'Bentuk Norton memuat $I_N$ dan $Z_N$. Cek juga dengan Thévenin untuk kepastian.',
  ],
};

/* ---------- Soal 7: P9.49 ---------- */
const P7 = {
  id: 'P9.49', judul: 'Ekuivalen Thévenin dengan sumber tak-bebas',
  tipe: 'Thévenin dengan sumber tak-bebas', omega: null, ground: 'g',
  ringkas: 'Sumber tak-bebas $0{,}03\\,V_o$ ada di rangkaian, jadi tidak boleh dimatikan. Cari $V_{Th}$ dan $Z_{Th}$ di terminal $a$–$b$.',
  pos: { p: [60, 80], n1: [200, 80], X: [320, 80], ta: [440, 80], g: [60, 320] },
  elements() {
    return [
      { id: 'Vs', kind: 'V', a: 'p', b: 'g', E: C.c(250, 0), label: '250∠0° V' },
      { id: 'R20', kind: 'Z', a: 'p', b: 'n1', z: R(20), label: '20 Ω' },
      { id: 'J10', kind: 'Z', a: 'n1', b: 'X', z: JX(10), label: 'j10 Ω' },
      { id: 'R50', kind: 'Z', a: 'X', b: 'ta', z: R(50), label: '50 Ω' },
      { id: 'Cm100', kind: 'Z', a: 'ta', b: 'g', z: JX(-100), path: [[440, 320]], label: '−j100 Ω' },
      { id: 'Gd', kind: 'VCCS', a: 'g', b: 'X', c: 'ta', d: 'g', g: C.c(0.03, 0), path: [[320, 320]], label: '0,03·Vo' },
    ];
  },
  analyze() {
    const s = run(this.elements(), this.ground);
    const Vth = s.v('ta');
    const sc = this.elements().concat([{ id: 'Ssh', kind: 'V', a: 'ta', b: 'g', E: C.c(0, 0), wire: true }]);
    const s2 = run(sc, this.ground);
    const Isc = s2.cur('R50');
    const Zth = C.div(Vth, Isc);
    return [
      out('Vth', 'V_Th', Vth, 'phasor', 'V', null),
      out('Isc', 'I_sc', Isc, 'phasor', 'A', null),
      out('Zth', 'Z_Th', Zth, 'imp', 'Ω', null),
    ];
  },
  expect: { Vth: PH(500, -53.13), Isc: C.c(3.5, -0.5), Zth: C.c(100, -100) },
  display() { return [{ omega: null, elements: this.elements() }]; },
  steps(o) {
    return [
      { j: 'Jangan matikan sumber tak-bebas', t: `Sumber $0{,}03\\,V_o$ bergantung pada tegangan di terminal, jadi tetap dipertahankan. Hanya sumber bebas $250$ V yang boleh dimatikan saat mencari $Z$ secara langsung.` },
      { j: 'V_Th dengan terminal terbuka', t: `$$\\mathbf{V}_{Th} = \\mathbf{V}_a = ${P(o.Vth.z)}\\ \\text{V} = ${Rc(o.Vth.z)}\\ \\text{V}$$` },
      { j: 'I_sc dengan a–b dihubung singkat', t: `Dengan $a$ dan acuan terhubung singkat, tegangan terminal nol. Sumber tak-bebas ikut nol, sehingga$$\\mathbf{I}_{sc} = ${Rc(o.Isc.z)}\\ \\text{A}$$` },
      { j: 'Hitung Z_Th', t: `$$Z_{Th} = \\dfrac{\\mathbf{V}_{Th}}{\\mathbf{I}_{sc}} = ${Rc(o.Zth.z)}\\ \\Omega$$` },
      { j: 'Ekuivalen Thévenin', t: `Sumber tegangan $${Rc(o.Vth.z)}$ V seri $Z_{Th} = ${Rc(o.Zth.z)}\\ \\Omega$.` },
    ];
  },
  pelajaran: [
    'Dengan sumber tak-bebas, $Z_{Th}$ tidak selalu bisa langsung dihitung dengan mematikan sumber. Pakai $V_{Th}/I_{sc}$.',
    'Saat $a$–$b$ dihubung singkat, variabel kendali sering menjadi nol. Itu justru mempermudah.',
  ],
  jebakan: [
    'Mematikan sumber tak-bebas adalah kesalahan umum. Sumber itu hanya ikut mati jika variabel kendalinya juga nol.',
  ],
};

/* ---------- Soal 8: P9.52 ---------- */
const P8 = {
  id: 'P9.52', judul: 'Zab dengan sumber tak-bebas (metode sumber uji)',
  tipe: 'Impedansi dengan sumber tak-bebas', omega: 100000, ground: 'g',
  ringkas: 'Rangkaian bekerja pada $\\omega = 100$ krad/s dan memuat sumber CCVS $5\\,i_\\Delta$. Cari $Z_{ab}$ dengan sumber uji 1 A di terminal $a$–$b$.',
  pos: { ta: [60, 80], m: [200, 80], R: [360, 80], g: [360, 320] },
  elements() {
    return [
      { id: 'C400', kind: 'Z', a: 'ta', b: 'm', z: Cap(400e-9, 100000), label: '400 nF' },
      { id: 'H5', kind: 'CCVS', a: 'm', b: 'R', ctrl: 'R30', k: C.c(5, 0), label: '5·iΔ' },
      { id: 'L600', kind: 'Z', a: 'R', b: 'g', z: L(600e-6, 100000), label: '600 µH' },
      { id: 'R30', kind: 'Z', a: 'g', b: 'R', z: R(30), path: [[500, 320], [500, 80]], label: '30 Ω' },
      { id: 'IT', kind: 'I', a: 'g', b: 'ta', J: C.c(1, 0), path: [[60, 320]], label: 'I_uji = 1 A' },
    ];
  },
  analyze() {
    const s = run(this.elements(), this.ground);
    return [out('Zab', 'Z_ab', C.sub(s.v('ta'), s.v('g')), 'imp', 'Ω', 100000)];
  },
  expect: { Zab: C.c(20, -15) },
  display() { return [{ omega: this.omega, elements: this.elements() }]; },
  steps(o) {
    return [
      { j: 'Reaktansi pada ω = 10⁵ rad/s', t: `$$X_C = -\\dfrac{1}{10^5 \\cdot 400\\cdot 10^{-9}} = -25\\ \\Omega\\qquad X_L = 10^5 \\cdot 600\\cdot 10^{-6} = 60\\ \\Omega$$` },
      { j: 'Pakai sumber uji', t: `Ada sumber tak-bebas $5\\,i_\\Delta$ yang menghubungkan cabang lain, jadi seri–paralel tidak sah. Pasang sumber uji $1$ A di $a$–$b$.` },
      { j: 'Arus cabang 30 Ω', t: `$i_\\Delta$ berarah ke atas pada $30\\,\\Omega$, jadi $$i_\\Delta = \\dfrac{V_g - V_R}{30} = \\dfrac{-V_R}{30}$$` },
      { j: 'Persamaan simpul dan loop', t: `KCL di simpul $R$ dan KVL dari $a$ melewati $-j25$ dan $5\\,i_\\Delta$ memberi hubungan antara $V_{ta}$ dan $V_R$. Selesaikan keduanya.` },
      { j: 'Hasil Z_ab', t: `$$Z_{ab} = \\dfrac{\\mathbf{V}_{ta}}{1\\ \\text{A}} = ${Rc(o.Zab.z)}\\ \\Omega = ${P(o.Zab.z)}\\ \\Omega$$` },
    ];
  },
  pelajaran: [
    'Sumber tak-bebas membuat seri–paralel tidak sah. Ketika ada sumber semacam ini, pakai sumber uji.',
    'Arah sumber tak-bebas dan tandanya harus dibaca dari gambar, bukan ditebak.',
  ],
  jebakan: [
    'Mematikan sumber tak-bebas sama dengan membuang bagian yang harus dihitung. Jangan lakukan ini.',
    'Periksa satuan: $5\\,i_\\Delta$ bersatuan volt karena konstanta $5$ bersatuan Ω.',
  ],
};

/* ---------- Soal 9: P9.54 ---------- */
const P9 = {
  id: 'P9.54', judul: 'Node-voltage dua simpul, cari Vo',
  tipe: 'Node-voltage (dua simpul)', omega: null, ground: 'g',
  ringkas: 'Sumber 240 V menempel pada rel bawah. Gunakan dua persamaan simpul untuk mencari $V_o$.',
  pos: { p: [60, 80], V1: [260, 80], V2: [440, 80], g: [60, 320] },
  elements() {
    return [
      { id: 'Vs', kind: 'V', a: 'p', b: 'g', E: C.c(240, 0), label: '240∠0° V' },
      { id: 'J10a', kind: 'Z', a: 'p', b: 'V1', z: JX(10), label: 'j10 Ω' },
      { id: 'R50', kind: 'Z', a: 'V1', b: 'g', z: R(50), path: [[260, 320]], label: '50 Ω' },
      { id: 'J10b', kind: 'Z', a: 'V1', b: 'V2', z: JX(10), label: 'j10 Ω' },
      { id: 'R30', kind: 'Z', a: 'V2', b: 'g', z: R(30), path: [[440, 320]], label: '30 Ω' },
    ];
  },
  analyze() {
    const s = run(this.elements(), this.ground);
    return [
      out('Vo', 'V_o', s.v('V2'), 'phasor', 'V', null),
      out('V1', 'V_1', s.v('V1'), 'aux', 'V', null),
    ];
  },
  expect: { Vo: C.c(138.08, -128.22) },
  display() { return [{ omega: null, elements: this.elements() }]; },
  steps(o) {
    return [
      { j: 'Pilih acuan', t: `Rel bawah sebagai acuan. Sumber $240\\angle 0^\\circ$ V menempel langsung ke acuan, jadi simpul pertama sudah tetap.` },
      { j: 'KCL di simpul V_2', t: `$$\\dfrac{\\mathbf{V}_2 - \\mathbf{V}_1}{j10} + \\dfrac{\\mathbf{V}_2}{30} = 0$$` },
      { j: 'KCL di simpul V_1', t: `Di $V_1$ ada $j10\\,\\Omega$ dari sumber, $50\\,\\Omega$ ke acuan, dan $j10\\,\\Omega$ ke $V_2$:$$\\dfrac{\\mathbf{V}_1 - 240}{j10} + \\dfrac{\\mathbf{V}_1}{50} + \\dfrac{\\mathbf{V}_1 - \\mathbf{V}_2}{j10} = 0$$` },
      { j: 'Selesaikan dengan kalikan penyebut', t: `Kalikan dengan penyebut agar pecahan hilang. Dari persamaan kedua, $\\mathbf{V}_1 = ${Rc(o.V1.z)}$ V.` },
      { j: 'Hasil V_o', t: `$$\\mathbf{V}_o = \\mathbf{V}_2 = ${Rc(o.Vo.z)}\\ \\text{V} = ${P(o.Vo.z)}\\ \\text{V}$$` },
    ];
  },
  pelajaran: [
    'Kalikan persamaan dengan penyebutnya sebelum menyederhanakan. Ini menghindari desimal berulang.',
    'Simpul yang menempel pada sumber tegangan sudah tetap, jadi tidak perlu persamaan untuknya.',
  ],
  jebakan: [
    'Jangan mengubah $\\frac{1}{30}$ menjadi desimal $0{,}0333$. Simpan sebagai pecahan agar hasilnya tetap eksak.',
  ],
};

/* ---------- Soal 10: P9.55 ---------- */
const P10 = {
  id: 'P9.55', judul: 'Node-voltage dengan sumber arus dan sumber tegangan, cari Vg',
  tipe: 'Node-voltage (sumber campuran)', omega: null, ground: 'g',
  ringkas: 'Sumber arus 5 A dan sumber tegangan 20∠90° V dalam satu jaringan. Cari $\\mathbf{V}_g$, yaitu selisih tegangan simpul $A$ dan $C$.',
  pos: { g: [340, 320], A: [200, 120], B: [340, 200], C: [460, 120] },
  elements() {
    return [
      { id: 'Is', kind: 'I', a: 'g', b: 'A', J: C.c(5, 0), path: [[200, 320]], label: '5∠0° A' },
      { id: 'Zm4', kind: 'Z', a: 'A', b: 'C', z: JX(-4), label: '−j4 Ω' },
      { id: 'Zm8', kind: 'Z', a: 'A', b: 'B', z: JX(-8), path: [[200, 200]], label: '−j8 Ω' },
      { id: 'Zj4', kind: 'Z', a: 'B', b: 'g', z: JX(4), label: 'j4 Ω' },
      { id: 'R12', kind: 'Z', a: 'B', b: 'C', z: R(12), path: [[460, 200]], label: '12 Ω' },
      { id: 'Vs', kind: 'V', a: 'C', b: 'g', E: C.c(0, 20), path: [[460, 320]], label: '20∠90° V' },
    ];
  },
  analyze() {
    const s = run(this.elements(), this.ground);
    return [
      out('Vg', 'V_g', C.sub(s.v('A'), s.v('C')), 'phasor', 'V', null),
      out('VA', 'V_A', s.v('A'), 'aux', 'V', null),
      out('VB', 'V_B', s.v('B'), 'aux', 'V', null),
    ];
  },
  expect: { Vg: C.c(-2.67, -18.67) },
  display() { return [{ omega: null, elements: this.elements() }]; },
  steps(o) {
    return [
      { j: 'Tandai tegangan tetap', t: `Sumber $20\\angle 90^\\circ$ V menempel di $C$ dan acuan, jadi $\\mathbf{V}_C = j20$ V sudah diketahui. Simpul $C$ tidak perlu persamaan.` },
      { j: 'KCL di simpul A', t: `$$\\dfrac{\\mathbf{V}_A - \\mathbf{V}_B}{-j8} + \\dfrac{\\mathbf{V}_A - \\mathbf{V}_C}{-j4} = 5$$` },
      { j: 'KCL di simpul B', t: `$$\\dfrac{\\mathbf{V}_B - \\mathbf{V}_A}{-j8} + \\dfrac{\\mathbf{V}_B}{j4} + \\dfrac{\\mathbf{V}_B - \\mathbf{V}_C}{12} = 0$$` },
      { j: 'Selesaikan dua persamaan', t: `Hasilnya $\\mathbf{V}_A = ${Rc(o.VA.z)}$ V dan $\\mathbf{V}_B = ${Rc(o.VB.z)}$ V.` },
      { j: 'Hitung V_g', t: `$$\\mathbf{V}_g = \\mathbf{V}_A - \\mathbf{V}_C = ${Rc(o.Vg.z)}\\ \\text{V} = ${P(o.Vg.z)}\\ \\text{V}$$` },
    ];
  },
  pelajaran: [
    'Sumber tegangan yang menempel ke acuan membuat satu simpul langsung tetap. Tandai itu lebih dulu.',
    'Kalikan dengan impedansi terkecil agar koefisien tetap bulat.',
  ],
  jebakan: [
    'Kalkulator $\\tan^{-1}$ hanya memberi sudut kuadran I dan IV. Periksa tanda bagian nyata dan khayal.',
  ],
};

/* ---------- Soal 11: P9.59 ---------- */
const P11 = {
  id: 'P9.59', judul: 'Node-voltage dua sumber tak-bebas, cari Vo dan Io',
  tipe: 'Dua blok dengan sumber tak-bebas', omega: null, ground: 'g',
  ringkas: 'Dua blok dihubungkan lewat sumber tak-bebas $V_o/10$ dan $20\\,I_o$. Cari $V_o$ dan $I_o$.',
  pos: { g: [60, 340], L: [240, 120], M: [360, 120], Vo: [560, 120] },
  elements() {
    return [
      { id: 'Is', kind: 'I', a: 'g', b: 'L', J: C.c(0.006, 0.013), path: [[60, 120]], label: '6 + j13 mA' },
      { id: 'R50L', kind: 'Z', a: 'L', b: 'g', z: R(50), path: [[240, 340]], label: '50 Ω' },
      { id: 'J25', kind: 'Z', a: 'L', b: 'M', z: JX(25), label: 'Io' },
      { id: 'Ev', kind: 'VCVS', a: 'M', b: 'g', c: 'Vo', d: 'g', k: C.c(0.1, 0), path: [[360, 340]], label: 'Vo/10' },
      { id: 'R50R', kind: 'Z', a: 'Vo', b: 'g', z: R(50), path: [[520, 120], [520, 340]], label: '50 Ω' },
      { id: 'C25R', kind: 'Z', a: 'Vo', b: 'g', z: JX(-25), path: [[600, 120], [600, 340]], label: '−j25 Ω' },
      { id: 'Fi', kind: 'CCCS', a: 'Vo', b: 'g', ctrl: 'J25', k: C.c(20, 0), path: [[560, 340]], label: '20·Io' },
    ];
  },
  analyze() {
    const s = run(this.elements(), this.ground);
    return [
      out('Vo', 'V_o', s.v('Vo'), 'phasor', 'V', null),
      out('Io', 'I_o', s.cur('J25'), 'phasor', 'A', null),
    ];
  },
  expect: { Vo: C.c(-2, 4), Io: C.c(0.01, 0) },
  display() { return [{ omega: null, elements: this.elements() }]; },
  steps(o) {
    return [
      { j: 'Samakan satuan dulu', t: `Sumber arus diberi dalam mA, resistor dalam Ω. Ubah semua ke A dan Ω sejak awal: $6 + j13$ mA $= 0{,}006 + j0{,}013$ A.` },
      { j: 'Pilih acuan', t: `Rel bawah sebagai acuan. Sumber $20\\,I_o$ berpangkal di $V_o$, jadi tulis KCL di $V_o$.` },
      { j: 'KCL di simpul V_o', t: `$$20\\,\\mathbf{I}_o + \\dfrac{\\mathbf{V}_o}{50} + \\dfrac{\\mathbf{V}_o}{-j25} = 0$$` },
      { j: 'Blok kiri dengan V_o/10 sebagai tegangan tetap', t: `Simpul $M$ menempel sumber $\\mathbf{V}_o/10$ ke acuan, jadi $\\mathbf{V}_M = \\mathbf{V}_o/10$. Simpul $L$ memakai KCL dengan sumber arus $6 + j13$ mA.` },
      { j: 'Selesaikan dan cek', t: `Hasil: $$\\mathbf{V}_o = ${Rc(o.Vo.z)}\\ \\text{V} = ${P(o.Vo.z)}\\ \\text{V}\\qquad \\mathbf{I}_o = ${Rc(mA(o.Io.z))}\\ \\text{mA} = 10\\angle 0^\\circ\\ \\text{mA}$$` },
    ];
  },
  pelajaran: [
    'Dua blok yang hanya berbagi acuan tetap saling terkait lewat sumber tak-bebas. Kerjakan blok dengan variabel paling sedikit dulu.',
    'Satuan di semua bagian harus sama. Satu mA yang dicampur Ω memberi hasil meleset faktor 1000.',
  ],
  jebakan: [
    'Sumber tak-bebas $20\\,I_o$ memakai arus dari elemen tertentu. Pastikan arah dan elemennya sama dengan gambar.',
  ],
};

/* ---------- Soal 12: P9.64 ---------- */
const P12 = {
  id: 'P9.64', judul: 'Mesh-current dengan sumber tak-bebas, cari vo(t)',
  tipe: 'Sumber tegangan tak-bebas (CCVS)', omega: 5000, ground: 'g',
  ringkas: 'Sumber $v_g = 75\\cos(5000t)$ V dan sumber $100\\,i_\\Delta$. Cari $v_o(t)$ keadaan tunak.',
  pos: { p: [60, 80], TN: [240, 80], D: [240, 220], TR: [400, 80], g: [60, 320] },
  elements(w) {
    return [
      { id: 'Vg', kind: 'V', a: 'p', b: 'g', E: C.c(75, 0), label: 'vg = 75 cos 5000t' },
      { id: 'C4', kind: 'Z', a: 'p', b: 'TN', z: Cap(4e-6, w), label: '4 µF' },
      { id: 'L110', kind: 'Z', a: 'TN', b: 'D', z: L(0.11, w), label: '110 mH' },
      { id: 'H100', kind: 'CCVS', a: 'g', b: 'D', ctrl: 'C4', k: C.c(100, 0), path: [[240, 320]], label: '100·iΔ' },
      { id: 'L4', kind: 'Z', a: 'TN', b: 'TR', z: L(4e-3, w), label: '4 mH' },
      { id: 'R10', kind: 'Z', a: 'TR', b: 'g', z: R(10), path: [[400, 320]], label: '10 Ω' },
    ];
  },
  analyze() {
    const w = this.omega;
    const s = run(this.elements(w), this.ground);
    return [
      out('vo', 'v_o', s.v('TR'), 'phasor', 'V', w),
      out('VTN', 'V_TN', s.v('TN'), 'aux', 'V', w),
    ];
  },
  expect: { vo: PH(25, 90) },
  display() { return [{ omega: this.omega, elements: this.elements(this.omega) }]; },
  steps(o) {
    return [
      { j: 'Reaktansi pada ω = 5000 rad/s', t: `$$X_C = -\\dfrac{1}{5000 \\cdot 4\\cdot 10^{-6}} = -50\\ \\Omega\\qquad X_{L_1} = j550\\ \\Omega\\qquad X_{L_2} = j20\\ \\Omega$$` },
      { j: 'Arah i_Δ dan sumber tak-bebas', t: `$i_\\Delta$ mengalir dari sumber ke kanan melewati kapasitor. Tanda sumber $100\\,i_\\Delta$ dibaca dari gambar, lalu dipakai di KVL.` },
      { j: 'KCL di simpul kanan', t: `Di $V_{TR}$ ada $j20\\,\\Omega$ dari $V_{TN}$ dan $10\\,\\Omega$ ke acuan:$$\\dfrac{\\mathbf{V}_{TR} - \\mathbf{V}_{TN}}{j20} + \\dfrac{\\mathbf{V}_{TR}}{10} = 0\\quad\\Rightarrow\\quad \\mathbf{V}_{TN} = (1 + j2)\\,\\mathbf{V}_{TR}$$` },
      { j: 'Hasil fasor v_o', t: `$$\\mathbf{V}_o = \\mathbf{V}_{TR} = ${P(o.vo.z)}\\ \\text{V}$$` },
      { j: 'Bentuk waktu', t: `$$v_o(t) = ${Tm(o.vo.z, 5000)}\\ \\text{V}$$` },
    ];
  },
  pelajaran: [
    'Sumber tak-bebas berbentuk tegangan lebih mudah dipakai di loop atau simpul langsung, bukan dianggap sumber bebas.',
    'Tanda polaritas sumber tak-bebas menentukan tanda jawaban. Baca dari gambar, jangan dari kunci saja.',
  ],
  jebakan: [
    'Perbedaan tanda pada kunci bisa berasal dari polaritas sumber tak-bebas. Periksa gambar, lalu cek apakah hasilnya konsisten dengan KVL.',
  ],
};

/* ---------- Soal 13: P9.65 ---------- */
const P13 = {
  id: 'P9.65', judul: 'Pembagi tegangan di domain frekuensi, cari vo(t)',
  tipe: 'Pembagi tegangan (seri)', omega: 100000, ground: 'g',
  ringkas: 'Satu loop berisi R, C, L, dan R. Tegangan $v_o$ diambil antara kapasitor dan induktor. Cari $v_o(t)$ keadaan tunak.',
  pos: { p: [60, 80], n1: [200, 80], Vo: [360, 80], n2: [500, 80], g: [60, 320] },
  elements(w) {
    return [
      { id: 'Vg', kind: 'V', a: 'p', b: 'g', E: C.c(120, 0), label: 'vg = 120 cos 10⁵t' },
      { id: 'R1k2', kind: 'Z', a: 'p', b: 'n1', z: R(1200), label: '1,2 kΩ' },
      { id: 'C3n', kind: 'Z', a: 'n1', b: 'Vo', z: Cap(3.125e-9, w), label: '3,125 nF' },
      { id: 'L80m', kind: 'Z', a: 'Vo', b: 'n2', z: L(0.08, w), label: '80 mH' },
      { id: 'R2k4', kind: 'Z', a: 'n2', b: 'g', z: R(2400), path: [[500, 320]], label: '2,4 kΩ' },
    ];
  },
  analyze() {
    const w = this.omega;
    const s = run(this.elements(w), this.ground);
    return [out('vo', 'v_o', s.v('Vo'), 'phasor', 'V', w)];
  },
  expect: { vo: PH(167.04, 20.17) },
  display() { return [{ omega: this.omega, elements: this.elements(this.omega) }]; },
  steps(o) {
    const z1 = C.c(1200, -3200);
    const z2 = C.c(2400, 8000);
    return [
      { j: 'Reaktansi pada ω = 10⁵ rad/s', t: `$$X_C = -\\dfrac{1}{10^5 \\cdot 3{,}125\\cdot 10^{-9}} = -3200\\ \\Omega\\qquad X_L = 10^5 \\cdot 80\\cdot 10^{-3} = 8000\\ \\Omega$$` },
      { j: 'Satu loop, jadi pembagi tegangan', t: `Semua elemen dalam satu loop dan arusnya sama. $\\mathbf{V}_o$ diukur di antara kapasitor dan induktor, jadi $\\mathbf{V}_o = \\mathbf{V}_g \\cdot \\dfrac{Z_2}{Z_1 + Z_2}$.` },
      { j: 'Kelompokkan jadi dua blok', t: `$$Z_1 = 1200 - j3200\\ \\Omega\\qquad Z_2 = 2400 + j8000\\ \\Omega$$` },
      { j: 'Hitung dalam polar', t: `$$\\mathbf{V}_o = 120\\angle 0^\\circ \\cdot \\dfrac{${Rc(z2)}}{${Rc(C.add(z1, z2))}} = 120 \\cdot \\dfrac{${P(z2)}}{${P(C.add(z1, z2))}}$$\nBesar dibagi besar, sudut dikurangi sudut: $\\mathbf{V}_o = ${P(o.vo.z)}$ V.` },
      { j: 'Bentuk waktu', t: `$$v_o(t) = ${Tm(o.vo.z, 100000)}\\ \\text{V}$$` },
    ];
  },
  pelajaran: [
    'Pembagi tegangan hanya berlaku untuk dua blok seri. Jika ada cabang paralel di antaranya, gunakan analisis simpul.',
    'Dalam polar, pembagian berarti besar dibagi besar dan sudut dikurangi sudut.',
  ],
  jebakan: [
    'Tanda kapasitor sudah negatif. Menulis $Z_C = +j3200$ memberi total dan sudut yang salah.',
  ],
};

/* ---------- Soal 14: P9.67 ---------- */
const P14 = {
  id: 'P9.67', judul: 'Dua sumber dengan frekuensi berbeda, superposisi',
  tipe: 'Superposisi (dua frekuensi)', omega: null, labelOmega: 'ω = 2000 dan 5000 rad/s', ground: 'g',
  ringkas: 'Dua sumber berfrekuensi berbeda, yaitu $2000$ rad/s dan $5000$ rad/s. Tentukan teknik yang tepat, lalu cari $v_o(t)$.',
  pos: { p1: [60, 80], N: [240, 80], p2: [460, 80], g: [60, 320] },
  elements(w, v1, v2) {
    return [
      { id: 'V1', kind: 'V', a: 'p1', b: 'g', E: v1, label: 'v1' },
      { id: 'L1m', kind: 'Z', a: 'p1', b: 'N', z: L(1e-3, w), label: '1 mH' },
      { id: 'R10', kind: 'Z', a: 'N', b: 'g', z: R(10), path: [[240, 320]], label: '10 Ω' },
      { id: 'C100u', kind: 'Z', a: 'N', b: 'p2', z: Cap(100e-6, w), label: '100 µF' },
      { id: 'V2', kind: 'V', a: 'p2', b: 'g', E: v2, path: [[460, 320]], label: 'v2' },
    ];
  },
  cases() {
    return [
      { w: 2000, v1: PH(20, -36.87), v2: C.c(0, 0) },
      { w: 5000, v1: C.c(0, 0), v2: PH(10, 16.26) },
    ];
  },
  analyze() {
    const cs = this.cases();
    const s1 = run(this.elements(cs[0].w, cs[0].v1, cs[0].v2), this.ground);
    const s2 = run(this.elements(cs[1].w, cs[1].v1, cs[1].v2), this.ground);
    return [
      out('Vo1', 'V_o1 (ω = 2000)', s1.v('N'), 'phasor', 'V', 2000),
      out('Vo2', 'V_o2 (ω = 5000)', s2.v('N'), 'phasor', 'V', 5000),
    ];
  },
  expect: { Vo1: C.c(18, -26), Vo2: C.c(13, 9) },
  display() {
    const cs = this.cases();
    return cs.map((c) => ({ omega: c.w, elements: this.elements(c.w, c.v1, c.v2) }));
  },
  steps(o) {
    return [
      { j: 'Pilih teknik', t: `Koefisien $t$ berbeda, yaitu $2000$ dan $5000$, jadi $\\omega$ berbeda. Satu rangkaian fasor tidak bisa memuat keduanya. Pakai superposisi.` },
      { j: 'Kasus 1: hanya v_1 aktif, ω = 2000 rad/s', t: `Hubung singkat $v_2$. $L = j2\\,\\Omega$, $C = -j5\\,\\Omega$. Tegangan di $N$:$$\\mathbf{V}_{o1} = ${Rc(o.Vo1.z)}\\ \\text{V} = ${P(o.Vo1.z)}\\ \\text{V}$$` },
      { j: 'Kasus 2: hanya v_2 aktif, ω = 5000 rad/s', t: `Hubung singkat $v_1$. $L = j5\\,\\Omega$, $C = -j2\\,\\Omega$. Tegangan di $N$:$$\\mathbf{V}_{o2} = ${Rc(o.Vo2.z)}\\ \\text{V} = ${P(o.Vo2.z)}\\ \\text{V}$$` },
      { j: 'Jumlahkan di domain waktu', t: `Dua suku tidak bisa dijumlahkan sebagai fasor karena frekuensinya berbeda. Tulis dalam bentuk waktu lalu jumlahkan:$$v_o(t) = ${Tm(o.Vo1.z, 2000)}\\ \\text{V} + ${Tm(o.Vo2.z, 5000)}\\ \\text{V}$$` },
    ];
  },
  pelajaran: [
    'Jika frekuensinya berbeda, $X_L$ dan $X_C$ berbeda untuk tiap sumber. Satu rangkaian fasor tidak cukup.',
    'Hasil superposisi bukan sinusoid tunggal, tetapi jumlah dua sinusoid dengan frekuensi berbeda.',
  ],
  jebakan: [
    'Jangan menjumlahkan fasor dari dua frekuensi. Hasilnya tidak mewakili kenyataan.',
    'Saat menghubung singkat sumber tegangan, impedansinya tetap ada. Yang dimatikan hanya tegangannya.',
  ],
};

const PROBLEMS = [P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13, P14];

if (typeof module !== 'undefined') module.exports = PROBLEMS;
