/*
 * Data 14 soal Bab 9 (analisis fasor). Setiap soal berisi:
 *  - pos      : koordinat simpul untuk gambar (viewBox 600 x 400)
 *  - analyze(): hitung hasil dengan Solver, mengembalikan daftar `outs`
 *  - expect   : nilai kunci dari buku soal, dipakai untuk verifikasi
 *  - display(): kasus-kasus rangkaian untuk animasi (satu atau lebih frekuensi)
 *  - steps(o) : langkah pengerjaan, angka diisi dari hasil solver
 * Semua langkah dan penjelasan ditulis ulang dengan kata-kata sendiri.
 */
const S = Solver;
const { C, L, Cap, run, fmt } = S;
const R = (x) => C.c(x, 0);       // resistansi real
const JX = (x) => C.c(0, x);      // reaktansi j·x
const PH = (r, d) => C.polar(r, d);

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
    return [
      { j: 'Tandai simpul dan cari yang seri', t: 'Kawat dari a sampai simpul atas tidak bercabang, jadi 5 Ω dan j8 Ω langsung seri. Impedansi seri hanya menjumlahkan nilainya.' },
      { j: 'Sederhanakan cabang kanan', t: 'Di kanan atas ada 10 Ω dan −j20 Ω yang diparalelkan. Hasilnya ' + fmt.rect(PH(0, 0).re === 0 ? C.div(C.mul(C.c(10), C.c(0, -20)), C.c(10, -20)) : null) + ' Ω.' },
      { j: 'Sederhanakan cabang kanan bawah', t: 'Cabang (8 + j16) paralel dengan (40 − j80). Kawat di tengah menyatukan kedua cabang ini, jadi keduanya paralel terhadap terminal b.' },
      { j: 'Jumlahkan semua bagian seri', t: 'Zab = (5 + j8) + (8 − j4) + (12 + j16) = ' + fmt.rect(o.Zab.z) + ' Ω.' },
      { j: 'Ubah ke bentuk polar', t: 'Besar |Zab| = ' + fmt.polar(o.Zab.z).split(' ∠ ')[0] + ' Ω dan sudut θ = ' + fmt.polar(o.Zab.z).split(' ∠ ')[1] + '. Karena bagian nyata dan khayalnya positif, sudut ada di kuadran I.' },
    ];
  },
  pelajaran: [
    'Gabungkan dulu cabang yang paling jauh dari terminal, lalu mundur ke a dan b.',
    'Kawat tanpa komponen berarti dua simpul sama. Tandai itu sebelum menghitung.',
    'Soal yang hanya berisi R, L, C tanpa sumber cukup dikerjakan dengan reduksi seri–paralel.',
  ],
  jebakan: [
    'Tanda kapasitor selalu negatif pada bagian khayal: Z_C = 1/(jωC) = −j/(ωC).',
    'Jangan menggabungkan cabang yang tidak seri atau paralel secara murni. Periksa dulu kawat yang menyatukan simpul.',
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
    const z = C.c(3000, 1000 - 5000);
    return [
      { j: 'Tentukan frekuensi sudut', t: 'Dari sumber, ω = 2000 rad/s. Semua elemen dihitung pada frekuensi ini.' },
      { j: 'Hitung reaktansi', t: 'X_L = ωL = 2000 × 0,5 = 1000 Ω. X_C = −1/(ωC) = −1/(2000 × 100×10⁻⁹) = −5000 Ω.' },
      { j: 'Jumlahkan impedansi seri', t: 'Karena satu loop, semua elemen seri: Z = 3000 + j1000 − j5000 = ' + fmt.rect(z) + ' Ω.' },
      { j: 'Hitung arus dengan Hukum Ohm fasor', t: 'I = V/Z = 80∠0° / (' + fmt.polar(z) + ') = ' + fmt.polar(o.io.z) + ' A.' },
      { j: 'Kembalikan ke bentuk waktu', t: 'Dengan konvensi kosinus: ' + fmt.time(C.scale(1000, o.io.z), 2000, 2, 'i_o(t) = ') + ' mA.' },
    ];
  },
  pelajaran: [
    'Pada loop tunggal, cukup satu pembagian V/Z. Tidak perlu persamaan simpul atau loop tambahan.',
    'Bentuk jawaban mengikuti konvensi sumber. Jika sumber berbentuk sinus, geser sudut −90° sebelum mengubah ke fasor.',
  ],
  jebakan: [
    'Kapasitor menghasilkan bagian khayal negatif. Menulis Z_C = +j5000 membalik tanda sudut jawaban.',
    'Jawaban bentuk waktu harus fungsi waktu, bukan fasor saja.',
  ],
};

