/*
 * Paket kuis Kamis: empat soal baru (K1–K4) dengan langkah yang ditulis ulang
 * dengan kata sendiri. Netlist disusun dari gambar soal, dan semua angka
 * dihitung ulang dengan Solver lalu dicocokkan dengan jawaban di paket kuis.
 */
const KUIS_S = Solver;
const KC = KUIS_S.C;
const KT = KUIS_S.tex;
const KR = (x) => KC.c(x, 0);
const KJ = (x) => KC.c(0, x);

/* ---------- K1 — P9.32: KVL/KCL berantai untuk mencari Ib dan Z ---------- */
// Dari Ia dan Vg yang diberikan, semua besaran dihitung berurutan.
function hitungK1() {
  const Vg = KC.c(25, 0);
  const Ia = KC.c(0, 5);                       // 5∠90° A
  const V1 = KC.mul(Ia, KJ(-2));               // tegangan di −j2
  const VTM = Vg;                              // kawat atas: TM sama dengan Vg+
  const VRM = KC.sub(VTM, V1);                 // simpul kanan tengah
  const I1 = KC.div(VRM, KC.c(4, -3));         // arus lewat 4 − j3 ke bawah
  const Ib = KC.sub(I1, Ia);                   // KCL di RM
  const VMM = KC.add(VRM, KC.mul(Ib, KJ(-5))); // simpul kiri tengah
  const Ipar = KC.div(KC.sub(VTM, VMM), KC.c(1, 3)); // arus lewat 1 + j3 ke MM
  const Iz = KC.sub(Ipar, Ib);                 // KCL di MM
  const Z = KC.div(VMM, Iz);                   // Z = V / I
  return { Vg, Ia, V1, VRM, I1, Ib, VMM, Ipar, Iz, Z };
}

