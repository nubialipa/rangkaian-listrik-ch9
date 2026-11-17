/*
 * Ringkasan soal: apa yang diketahui, apa yang ditanya, dan letak soal di PDF.
 * Ditulis ulang dengan kata sendiri dari soal Bab 9. Gambar asli dari buku
 * tidak disalin ke situs ini.
 */
const INFO_SOAL = {
  'P9.22': {
    hal: 3,
    diketahui: ['Jaringan pasif: $5\\,\\Omega$, $j8\\,\\Omega$, $10\\,\\Omega$, $-j20\\,\\Omega$, $j16\\,\\Omega$, $8\\,\\Omega$, $40\\,\\Omega$, $-j80\\,\\Omega$', 'Tanpa sumber'],
    ditanya: ['$Z_{ab}$ dalam bentuk rektangular dan polar'],
  },
  'P9.28': {
    hal: 6,
    diketahui: ['$v_s = 80\\cos(2000t)$ V', '$R = 3\\,\\text{k}\\Omega$, $C = 100\\,\\text{nF}$, $L = 500\\,\\text{mH}$, seri dalam satu loop'],
    ditanya: ['$i_o(t)$ keadaan tunak (bentuk kosinus)'],
  },
  'P9.30': {
    hal: 9,
    diketahui: ['$v_s = 25\\sin(4000t)$ V', '$5\\,\\Omega$, $10\\,\\Omega$, $20\\,\\Omega$, $L = 2{,}5\\,\\text{mH}$, $C = 12{,}5\\,\\mu\\text{F}$'],
    ditanya: ['$i_o(t)$ keadaan tunak, arus yang melewati $5\\,\\Omega$ paling atas'],
  },
  'P9.31': {
    hal: 12,
    diketahui: ['$i_g = 25\\cos(50000t)$ mA', '$L = 4\\,\\text{mH}$, $C = 80\\,\\text{nF}$, $R = 100\\,\\Omega$ dan $500\\,\\Omega$'],
    ditanya: ['$v_o(t)$ keadaan tunak', 'Selisih waktu (µs) antara $v_o$ dan $i_g$'],
  },
  'P9.33': {
    hal: 16,
    diketahui: ['$\\mathbf{V}_g = 100 - j50$ V, $\\mathbf{I}_g = 30 + j20$ A, $\\mathbf{V}_1 = 140 + j30$ V', 'Elemen lain: $20\\,\\Omega$, $j5\\,\\Omega$, $12\\,\\Omega$, $j16\\,\\Omega$, $-j10\\,\\Omega$'],
    ditanya: ['Impedansi $Z$ yang belum diketahui'],
  },
  'P9.44': {
    hal: 20,
    diketahui: ['$\\mathbf{V}_s = 180\\angle 90^\\circ$ V', 'Seri $j30\\,\\Omega$ dan $15\\,\\Omega$ paralel, lalu $-j30\\,\\Omega$ ke terminal $a$'],
    ditanya: ['Ekuivalen Norton $\\mathbf{I}_N$ dan $Z_N$ di terminal $a$–$b$', 'Gunakan transformasi sumber'],
  },
  'P9.49': {
    hal: 24,
    diketahui: ['$\\mathbf{V}_s = 250\\angle 0^\\circ$ V', '$20\\,\\Omega$, $j10\\,\\Omega$, $50\\,\\Omega$, $-j100\\,\\Omega$', 'Sumber tak-bebas $0{,}03\\,V_o$'],
    ditanya: ['Ekuivalen Thévenin $V_{Th}$ dan $Z_{Th}$ di terminal $a$–$b$'],
  },
  'P9.52': {
    hal: 28,
    diketahui: ['$\\omega = 10^5$ rad/s', '$400\\,\\text{nF}$, $600\\,\\mu\\text{H}$, $30\\,\\Omega$', 'Sumber tak-bebas $5\\,i_\\Delta$'],
    ditanya: ['$Z_{ab}$ dalam bentuk rektangular dan polar'],
  },
  'P9.54': {
    hal: 32,
    diketahui: ['$\\mathbf{V}_s = 240\\angle 0^\\circ$ V', '$j10\\,\\Omega$, $50\\,\\Omega$, $j10\\,\\Omega$, $30\\,\\Omega$'],
    ditanya: ['$\\mathbf{V}_o$ dengan metode tegangan simpul'],
  },
  'P9.55': {
    hal: 35,
    diketahui: ['Sumber arus $5\\angle 0^\\circ$ A dan sumber tegangan $20\\angle 90^\\circ$ V', 'Elemen: $-j4\\,\\Omega$, $-j8\\,\\Omega$, $j4\\,\\Omega$, $12\\,\\Omega$'],
    ditanya: ['$\\mathbf{V}_g$ (selisih tegangan simpul $A$ dan $C$)'],
  },
  'P9.59': {
    hal: 38,
    diketahui: ['Sumber arus $6 + j13$ mA', 'Sumber tak-bebas $\\mathbf{V}_o/10$ dan $20\\,\\mathbf{I}_o$', 'Elemen: $50\\,\\Omega$, $j25\\,\\Omega$, $50\\,\\Omega$, $-j25\\,\\Omega$'],
    ditanya: ['$\\mathbf{V}_o$ dan $\\mathbf{I}_o$'],
  },
  'P9.64': {
    hal: 41,
    diketahui: ['$v_g = 75\\cos(5000t)$ V', '$4\\,\\mu\\text{F}$, $110\\,\\text{mH}$, $4\\,\\text{mH}$, $10\\,\\Omega$', 'Sumber tak-bebas $100\\,i_\\Delta$'],
    ditanya: ['$v_o(t)$ keadaan tunak'],
  },
  'P9.65': {
    hal: 45,
    diketahui: ['$v_g = 120\\cos(10^5 t)$ V', '$1{,}2\\,\\text{k}\\Omega$, $3{,}125\\,\\text{nF}$, $80\\,\\text{mH}$, $2{,}4\\,\\text{k}\\Omega$, satu loop'],
    ditanya: ['$v_o(t)$ keadaan tunak'],
  },
  'P9.67': {
    hal: 48,
    diketahui: ['$v_1 = 20\\cos(2000t - 36{,}87^\\circ)$ V dan $v_2 = 10\\cos(5000t + 16{,}26^\\circ)$ V', '$1\\,\\text{mH}$, $100\\,\\mu\\text{F}$, $10\\,\\Omega$'],
    ditanya: ['Teknik analisis yang dipakai', '$v_o(t)$'],
  },
};

PROBLEMS.forEach((p) => { p.info = INFO_SOAL[p.id] || null; });