/* ---------- Soal 3: P9.30 ---------- */
const P3 = {
  id: 'P9.30', judul: 'Rangkaian R–L–C campuran, cari io(t) untuk sumber sinus',
  tipe: 'Seri–paralel, sumber sinus', omega: 4000, ground: 'g',
  ringkas: 'Sumber 25 sin(4000t) V. Cari io(t), arus dari sumber yang melewati resistor 5 Ω paling atas.',
  pos: { p: [60, 80], A: [200, 80], B: [360, 80], g: [60, 320] },
  elements(w) {
    return [
      { id: 'Vs', kind: 'V', a: 'p', b: 'g', E: PH(25, -90), label: 'vs = 25 sin 4000t' },
      { id: 'R5', kind: 'Z', a: 'p', b: 'A', z: R(5), label: '5 Ω' },
      { id: 'L25m', kind: 'Z', a: 'A', b: 'g', z: L(2.5e-3, w), path: [[200, 320]], label: '2,5 mH' },
      { id: 'R10', kind: 'Z', a: 'A', b: 'B', z: R(10), label: '10 Ω' },
      { id: 'R20', kind: 'Z', a: 'B', b: 'g', z: R(20), path: [[360, 320]], label: '20 Ω' },
      { id: 'C125', kind: 'Z', a: 'B', b: 'g', z: Cap(12.5e-6, w), path: [[460, 80], [460, 320]], label: '12,5 µF' },
    ];
  },
  analyze() {
    const w = this.omega;
    const s = run(this.elements(w), this.ground);
    return [out('io', 'i_o', s.cur('R5'), 'phasor', 'A', w)];
  },
  expect: { io: PH(1.77, -135) },
  display() { return [{ omega: this.omega, elements: this.elements(this.omega) }]; },
  steps(o) {
    return [
      { j: 'Ubah sinus menjadi kosinus', t: 'sin θ = cos(θ − 90°), jadi vs = 25 cos(4000t − 90°). Fasor sumbernya 25∠−90° V. Jangan lupa langkah ini, karena sumber sinus sering menjebak.' },
      { j: 'Hitung reaktansi', t: 'X_L = 4000 × 2,5×10⁻³ = 10 Ω, jadi j10. X_C = −1/(4000 × 12,5×10⁻⁶) = −20 Ω, jadi −j20.' },
      { j: 'Reduksi dari kanan', t: 'Di kanan ada 20 Ω paralel −j20 Ω. Hasilnya 10 − j10 Ω. Tambahkan 10 Ω, lalu paralelkan dengan j10 Ω.' },
      { j: 'Impedansi total', t: 'Impedansi total dari sumber: Z_T = 5 + Z_paralel = 10 + j10 Ω = ' + fmt.polar(C.c(10, 10)) + ' Ω.' },
      { j: 'Arus sumber', t: 'I_o = V_s / Z_T = (25∠−90°) / (10 + j10) = ' + fmt.polar(o.io.z) + ' A.' },
      { j: 'Bentuk waktu', t: 'i_o(t) = ' + fmt.time(o.io.z, 4000, 2, '') + ' A.' },
    ];
  },
  pelajaran: [
    'Sumber sinus harus diubah ke kosinus lebih dulu. Ini aturan dasar, bukan trik tambahan.',
    'Reduksi dari cabang yang paling jauh. Di sini itu cabang kanan, dan 5 Ω langsung seri dengan sisanya.',
  ],
  jebakan: [
    'Jika kalkulator menunjukkan −135° dan kamu lupa geser fasor, hasil akhirnya salah 90°.',
    'Periksa kuadran setelah mengubah ke polar: tangen invers tidak tahu kuadran.',
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
    const dt = (C.deg(vo) * Math.PI) / 180 / w; // selisih waktu dari fase
    return [
      out('vo', 'v_o', vo, 'phasor', 'V', w),
      out('dt', 'Δt', C.c(dt * 1e6, 0), 'value', 'µs', w),
    ];
  },
  expect: { vo: PH(5.59, 26.57), dt: C.c(9.27, 0) },
  display() { return [{ omega: this.omega, elements: this.elements(this.omega) }]; },
  steps(o) {
    return [
      { j: 'Tentukan ω dan reaktansi', t: 'ω = 50000 rad/s. X_L = ωL = 50000 × 4×10⁻³ = 200 Ω (j200). X_C = −1/(50000 × 80×10⁻⁹) = −250 Ω (−j250).' },
      { j: 'Ubah sumber ke fasor', t: 'ig = 25 cos(50000t) mA berarti I_g = 25∠0° mA = 0,025∠0° A. Sumber arus ini tidak perlu diubah ke sumber tegangan.' },
      { j: 'Pasang sumber dan gunakan tegangan simpul', t: 'Simpul A dan B adalah dua simpul tak diketahui. Dari A keluar j200 ke tanah dan 100 Ω ke B. Dari B keluar −j250 Ω dan 500 Ω ke tanah.' },
      { j: 'Hitung vo', t: 'Hasil dari analisis simpul: V_o = ' + fmt.polar(o.vo.z) + ' V. Bentuk waktu: ' + fmt.time(o.vo.z, 50000, 2, 'v_o') + ' V.' },
      { j: 'Hitung selisih waktu', t: 'Sudut ' + C.deg(o.vo.z).toFixed(2) + '° diubah ke radian lalu dibagi ω. Hasilnya Δt ≈ ' + o.dt.z.re.toFixed(2) + ' µs. Dalam kasus ini vo mendahului ig.' },
    ];
  },
  pelajaran: [
    'Sudut fase dalam radian dibagi ω memberi selisih waktu. Jangan membagi sudut derajat langsung.',
    'Sumber arus dengan dua simpul tak diketahui cocok untuk analisis simpul.',
  ],
  jebakan: [
    'Membagi 26,57° dengan 50000 langsung memberi hasil salah satuan. Ubah ke radian dulu.',
    'Pembulatan sudut di tengah perhitungan bisa menggeser Δt. Simpan angka penuh sampai akhir.',
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
    return [out('Z', 'Z', Z, 'imp', 'Ω', null)];
  },
  expect: { Z: C.c(2, 2) },
  display() {
    const o = this.analyze()[0];
    return [{ omega: null, elements: this.elements(o.z) }];
  },
  steps(o) {
    return [
      { j: 'Pilih simpul acuan', t: 'Pilih rel bawah sebagai acuan. Sumber tegangan Vg menempel pada simpul kiri atas, jadi V_L sudah diketahui.' },
      { j: 'Tentukan V1 dari soal', t: 'V1 diberikan: 140 + j30 V. Dengan V1 diketahui, kita bisa mencari arus lain tanpa menyelesaikan seluruh jaringan.' },
      { j: 'Cari tegangan V2 lewat KCL', t: 'Dari simpul V2 ada cabang 20 Ω, j5 Ω, dan 12 Ω + j16 Ω. Tulis KCL di V2 untuk mendapat V2.' },
      { j: 'Hitung arus lewat Z', t: 'KCL di V1 memberi arus yang masuk ke V1 lewat Z, yaitu I_Z = ' + fmt.rect(o.Z.z) + ' A dengan arah dari simpul kiri ke V1 (kita hitung dari sisa cabang).' },
      { j: 'Hitung impedansi', t: 'Z = (V_L − V1) / I_Z. Hasilnya Z = ' + fmt.rect(o.Z.z) + ' Ω = ' + fmt.polar(o.Z.z) + ' Ω.' },
    ];
  },
  pelajaran: [
    'Jika satu tegangan simpul diberikan, kamu bisa menyelesaikan bagian jaringan tanpa menyusun semua persamaan.',
    'Impedansi tak diketahui dihitung dari V/I, dan arusnya didapat dari KCL di simpul yang terhubung.',
  ],
  jebakan: [
    'Arah I_Z harus konsisten dengan arah V_Z = V_L − V1. Kalau dibalik, Z juga ikut terbalik tanda.',
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
    return [
      { j: 'Ubah sumber tegangan menjadi sumber arus', t: 'Sumber 180∠90° V seri dengan j30 Ω diubah menjadi sumber arus 180∠90° / j30 = 6∠0° A paralel dengan j30 Ω. Arah sumber mengikuti tanda terminal.' },
      { j: 'Gabungkan dua impedansi paralel', t: 'Setelah transformasi, j30 Ω paralel dengan 15 Ω. Hasilnya 12 + j6 Ω. Lanjutkan transformasi sampai bentuk Norton tercapai.' },
      { j: 'Hitung Isc', t: 'Hubung singkat a–b. Arus yang mengalir melewati hubungan singkat ini adalah I_N = ' + fmt.polar(o.IN.z) + ' A.' },
      { j: 'Hitung impedansi Norton', t: 'Matikan sumber tegangan (jadi hubung singkat), lalu ukur impedansi di a–b. Z_N = ' + fmt.rect(o.ZN.z) + ' Ω.' },
      { j: 'Tulis hasil', t: 'Ekuivalen Norton: I_N = ' + fmt.polar(o.IN.z) + ' A paralel Z_N = ' + fmt.rect(o.ZN.z) + ' Ω.' },
    ];
  },
  pelajaran: [
    'Transformasi sumber berjalan satu arah: sumber tegangan seri impedansi ↔ sumber arus paralel impedansi.',
    'Impedansi yang seri dengan terminal harus digabung lebih dulu sebelum transformasi dilanjutkan.',
  ],
  jebakan: [
    'Jangan memparalelkan −j30 Ω dengan cabang lain sebelum mentransformasi sumber yang di dekatnya.',
    'Bentuk Norton memang berisi I_N dan Z_N. Cek juga dengan Thévenin untuk kepastian.',
  ],
};