const KUIS_K1 = {
  id: 'K1',
  judul: 'K1 — P9.32: KVL/KCL berantai untuk mencari I_b dan Z',
  soal: 'Sumber $V_g = 25\\angle 0^\\circ$ V dan arus $I_a = 5\\angle 90^\\circ$ A diketahui. Di rangkaian ada $j3\\,\\Omega$ seri $1\\,\\Omega$, $-j2\\,\\Omega$ di kanan atas, $-j5\\,\\Omega$ di tengah, dan $4\\,\\Omega$ seri $-j3\\,\\Omega$ di bawah, serta elemen $Z$ yang belum diketahui. Cari $I_b$ dan $Z$.',
  pos: { T1: [120, 60], TM: [300, 60], MM: [300, 180], RM: [460, 180], g: [120, 340] },
  ground: 'g',
  elements() {
    const r = hitungK1();
    return [
      { id: 'Vg', kind: 'V', a: 'T1', b: 'g', E: r.Vg, label: '25∠0° V' },
      { id: 'Wtop', kind: 'V', a: 'T1', b: 'TM', E: KR(0), wire: true },
      { id: 'Z13', kind: 'Z', a: 'TM', b: 'MM', z: KC.c(1, 3), label: '1 Ω + j3 Ω' },
      { id: 'Zx', kind: 'Z', a: 'MM', b: 'g', z: r.Z, path: [[300, 340]], label: 'Z' },
      { id: 'Ib', kind: 'Z', a: 'MM', b: 'RM', z: KJ(-5), label: 'I_b: −j5 Ω' },
      { id: 'Ia', kind: 'Z', a: 'TM', b: 'RM', z: KJ(-2), path: [[460, 60]], label: 'I_a: −j2 Ω' },
      { id: 'Zs', kind: 'Z', a: 'RM', b: 'g', z: KC.c(4, -3), path: [[460, 340]], label: '4 Ω − j3 Ω' },
    ];
  },
  hitung() {
    const r = hitungK1();
    const s = KUIS_S.run(this.elements(), this.ground);
    return { Ib: r.Ib, Z: r.Z, V1: r.V1, I1: r.I1, Ipar: r.Ipar, Iz: r.Iz, VMM: r.VMM, cekIa: s.cur('Ia'), cekIb: s.cur('Ib') };
  },
  kunci: { Ib: KC.c(2.4, -3.2), Z: KC.c(1.42, -1.88) },
  langkah(r) {
    return [
      { j: 'Tulis data yang sudah ada', t: `Diketahui $V_g = 25\\angle 0^\\circ$ V dan $I_a = 5\\angle 90^\\circ$ A. Yang belum diketahui: $I_b$ dan $Z$. Cari dulu besaran yang bisa dihitung langsung dari data.` },
      { j: 'Tegangan di −j2', t: `Arus $I_a$ mengalir lewat $-j2\\,\\Omega$, jadi tegangannya:\n$$V_1 = I_a(-j2) = (j5)(-j2) = ${KT.rect(r.V1)}\\ \\text{V}$$` },
      { j: 'Arus I_1 lewat 4 − j3', t: `Lingkar luar: $V_g - V_1 = I_1(4-j3)$. Jadi $25 - 10 = 15 = I_1(4-j3)$, dan\n$$I_1 = \\dfrac{15}{4-j3} = ${KT.rect(r.I1)}\\ \\text{A}$$` },
      { j: 'Cari I_b dari KCL', t: `Di simpul kanan tengah, arus $I_1$ sama dengan $I_a + I_b$. Jadi\n$$I_b = I_1 - I_a = ${KT.rect(r.Ib)}\\ \\text{A} = ${KT.polar(r.Ib)}\\ \\text{A}$$` },
      { j: 'Tegangan simpul kiri tengah', t: `Dari $I_b$ ke simpul kiri tengah lewat $-j5\\,\\Omega$: $V_{MM} = V_{RM} + I_b(-j5) = ${KT.rect(r.VMM)}\\ \\text{V}$. Nilai ini sama dengan tegangan di elemen $Z$.` },
      { j: 'Arus lewat 1 + j3', t: `Dari sumber ke simpul kiri tengah lewat $1+j3\\,\\Omega$:\n$$I_{(1+j3)} = \\dfrac{25 - V_{MM}}{1+j3} = ${KT.rect(r.Ipar)}\\ \\text{A}$$` },
      { j: 'Arus lewat Z', t: `KCL di simpul kiri tengah: arus yang masuk sama dengan yang keluar, yaitu $I_{(1+j3)} = I_b + I_Z$. Jadi\n$$I_Z = I_{(1+j3)} - I_b = ${KT.rect(r.Iz)}\\ \\text{A}$$` },
      { j: 'Hitung Z', t: `$$Z = \\dfrac{V_{MM}}{I_Z} = \\dfrac{${KT.rect(r.VMM)}}{${KT.rect(r.Iz)}} = ${KT.rect(r.Z)}\\ \\Omega$$` },
      { j: 'Cek dengan rangkaian lengkap', t: `Dengan $Z$ tersebut, solver menghasilkan $I_a = ${KT.polar(r.cekIa)}$ A, sama dengan data soal. Jadi hasilnya konsisten.` },
    ];
  },
  pelajaran: [
    'Cari besaran yang datanya sudah lengkap dulu. Begitu satu nilai diketahui, persamaan berikutnya ikut terbuka.',
    'Dalam polar, $25 - V_{MM}$ dipakai sebagai pembilang karena tegangan sumber adalah tegangan di awal cabang.',
  ],
};