/* ---------- Soal 7: P9.49 ---------- */
const P7 = {
  id: 'P9.49', judul: 'Ekuivalen Thévenin dengan sumber tak-bebas',
  tipe: 'Thévenin dengan sumber tak-bebas', omega: null, ground: 'g',
  ringkas: 'Sumber tak-bebas 0,03·Vo ada di rangkaian, jadi tidak boleh dimatikan. Cari VTh dan ZTh di terminal a–b.',
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
      { j: 'Jangan matikan sumber tak-bebas', t: 'Sumber 0,03·Vo bergantung pada tegangan di terminal, jadi tetap dipertahankan. Hanya sumber bebas 250 V yang boleh dimatikan saat mencari Z langsung.' },
      { j: 'Cari V_Th (terminal terbuka)', t: 'Dengan a–b terbuka, V_Th = V_a = ' + fmt.polar(o.Vth.z) + ' V = ' + fmt.rect(o.Vth.z) + ' V.' },
      { j: 'Cari I_sc (a–b dihubung singkat)', t: 'Dengan a dan g terhubung singkat, tegangan di terminal menjadi nol. Sumber tak-bebas ikut nol, sehingga I_sc = ' + fmt.rect(o.Isc.z) + ' A.' },
      { j: 'Hitung Z_Th', t: 'Z_Th = V_Th / I_sc = ' + fmt.rect(o.Zth.z) + ' Ω.' },
      { j: 'Gambar ekuivalen', t: 'Rangkaian Thévenin: sumber tegangan ' + fmt.rect(o.Vth.z) + ' V seri Z_Th = ' + fmt.rect(o.Zth.z) + ' Ω.' },
    ];
  },
  pelajaran: [
    'Dengan sumber tak-bebas, Z_Th tidak selalu bisa langsung dihitung dengan mematikan sumber. Pakai V_Th / I_sc.',
    'Saat a–b dihubung singkat, variabel kendali sering menjadi nol. Itu justru mempermudah.',
  ],
  jebakan: [
    'Mematikan sumber tak-bebas adalah kesalahan umum. Sumbernya hanya mati jika dikontrol oleh nilai yang juga nol.',
  ],
};

/* ---------- Soal 8: P9.52 ---------- */
const P8 = {
  id: 'P9.52', judul: 'Zab dengan sumber tak-bebas (metode sumber uji)',
  tipe: 'Impedansi dengan sumber tak-bebas', omega: 100000, ground: 'g',
  ringkas: 'Rangkaian bekerja pada ω = 100 krad/s dan memuat sumber CCVS 5·iΔ. Cari Zab dengan menaruh sumber uji 1 A di terminal a–b.',
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
      { j: 'Tentukan ω dan reaktansi', t: 'ω = 10⁵ rad/s. X_C = −1/(10⁵ × 400×10⁻⁹) = −25 Ω. X_L = 10⁵ × 600×10⁻⁶ = 60 Ω.' },
      { j: 'Ada sumber tak-bebas, jadi pakai sumber uji', t: 'Seri–paralel tidak sah di sini karena sumber 5·iΔ menghubungkan cabang lain. Pasang sumber uji 1 A di a–b.' },
      { j: 'Tulis arus cabang 30 Ω', t: 'iΔ berarah ke atas di 30 Ω. Karena itu iΔ = (V_g − V_R)/30. Hubungan ini dipakai di KCL dan KVL.' },
      { j: 'Tulis KCL dan KVL', t: 'KCL di simpul R memberi V_R dalam V_ta. KVL dari a melewati −j25 dan 5·iΔ memberi V_ta.' },
      { j: 'Hasil Zab', t: 'Z_ab = V_ta / 1 A = ' + fmt.rect(o.Zab.z) + ' Ω = ' + fmt.polar(o.Zab.z) + ' Ω.' },
    ];
  },
  pelajaran: [
    'Sumber tak-bebas memutuskan bahwa seri–paralel tidak sah. Ketika ada sumber semacam ini, pakai sumber uji.',
    'Arah sumber tak-bebas dan tanda tegangannya harus dibaca dari gambar, bukan ditebak.',
  ],
  jebakan: [
    'Mematikan sumber tak-bebas sama dengan membuang bagian yang harus dihitung. Jangan lakukan ini.',
    'Periksa satuan: 5·iΔ punya satuan volt karena konstanta 5 bersatuan Ω.',
  ],
};