/* ---------- K2 — P9.34: pembagi arus dua cabang ---------- */
const KUIS_K2 = {
  id: 'K2',
  judul: 'K2 — P9.34: pembagi arus dua cabang, cari v_o',
  soal: 'Sumber arus $i_g = 60\\cos(10\\,000t)$ mA dipasang paralel dengan dua cabang. Cabang kiri berisi $50\\,\\Omega$ seri $10$ mH. Cabang kanan berisi $2\\,\\mu$F seri $100\\,\\Omega$. Cari $v_o(t)$ keadaan tunak, yaitu tegangan di $100\\,\\Omega$.',
  pos: { T: [260, 80], B: [260, 340], N2: [440, 200] },
  ground: 'B',
  elements() {
    const w = 1e4;
    return [
      { id: 'Ig', kind: 'I', a: 'B', b: 'T', J: KC.c(0.06, 0), path: [[80, 340], [80, 80]], label: 'i_g = 60∠0° mA' },
      { id: 'Z1', kind: 'Z', a: 'T', b: 'B', z: KC.add(KR(50), KUIS_S.L(10e-3, w)), path: [[160, 80], [160, 340]], label: '50 Ω + j100 Ω' },
      { id: 'C2', kind: 'Z', a: 'T', b: 'N2', z: KUIS_S.Cap(2e-6, w), path: [[440, 80]], label: '−j50 Ω' },
      { id: 'R100', kind: 'Z', a: 'N2', b: 'B', z: KR(100), path: [[440, 340]], label: '100 Ω' },
    ];
  },
  hitung() {
    const w = 1e4;
    const Z1 = KC.add(KR(50), KUIS_S.L(10e-3, w));
    const Z2 = KC.add(KUIS_S.Cap(2e-6, w), KR(100));
    const Ig = KC.c(0.06, 0);
    const Io = KC.mul(Ig, KC.div(Z1, KC.add(Z1, Z2)));
    const vo = KC.mul(KR(100), Io);
    const s = KUIS_S.run(this.elements(), this.ground);
    return { Z1, Z2, Io, vo, cek: s.v('N2') };
  },
  kunci: { vo: KC.c(3, 3) },
  langkah(r) {
    return [
      { j: 'Tentukan ω dan impedansi cabang', t: `Dari sumber, $\\omega = 10\\,000$ rad/s. Cabang kiri: $Z_1 = 50 + j100\\,\\Omega$ (karena $\\omega L = 10^4 \\cdot 10\\cdot10^{-3} = 100$). Cabang kanan: $Z_2 = 100 - j50\\,\\Omega$ (karena $1/(\\omega C) = 1/(10^4\\cdot 2\\cdot10^{-6}) = 50$).` },
      { j: 'Kenali pembagi arus', t: `Kedua cabang paralel dan ditenagai satu sumber arus. Arus yang melewati cabang kanan dihitung dengan pembagi arus. Pembilangnya impedansi cabang yang lain, yaitu $Z_1$.` },
      { j: 'Arus di cabang kanan', t: `$$\\mathbf{I}_o = \\mathbf{I}_g\\dfrac{Z_1}{Z_1+Z_2} = 0{,}06\\cdot\\dfrac{50+j100}{150+j50} = ${KT.rect(r.Io)}\\ \\text{A}$$` },
      { j: 'Tegangan di 100 Ω', t: `Hanya resistor $100\\,\\Omega$ yang diapit tanda $+$ dan $-$ di soal. Tegangannya $$\\mathbf{V}_o = 100\\,\\mathbf{I}_o = ${KT.rect(r.vo)}\\ \\text{V} = ${KT.polar(r.vo)}\\ \\text{V}$$` },
      { j: 'Bentuk waktu', t: `$$v_o(t) = ${KT.time(r.vo, 10000)}\\ \\text{V}$$` },
    ];
  },
  pelajaran: [
    'Pada pembagi arus, pembilangnya adalah impedansi cabang lawan, bukan cabang yang sedang dihitung.',
    'Tegangan yang diminta hanya di elemen yang diapit tanda $\\pm$ pada gambar. Jangan menghitung tegangan seluruh cabang.',
  ],
};