/* ---------- Soal 9: P9.54 ---------- */
const P9 = {
  id: 'P9.54', judul: 'Node-voltage dua simpul, cari Vo',
  tipe: 'Node-voltage (dua simpul)', omega: null, ground: 'g',
  ringkas: 'Sumber 240 V menempel pada rel bawah. Gunakan dua persamaan simpul untuk mencari Vo.',
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
    return [out('Vo', 'V_o', s.v('V2'), 'phasor', 'V', null)];
  },
  expect: { Vo: C.c(138.08, -128.22) },
  display() { return [{ omega: null, elements: this.elements() }]; },
  steps(o) {
    return [
      { j: 'Pilih acuan', t: 'Rel bawah sebagai acuan. Sumber 240 V menempel langsung ke acuan, jadi simpul pertama sudah tetap.' },
      { j: 'Tulis KCL di simpul kedua', t: 'Di simpul V2 ada dua cabang: j10 Ω dari V1 dan 30 Ω ke acuan. Persamaannya (V2 − V1)/j10 + V2/30 = 0.' },
      { j: 'Tulis KCL di simpul pertama', t: 'Di simpul V1 ada j10 Ω dari sumber, 50 Ω ke acuan, dan j10 Ω ke V2. Kalikan dengan j10 agar koefisien bulat.' },
      { j: 'Selesaikan', t: 'Substitusi V2 dari persamaan pertama ke persamaan kedua, lalu kalikan dengan penyebut agar pecahan hilang.' },
      { j: 'Hasil Vo', t: 'Vo = ' + fmt.rect(o.Vo.z) + ' V = ' + fmt.polar(o.Vo.z) + ' V.' },
    ];
  },
  pelajaran: [
    'Kalikan persamaan dengan penyebutnya sebelum menyederhanakan. Ini menghindari desimal berulang.',
    'Simpul yang menempel pada sumber tegangan sudah tetap, jadi tidak perlu persamaan untuknya.',
  ],
  jebakan: [
    'Jangan menghitung 1/30 sebagai desimal 0,0333. Simpan sebagai pecahan supaya hasilnya tetap eksak.',
  ],
};

/* ---------- Soal 10: P9.55 ---------- */
const P10 = {
  id: 'P9.55', judul: 'Node-voltage dengan sumber arus dan sumber tegangan, cari Vg',
  tipe: 'Node-voltage (sumber campuran)', omega: null, ground: 'g',
  ringkas: 'Sumber arus 5 A dan sumber tegangan 20∠90° V dalam satu jaringan. Cari fasor Vg, yaitu selisih tegangan simpul A dan C.',
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
    return [out('Vg', 'V_g', C.sub(s.v('A'), s.v('C')), 'phasor', 'V', null)];
  },
  expect: { Vg: C.c(-2.67, -18.67) },
  display() { return [{ omega: null, elements: this.elements() }]; },
  steps(o) {
    return [
      { j: 'Pilih acuan dan tandai sumber tegangan tetap', t: 'Sumber 20∠90° V menempel di simpul C dan acuan, jadi V_C = j20 V sudah diketahui. Simpul C tidak perlu persamaan.' },
      { j: 'Tulis KCL di simpul A', t: 'Dari A: (V_A − V_B)/(−j8) + (V_A − V_C)/(−j4) = 5 A, dengan 5 A masuk ke simpul A.' },
      { j: 'Tulis KCL di simpul B', t: 'Dari B: (V_B − V_A)/(−j8) + V_B/j4 + (V_B − V_C)/12 = 0.' },
      { j: 'Selesaikan dua persamaan', t: 'Kalikan dengan penyebut yang sama agar koefisiennya bulat, lalu selesaikan V_A dan V_B.' },
      { j: 'Hitung Vg', t: 'Vg = V_A − V_C = ' + fmt.rect(o.Vg.z) + ' V = ' + fmt.polar(o.Vg.z) + ' V.' },
    ];
  },
  pelajaran: [
    'Sumber tegangan yang menempel ke acuan membuat satu simpul langsung tetap. Tandai itu lebih dulu.',
    'Pilih kalikan dengan impedansi terkecil agar koefisien tetap bulat.',
  ],
  jebakan: [
    'Kalkulator tan⁻¹ hanya memberi sudut di kuadran I dan IV. Periksa tanda bagian nyata dan khayal.',
  ],
};

/* ---------- Soal 11: P9.59 ---------- */
const P11 = {
  id: 'P9.59', judul: 'Node-voltage dua sumber tak-bebas, cari Vo dan Io',
  tipe: 'Dua blok dengan sumber tak-bebas', omega: null, ground: 'g',
  ringkas: 'Dua blok dihubungkan lewat sumber tak-bebas (Vo/10 dan 20·Io). Cari Vo dan Io.',
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
      { j: 'Samakan satuan dulu', t: 'Sumber arus diberi dalam mA, sedangkan resistor dalam Ω. Ubah semua ke A dan Ω sejak baris pertama: 6 + j13 mA = 0,006 + j0,013 A.' },
      { j: 'Pilih acuan', t: 'Rel bawah sebagai acuan. Sumber tak-bebas 20·Io berpangkal di Vo, jadi kita tulis KCL di Vo.' },
      { j: 'Tulis KCL di simpul Vo', t: 'Arus keluar dari Vo: 20·Io + Vo/50 + Vo/(−j25) = 0. Dengan Io diganti dari blok kiri, persamaan ini memuat Vo dan V_L.' },
      { j: 'Blok kiri dengan Vo/10 sebagai tegangan tetap', t: 'Simpul M menempel sumber Vo/10 ke acuan, jadi V_M = Vo/10. Simpul L memakai KCL dengan sumber arus 6 + j13 mA.' },
      { j: 'Selesaikan dan cek', t: 'Dari dua persamaan itu: Vo = ' + fmt.rect(o.Vo.z) + ' V = ' + fmt.polar(o.Vo.z) + ' V, dan Io = ' + fmt.rect(C.scale(1000, o.Io.z)) + ' mA = 10∠0° mA.' },
    ];
  },
  pelajaran: [
    'Dua blok yang hanya berbagi acuan tetap saling terkait lewat sumber tak-bebas. Kerjakan blok dengan variabel paling sedikit dulu.',
    'Satuan di semua bagian harus sama. Satu mA yang dicampur Ω memberi hasil meleset faktor 1000.',
  ],
  jebakan: [
    'Sumber tak-bebas 20·Io memakai arus dari elemen tertentu. Pastikan kamu memakai arah dan elemen yang sama dengan yang ada di gambar.',
  ],
};