/* ---------- K3 — P9.66: pembagi arus dengan kuadran III ---------- */
const KUIS_K3 = {
  id: 'K3',
  judul: 'K3 — P9.66: pembagi arus, cari i_o (kuadran III)',
  soal: 'Sumber arus $i_g = 60\\cos(250t)$ mA dipasang paralel dengan dua cabang. Cabang kiri berisi $100\\,\\mu$F seri $20\\,\\Omega$. Cabang kanan berisi $100\\,\\Omega$ seri $800$ mH. Cari $i_o(t)$ keadaan tunak di cabang kanan.',
  pos: { T: [260, 80], B: [260, 340], N2: [440, 200] },
  ground: 'B',
  elements() {
    const w = 250;
    return [
      { id: 'Ig', kind: 'I', a: 'B', b: 'T', J: KC.c(0.06, 0), path: [[80, 340], [80, 80]], label: 'i_g = 60∠0° mA' },
      { id: 'Z1', kind: 'Z', a: 'T', b: 'B', z: KC.add(KR(20), KUIS_S.Cap(100e-6, w)), path: [[160, 80], [160, 340]], label: '20 Ω − j40 Ω' },
      { id: 'R100', kind: 'Z', a: 'T', b: 'N2', z: KR(100), path: [[440, 80]], label: 'i_o: 100 Ω' },
      { id: 'L800', kind: 'Z', a: 'N2', b: 'B', z: KUIS_S.L(0.8, w), path: [[440, 340]], label: '800 mH (j200 Ω)' },
    ];
  },
  hitung() {
    const w = 250;
    const Z1 = KC.add(KR(20), KUIS_S.Cap(100e-6, w));
    const Z2 = KC.add(KR(100), KUIS_S.L(0.8, w));
    const Io = KC.mul(KC.c(0.06, 0), KC.div(Z1, KC.add(Z1, Z2)));
    const s = KUIS_S.run(this.elements(), this.ground);
    return { Z1, Z2, Io, cek: s.cur('R100') };
  },
  kunci: { Io: KC.c(-0.006, -0.012) },
  langkah(r) {
    return [
      { j: 'Tentukan ω dan impedansi cabang', t: `Dari sumber, $\\omega = 250$ rad/s. Cabang kiri: $Z_1 = 20 - j40\\,\\Omega$ (karena $1/(250\\cdot100\\cdot10^{-6}) = 40$). Cabang kanan: $Z_2 = 100 + j200\\,\\Omega$ (karena $250\\cdot 0{,}8 = 200$).` },
      { j: 'Pembagi arus', t: `Arus di cabang kanan adalah $\\mathbf{I}_o = \\mathbf{I}_g\\dfrac{Z_1}{Z_1+Z_2}$. Pembilangnya impedansi cabang kiri.` },
      { j: 'Hitung pecahan impedansi', t: `$$\\dfrac{20-j40}{120+j160} = \\dfrac{(20-j40)(120-j160)}{120^2+160^2} = -0{,}1 - j0{,}2$$` },
      { j: 'Hasil dalam mA', t: `$$\\mathbf{I}_o = 60\\cdot(-0{,}1 - j0{,}2) = ${KT.rect(KC.scale(1000, r.Io))}\\ \\text{mA}$$ Kedua bagian negatif, jadi titik ini ada di kuadran III.` },
      { j: 'Sudut yang benar', t: `$|\\mathbf{I}_o| = \\sqrt{6^2+12^2} = ${KT.num(KC.abs(KC.scale(1000, r.Io)))}$ mA. Kalkulator memberi $\\tan^{-1}(2) = 63{,}43^\\circ$, tetapi karena kuadran III, $\\theta = 63{,}43^\\circ - 180^\\circ = -116{,}57^\\circ$.` },
      { j: 'Bentuk waktu', t: `$$i_o(t) = 13{,}42\\cos(250t - 116{,}57^\\circ)\\ \\text{mA}$$` },
    ];
  },
  pelajaran: [
    'Jika kedua bagian bilangan kompleks negatif, titik itu ada di kuadran III. Tambahkan koreksi $-180^\\circ$ pada sudut dari $\\tan^{-1}$.',
    'Kalkulator mode polar memberi kuadran secara otomatis. Tetap cek dengan tanda bagian nyata dan khayal sebelum menulis jawaban.',
  ],
};