/* ---------- Soal 12: P9.64 ---------- */
const P12 = {
  id: 'P9.64', judul: 'Mesh-current dengan sumber tak-bebas, cari vo(t)',
  tipe: 'Sumber tegangan tak-bebas (CCVS)', omega: 5000, ground: 'g',
  ringkas: 'Sumber vg = 75 cos(5000t) V dan sumber 100·iΔ. Cari vo(t) keadaan tunak.',
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
    return [out('vo', 'v_o', s.v('TR'), 'phasor', 'V', w)];
  },
  expect: { vo: PH(25, 90) },
  display() { return [{ omega: this.omega, elements: this.elements(this.omega) }]; },
  steps(o) {
    return [
      { j: 'Tentukan ω dan reaktansi', t: 'ω = 5000 rad/s. X_C = −1/(5000 × 4×10⁻⁶) = −50 Ω. X_L(110 mH) = j550 Ω, X_L(4 mH) = j20 Ω.' },
      { j: 'Tulis arah iΔ dan sumber tak-bebas', t: 'iΔ mengalir dari sumber ke kanan melewati kapasitor. Sumber 100·iΔ dibaca dengan tanda − di atas dan + di bawah, jadi KVL membacanya sebagai kenaikan 100·iΔ.' },
      { j: 'Tentukan dua loop atau tegangan simpul', t: 'Gunakan tegangan simpul di TN dan TR. Simpul TN terhubung ke kapasitor, induktor 110 mH, dan induktor 4 mH.' },
      { j: 'Hitung vo', t: 'vo ditentukan di TR, terhadap rel bawah. Hasil fasor: V_o = ' + fmt.polar(o.vo.z) + ' V.' },
      { j: 'Bentuk waktu', t: 'vo(t) = ' + fmt.time(o.vo.z, 5000, 2, '') + ' V. Cek tanda terhadap gambar sebelum menyalin jawaban.' },
    ];
  },
  pelajaran: [
    'Dengan sumber tak-bebas berbentuk tegangan, lebih mudah memakai sumber itu di loop atau simpul langsung, bukan menganggapnya sumber bebas.',
    'Tanda polaritas sumber tak-bebas sangat menentukan tanda jawaban. Baca dari gambar, jangan dari kunci saja.',
  ],
  jebakan: [
    'Perbedaan tanda pada jawaban kunci bisa berasal dari polaritas sumber tak-bebas. Periksa gambar, lalu cek apakah hasilnya konsisten dengan KVL.',
  ],
};

/* ---------- Soal 13: P9.65 ---------- */
const P13 = {
  id: 'P9.65', judul: 'Pembagi tegangan di domain frekuensi, cari vo(t)',
  tipe: 'Pembagi tegangan (seri)', omega: 100000, ground: 'g',
  ringkas: 'Satu loop berisi R, C, L, dan R. Tegangan vo diambil antara kapasitor dan induktor. Cari vo(t) keadaan tunak.',
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
    return [
      { j: 'Tentukan ω dan reaktansi', t: 'ω = 10⁵ rad/s. X_C = −1/(10⁵ × 3,125×10⁻⁹) = −3200 Ω. X_L = 10⁵ × 80×10⁻³ = 8000 Ω.' },
      { j: 'Satu loop, jadi ini pembagi tegangan', t: 'Semua elemen dalam satu loop, arusnya sama. Vo diukur di antara kapasitor dan induktor, jadi Vo = Vg × Z_bawah / Z_total.' },
      { j: 'Kelompokkan jadi dua blok', t: 'Z1 = 1200 − j3200 Ω (resistor dan kapasitor sebelum titik ukur). Z2 = 2400 + j8000 Ω (induktor dan resistor setelah titik ukur).' },
      { j: 'Hitung dalam bentuk polar', t: 'Vo = Vg × Z2 / (Z1 + Z2) = 120∠0° × (2400 + j8000) / (3600 + j4800). Lebih mudah dihitung sebagai besar dibagi besar, sudut dikurangi sudut.' },
      { j: 'Bentuk waktu', t: 'vo(t) = ' + fmt.time(o.vo.z, 100000, 2, '') + ' V.' },
    ];
  },
  pelajaran: [
    'Pembagi tegangan hanya berlaku untuk dua blok seri. Jika ada cabang paralel di antaranya, gunakan analisis simpul.',
    'Dalam polar, pembagian berarti besar dibagi besar, sudut dikurangi sudut.',
  ],
  jebakan: [
    'Tanda kapasitor sudah negatif. Menulis Z_C = +j3200 menghasilkan total yang berbeda dan jawaban yang salah.',
  ],
};

/* ---------- Soal 14: P9.67 ---------- */
const P14 = {
  id: 'P9.67', judul: 'Dua sumber dengan frekuensi berbeda, superposisi',
  tipe: 'Superposisi (dua frekuensi)', omega: null, labelOmega: 'ω = 2000 dan 5000 rad/s', ground: 'g',
  ringkas: 'Dua sumber berfrekuensi berbeda: 2000 rad/s dan 5000 rad/s. Tentukan teknik yang tepat, lalu cari vo(t).',
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
      { j: 'Pilih teknik', t: 'Koefisien t berbeda (2000 dan 5000), jadi ω berbeda. Satu rangkaian fasor tidak bisa memuat keduanya. Pakai superposisi.' },
      { j: 'Kasus 1: hanya v1 aktif, ω = 2000 rad/s', t: 'Hubung singkat v2. Reaktansi: L = j2, C = −j5. Tegangan di N: V_o1 = ' + fmt.rect(o.Vo1.z) + ' V = ' + fmt.polar(o.Vo1.z) + ' V.' },
      { j: 'Kasus 2: hanya v2 aktif, ω = 5000 rad/s', t: 'Hubung singkat v1. Reaktansi: L = j5, C = −j2. Tegangan di N: V_o2 = ' + fmt.rect(o.Vo2.z) + ' V = ' + fmt.polar(o.Vo2.z) + ' V.' },
      { j: 'Gabungkan di domain waktu', t: 'Dua suku tidak bisa dijumlahkan sebagai fasor karena frekuensinya berbeda. Tulis dalam bentuk waktu lalu jumlahkan: vo(t) = ' + fmt.time(o.Vo1.z, 2000, 2, '') + ' + ' + fmt.time(o.Vo2.z, 5000, 2, '') + ' V.' },
    ];
  },
  pelajaran: [
    'Jika frekuensinya berbeda, reaktansi X_L dan X_C berbeda untuk tiap sumber. Satu rangkaian fasor tidak cukup.',
    'Hasil superposisi bukan sinusoid tunggal, tetapi jumlah dua sinusoid dengan frekuensi berbeda.',
  ],
  jebakan: [
    'Jangan menjumlahkan fasor dari dua frekuensi. Hasilnya tidak mewakili kenyataan.',
    'Saat menghubung singkat sumber tegangan, tetap pertahankan impedansinya. Yang dimatikan adalah tegangannya.',
  ],
};

const PROBLEMS = [P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13, P14];

if (typeof module !== 'undefined') module.exports = PROBLEMS;