/* ---------- K4 — AP 9.11: Thévenin dengan sumber tak-bebas ---------- */
const KUIS_K4 = {
  id: 'K4',
  judul: 'K4 — AP 9.11: Thévenin dengan sumber tak-bebas',
  soal: 'Sumber arus $2\\angle 45^\\circ$ A dipasang paralel dengan $20\\,\\Omega$. Di rangkaian ada sumber tak-bebas $10\\,I_x$ dengan $I_x$ arus di $20\\,\\Omega$. Cari ekuivalen Thévenin di terminal $a$–$b$ dengan metode $V_{Th}/I_{sc}$.',
  pos: { g: [100, 340], P: [240, 120], Q: [400, 120], R: [520, 120] },
  ground: 'g',
  elements(aktif = true) {
    return [
      { id: 'Is', kind: 'I', a: 'g', b: 'P', J: aktif ? KC.polar(2, 45) : KR(0), path: [[100, 120]], label: '2∠45° A' },
      { id: 'Z20', kind: 'Z', a: 'P', b: 'g', z: KR(20), path: [[240, 340]], label: '20 Ω (Ix)' },
      { id: 'J10', kind: 'Z', a: 'P', b: 'Q', z: KJ(10), label: 'j10 Ω' },
      { id: 'Dep', kind: 'CCVS', a: 'Q', b: 'g', ctrl: 'Z20', k: KR(10), path: [[400, 340]], label: '10·Ix' },
      { id: 'R10', kind: 'Z', a: 'Q', b: 'R', z: KR(10), label: '10 Ω' },
      { id: 'Cap', kind: 'Z', a: 'R', b: 'g', z: KJ(-10), path: [[520, 340]], label: '−j10 Ω' },
    ];
  },
  hitung() {
    // V_th = V_ab dengan terminal terbuka
    const s = KUIS_S.run(this.elements(true), this.ground);
    const Vth = s.v('R');
    // I_sc = arus lewat hubung singkat a–g (sumber bebas aktif)
    const sc = this.elements(true).concat([{ id: 'Sc', kind: 'V', a: 'R', b: 'g', E: KR(0), wire: true }]);
    const s2 = KUIS_S.run(sc, this.ground);
    const Isc = s2.cur('Sc') === undefined ? KC.c(0, 0) : s2.cur('Sc');
    const Zth = KC.div(Vth, Isc);
    return { Vth, Isc, Zth, Vq: s.v('Q'), Vp: s.v('P') };
  },
  kunci: { Vth: KC.polar(10, 45), Zth: KC.c(5, -5) },
  langkah(r) {
    return [
      { j: 'Nyatakan sumber tak-bebas dengan tegangan simpul', t: `$I_x = V_P/20$. Sumber $10\\,I_x$ menempel dari $Q$ ke acuan, jadi $\\mathbf{V}_Q = 10\\,I_x = 0{,}5\\,\\mathbf{V}_P$. Sekarang hanya ada satu tegangan yang belum diketahui, yaitu $V_P$.` },
      { j: 'V_Th dengan terminal terbuka', t: `Tulis KCL di $P$: arus dari sumber $2\\angle45^\\circ$ sama dengan arus lewat $20\\,\\Omega$ dan $j10\\,\\Omega$. Substitusi $V_Q = 0{,}5V_P$:\n$$\\dfrac{V_P}{20} + \\dfrac{V_P - 0{,}5V_P}{j10} = 2\\angle 45^\\circ \\quad\\Rightarrow\\quad \\mathbf{V}_P = ${KT.polar(r.Vp)}\\ \\text{V}$$\nLalu $\\mathbf{V}_Q = 0{,}5\\mathbf{V}_P = ${KT.rect(r.Vq)}$ V.` },
      { j: 'Tegangan di a dan b', t: `Dengan terminal terbuka, tidak ada arus keluar dari $R$. Hitung $V_R$ dari KCL di $R$. Hasilnya $$\\mathbf{V}_{Th} = \\mathbf{V}_R = ${KT.polar(r.Vth)}\\ \\text{V}$$` },
      { j: 'Arus hubung singkat I_sc', t: `Hubungkan $a$ dan $b$ langsung. Sekarang $V_R = 0$, sehingga arus hubung singkat hanya lewat $10\\,\\Omega$ dari $Q$: $$\\mathbf{I}_{sc} = \\dfrac{\\mathbf{V}_Q}{10} = ${KT.polar(r.Isc)}\\ \\text{A}$$` },
      { j: 'Hitung Z_Th', t: `$$\\mathbf{Z}_{Th} = \\dfrac{\\mathbf{V}_{Th}}{\\mathbf{I}_{sc}} = \\dfrac{10\\angle45^\\circ}{1{,}414\\angle90^\\circ} = ${KT.rect(r.Zth)}\\ \\Omega$$` },
      { j: 'Tulis ekuivalen', t: `Ekuivalen Thévenin: sumber tegangan $10\\angle 45^\\circ$ V seri dengan $Z_{Th} = 5 - j5\\,\\Omega$.` },
    ];
  },
  pelajaran: [
    'Sumber tak-bebas yang menempel langsung ke acuan menetapkan satu tegangan simpul. Itu menghapus satu variabel sebelum persamaan apa pun ditulis.',
    'Dengan $V_{Th}/I_{sc}$, sumber tak-bebas tidak boleh dimatikan. Saat $a$–$b$ dihubung singkat, tegangan $V_R$ nol dan rangkaian jadi lebih sederhana.',
  ],
};

const KUIS = [KUIS_K1, KUIS_K2, KUIS_K3, KUIS_K4];

if (typeof module !== 'undefined') module.exports = { KUIS };
