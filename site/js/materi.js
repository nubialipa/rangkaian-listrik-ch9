/*
 * Penjelasan materi Bab 9 (ditulis ulang dengan kata sendiri).
 * Setiap bagian memuat penjelasan, contoh yang sudah dihitung, dan alat bantu
 * interaktif kecil. Semua angka contoh dapat dicek dengan Solver.
 */
(function () {
  'use strict';

  const { C, fmt, tex: T } = Solver;
  const NS = 'http://www.w3.org/2000/svg';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svgEl = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const math = (el) => {
    if (el && typeof window.renderMathInElement === 'function') {
      window.renderMathInElement(el, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false,
      });
    }
  };
  const num = (x, d = 2) => {
    if (!isFinite(x)) return '—';
    const s = Number(x).toFixed(d);
    return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
  };

  /* ---------- alat bantu: grafik sinus ---------- */
  function plotSinyal(svg, serial, tMax, yMax) {
    svg.innerHTML = '';
    const W = 600, H = 240, px = 40, py = 20;
    const sx = (t) => px + (t / tMax) * (W - 2 * px);
    const sy = (y) => H / 2 - (y / yMax) * (H / 2 - py);
    svgEl('line', { x1: px, y1: H / 2, x2: W - px, y2: H / 2, stroke: '#9aa8b8', 'stroke-width': 1 }, svg);
    svgEl('line', { x1: px, y1: py, x2: px, y2: H - py, stroke: '#9aa8b8', 'stroke-width': 1 }, svg);
    svgEl('text', { x: W - px, y: H / 2 - 6, fill: '#9aa8b8', 'font-size': 11, 'text-anchor': 'end' }, svg).textContent = 't';
    for (const s of serial) {
      const pts = [];
      for (let i = 0; i <= 400; i++) {
        const t = (i / 400) * tMax;
        pts.push(`${sx(t).toFixed(1)},${sy(s.f(t)).toFixed(1)}`);
      }
      svgEl('polyline', { points: pts.join(' '), fill: 'none', stroke: s.warna, 'stroke-width': 2.2 }, svg);
      svgEl('text', { x: px + 6, y: sy(yMax * 0.9) + s.dy, fill: s.warna, 'font-size': 12 }, svg).textContent = s.nama;
    }
  }

  function alatSinus(host) {
    host.innerHTML = `
      <div class="alat">
        <div class="alat-baris">
          <label>V<sub>m</sub> <input id="sin-vm" type="range" min="1" max="100" value="20"> <span id="sin-vm-t" class="mono">20 V</span></label>
          <label>f <input id="sin-f" type="range" min="1" max="20" value="2"> <span id="sin-f-t" class="mono">2 Hz</span></label>
          <label>φ <input id="sin-phi" type="range" min="-180" max="180" value="60"> <span id="sin-phi-t" class="mono">60°</span></label>
        </div>
        <svg id="sin-svg" viewBox="0 0 600 240" class="grafik"></svg>
        <div class="hasil-alat" id="sin-hasil"></div>
      </div>`;
    const svg = host.querySelector('#sin-svg');
    const hasil = host.querySelector('#sin-hasil');
    const ambil = () => ({
      vm: Number(host.querySelector('#sin-vm').value),
      f: Number(host.querySelector('#sin-f').value),
      phi: Number(host.querySelector('#sin-phi').value),
    });
    const perbarui = () => {
      const { vm, f, phi } = ambil();
      host.querySelector('#sin-vm-t').textContent = `${vm} V`;
      host.querySelector('#sin-f-t').textContent = `${f} Hz`;
      host.querySelector('#sin-phi-t').textContent = `${phi}°`;
      const T0 = 1 / f, w = 2 * Math.PI * f;
      const f0 = (t) => vm * Math.cos(w * t + (phi * Math.PI) / 180);
      plotSinyal(svg, [{ f: f0, warna: '#ffc35a', nama: `v(t) = ${vm} cos(${num(w, 2)}t + ${phi}°)`, dy: 0 }], 2 * T0, Math.max(vm, 1));
      hasil.innerHTML = `
        <p>Periode $T = ${num(T0, 4)}$ s · $\\omega = 2\\pi f = ${num(w, 2)}$ rad/s · nilai rms $V_{rms} = V_m/\\sqrt{2} = ${num(vm / Math.SQRT2, 2)}$ V</p>
        <p class="muted">Pergeseran fasa $\\phi$ menggeser grafik ke kiri jika positif. Puncak pertama muncul di $t = -\\phi/\\omega$.</p>`;
      math(hasil);
    };
    host.querySelectorAll('input').forEach((el) => el.addEventListener('input', perbarui));
    perbarui();
  }

  /* ---------- alat bantu: konversi fasor ---------- */
  function alatKonversi(host) {
    host.innerHTML = `
      <div class="alat">
        <div class="alat-dua">
          <div>
            <h3>Rektangular → polar</h3>
            <label>a <input id="kv-a" type="number" value="25" step="any"></label>
            <label>b <input id="kv-b" type="number" value="20" step="any"></label>
            <div id="kv-hasil1" class="hasil-alat"></div>
          </div>
          <div>
            <h3>Polar → rektangular</h3>
            <label>r <input id="kv-r" type="number" value="32.02" step="any"></label>
            <label>θ (°) <input id="kv-th" type="number" value="38.66" step="any"></label>
            <div id="kv-hasil2" class="hasil-alat"></div>
          </div>
        </div>
      </div>`;
    const hitung = () => {
      const a = Number(host.querySelector('#kv-a').value), b = Number(host.querySelector('#kv-b').value);
      const z = C.c(a, b);
      host.querySelector('#kv-hasil1').innerHTML = `
        <p>$|Z| = \\sqrt{a^2+b^2} = ${num(C.abs(z), 2)}$</p>
        <p>$\\theta = \\tan^{-1}(b/a)$, dengan kuadran dari tanda $a$ dan $b$: $\\theta = ${num(C.deg(z), 2)}^\\circ$</p>
        <p>Hasil polar: $${T.polar(z)}$</p>`;
      const r = Number(host.querySelector('#kv-r').value), th = Number(host.querySelector('#kv-th').value);
      const p = C.polar(r, th);
      host.querySelector('#kv-hasil2').innerHTML = `
        <p>$a = r\\cos\\theta = ${num(p.re, 2)}$, $b = r\\sin\\theta = ${num(p.im, 2)}$</p>
        <p>Hasil rektangular: $${T.rect(p)}$</p>`;
      math(host);
    };
    host.querySelectorAll('input').forEach((el) => el.addEventListener('input', hitung));
    hitung();
  }

  /* ---------- alat bantu: penjumlahan dua fasor ---------- */
  function alatJumlahFasor(host) {
    host.innerHTML = `
      <div class="alat">
        <div class="alat-dua">
          <div><h3>Fasor 1</h3>
            <label>|V₁| <input id="jf-r1" type="number" value="20" step="any"></label>
            <label>θ₁ (°) <input id="jf-t1" type="number" value="-30" step="any"></label></div>
          <div><h3>Fasor 2</h3>
            <label>|V₂| <input id="jf-r2" type="number" value="40" step="any"></label>
            <label>θ₂ (°) <input id="jf-t2" type="number" value="60" step="any"></label></div>
        </div>
        <svg id="jf-svg" viewBox="0 0 600 300" class="grafik"></svg>
        <div id="jf-hasil" class="hasil-alat"></div>
      </div>`;
    const svg = host.querySelector('#jf-svg');
    const hitung = () => {
      const r1 = Number(host.querySelector('#jf-r1').value), t1 = Number(host.querySelector('#jf-t1').value);
      const r2 = Number(host.querySelector('#jf-r2').value), t2 = Number(host.querySelector('#jf-t2').value);
      const z1 = C.polar(r1, t1), z2 = C.polar(r2, t2), s = C.add(z1, z2);
      svg.innerHTML = '';
      const ox = 300, oy = 150, k = 3.2;
      const panah = (z, warna, nama) => {
        svgEl('line', { x1: ox, y1: oy, x2: ox + z.re * k, y2: oy - z.im * k, stroke: warna, 'stroke-width': 3 }, svg);
        svgEl('text', { x: ox + z.re * k + 6, y: oy - z.im * k - 6, fill: warna, 'font-size': 13 }, svg).textContent = nama;
      };
      svgEl('line', { x1: 40, y1: oy, x2: 560, y2: oy, stroke: '#3d4d61' }, svg);
      svgEl('line', { x1: ox, y1: 20, x2: ox, y2: 280, stroke: '#3d4d61' }, svg);
      // Tempatkan ekor fasor 2 di ujung fasor 1 (metode jajar genjang)
      panah(z1, '#7fb4f0', 'V₁');
      const ujung1 = C.add(C.c(0, 0), z1);
      svgEl('line', { x1: ox + ujung1.re * k, y1: oy - ujung1.im * k, x2: ox + s.re * k, y2: oy - s.im * k, stroke: '#ffc35a', 'stroke-width': 3, 'stroke-dasharray': '6 4' }, svg);
      svgEl('text', { x: ox + s.re * k + 6, y: oy - s.im * k - 6, fill: '#ffc35a', 'font-size': 13 }, svg).textContent = 'V₂';
      panah(s, '#9be3b5', 'V₁+V₂');
      host.querySelector('#jf-hasil').innerHTML = `
        <p>Rektangular: $\\mathbf{V}_1 = ${T.rect(z1)}$ dan $\\mathbf{V}_2 = ${T.rect(z2)}$, jadi $\\mathbf{V}_1+\\mathbf{V}_2 = ${T.rect(s)}$</p>
        <p>Polar: $\\mathbf{V} = ${T.polar(s)}$</p>
        <p>Bentuk waktu (frekuensi sama): $$y(t) = ${T.time(s, 'ω')}$$</p>`;
      math(host);
    };
    host.querySelectorAll('input').forEach((el) => el.addEventListener('input', hitung));
    hitung();
  }

  /* ---------- alat bantu: elemen R, L, C ---------- */
  function alatElemen(host) {
    host.innerHTML = `
      <div class="alat">
        <div class="alat-baris">
          <label>Elemen
            <select id="el-jenis"><option value="R">Resistor R</option><option value="L">Induktor L</option><option value="C">Kapasitor C</option></select></label>
          <label>Nilai <input id="el-nilai" type="number" value="10" step="any"> <span id="el-satuan" class="mono">Ω</span></label>
          <label>ω (rad/s) <input id="el-w" type="number" value="1000" step="any"></label>
        </div>
        <svg id="el-svg" viewBox="0 0 600 240" class="grafik"></svg>
        <div id="el-hasil" class="hasil-alat"></div>
      </div>`;
    const svg = host.querySelector('#el-svg');
    const hitung = () => {
      const jenis = host.querySelector('#el-jenis').value;
      const nilai = Number(host.querySelector('#el-nilai').value);
      const w = Number(host.querySelector('#el-w').value) || 1;
      const satuan = { R: 'Ω', L: 'H', C: 'F' }[jenis];
      host.querySelector('#el-satuan').textContent = satuan;
      let z;
      if (jenis === 'R') z = C.c(nilai, 0);
      else if (jenis === 'L') z = C.c(0, w * nilai);
      else z = C.c(0, -1 / (w * nilai));
      const th = C.deg(z);
      // Arus 1 A dengan sudut 0. Tegangan V = Z·I.
      const amp = C.abs(z);
      const vOff = th * Math.PI / 180;
      const T0 = (2 * Math.PI) / w;
      const tMax = 2 * T0;
      plotSinyal(svg, [
        { f: (t) => Math.cos(w * t), warna: '#7fb4f0', nama: 'i(t) = cos(ωt)', dy: -8 },
        { f: (t) => amp * Math.cos(w * t + vOff), warna: '#ffc35a', nama: 'v(t)', dy: 16 },
      ], tMax, Math.max(1, amp));
      let kata;
      if (Math.abs(th) < 1e-6) kata = 'v dan i sefasa (fasa sama)';
      else if (th > 0) kata = `v mendahului i sebesar ${num(th, 1)}°`;
      else kata = `v tertinggal dari i sebesar ${num(-th, 1)}°`;
      host.querySelector('#el-hasil').innerHTML = `
        <p>$\\mathbf{Z} = ${T.rect(z)}\\ \\Omega = ${T.polar(z)}\\ \\Omega$</p>
        <p>${kata}.</p>`;
      math(host);
    };
    host.querySelectorAll('input,select').forEach((el) => el.addEventListener('input', hitung));
    hitung();
  }

  /* ---------- alat bantu: seri, paralel, dan pembagi ---------- */
  function alatSeriParalel(host) {
    host.innerHTML = `
      <div class="alat">
        <div class="alat-dua">
          <div><h3>Impedansi 1</h3>
            <label>R₁ <input id="sp-r1" type="number" value="3" step="any"></label>
            <label>X₁ <input id="sp-x1" type="number" value="4" step="any"></label></div>
          <div><h3>Impedansi 2</h3>
            <label>R₂ <input id="sp-r2" type="number" value="10" step="any"></label>
            <label>X₂ <input id="sp-x2" type="number" value="10" step="any"></label></div>
        </div>
        <label>Tegangan sumber V (rms, sudut 0°) <input id="sp-v" type="number" value="100" step="any"></label>
        <div id="sp-hasil" class="hasil-alat"></div>
      </div>`;
    const hitung = () => {
      const z1 = C.c(Number(host.querySelector('#sp-r1').value), Number(host.querySelector('#sp-x1').value));
      const z2 = C.c(Number(host.querySelector('#sp-r2').value), Number(host.querySelector('#sp-x2').value));
      const V = Number(host.querySelector('#sp-v').value);
      const seri = C.add(z1, z2);
      const paralel = C.div(C.mul(z1, z2), seri);
      const v1 = C.div(C.mul(C.c(V, 0), z1), seri);
      host.querySelector('#sp-hasil').innerHTML = `
        <p>Seri: $Z_s = Z_1 + Z_2 = ${T.rect(seri)}\\ \\Omega = ${T.polar(seri)}\\ \\Omega$</p>
        <p>Paralel: $Z_p = \\dfrac{Z_1 Z_2}{Z_1+Z_2} = ${T.rect(paralel)}\\ \\Omega$</p>
        <p>Pembagi tegangan untuk $Z_1$ pada rangkaian seri: $\\mathbf{V}_1 = V\\dfrac{Z_1}{Z_1+Z_2} = ${T.polar(v1)}\\ \\text{V}$</p>`;
      math(host);
    };
    host.querySelectorAll('input').forEach((el) => el.addEventListener('input', hitung));
    hitung();
  }

  /* ---------- isi pelajaran ---------- */
  const PELAJARAN = [
    {
      id: 'sinus', judul: 'Sinusoid dan parameternya',
      ringkas: 'Bentuk umum tegangan sinus, periode, frekuensi, dan nilai rms.',
      bagian: [
        { judul: 'Bentuk umum', isi: `Tegangan sinus ditulis sebagai $v(t) = V_m\\cos(\\omega t + \\phi)$. $V_m$ adalah amplitudo, $\\omega$ adalah kecepatan sudut (rad/s), dan $\\phi$ adalah sudut fasa. Puncak pertama muncul saat $\\omega t + \\phi = 0$.` },
        { judul: 'Periode dan frekuensi', isi: `$T = 1/f$ dan $\\omega = 2\\pi f$. Satu siklus per detik disebut 1 Hz. Jadi frekuensi 1000 Hz berarti $\\omega = 2000\\pi$ rad/s.` },
        { judul: 'Pakai kosinus, bukan sinus', isi: `Dalam bab ini semua bentuk ditulis sebagai kosinus. Sumber sinus harus diubah dulu dengan $\\sin\\theta = \\cos(\\theta - 90^\\circ)$. Contoh: $25\\sin(4000t) = 25\\cos(4000t - 90^\\circ)$ V.` },
        { judul: 'Nilai rms', isi: `Untuk sinus, $V_{rms} = V_m/\\sqrt{2}$. Nilai rms hanya bergantung pada amplitudo, bukan pada frekuensi atau sudut fasa. Nilai rms penting untuk perhitungan daya.` },
      ],
      contoh: `Arus dengan amplitudo 20 A menyelesaikan satu siklus dalam 1 ms, dan nilainya 10 A pada $t = 0$.
        <ul><li>$f = 1/T = 1000$ Hz, $\\omega = 2000\\pi$ rad/s.</li>
        <li>Dari $i(0) = 20\\cos\\phi = 10$, didapat $\\cos\\phi = 1/2$, jadi $\\phi = 60^\\circ$.</li>
        <li>Bentuk akhirnya: $i(t) = 20\\cos(2000\\pi t + 60^\\circ)$ A, dengan rms $20/\\sqrt{2} \\approx 14{,}14$ A.</li></ul>`,
      alat: alatSinus,
      latihan: [
        { q: 'Ubah $170\\cos(377t - 40^\\circ)$ V ke bentuk fasor.', a: '$\\mathbf{V} = 170\\angle -40^\\circ$ V' },
        { q: 'Ubah $10\\sin(1000t + 20^\\circ)$ A ke bentuk fasor.', a: 'Ubah dulu ke kosinus: $10\\cos(1000t - 70^\\circ)$. Jadi $\\mathbf{I} = 10\\angle -70^\\circ$ A.' },
      ],
    },
    {
      id: 'fasor', judul: 'Fasor: cara menulis sinus sebagai bilangan kompleks',
      ringkas: 'Transformasi fasor, bentuk rektangular dan polar, dan cara menjumlahkan sinus dengan frekuensi sama.',
      bagian: [
        { judul: 'Dari Euler ke fasor', isi: `Dengan identitas Euler $e^{j\\theta} = \\cos\\theta + j\\sin\\theta$, sinus dapat dipandang sebagai bagian nyata dari bilangan kompleks yang berputar. Fasor $\\mathbf{V} = V_m e^{j\\phi}$ hanya menyimpan amplitudo dan fasa, sedangkan $\\omega$ dipakai bersama untuk semua besaran di rangkaian.` },
        { judul: 'Transformasi dan balik', isi: `Transformasi fasor: $V_m\\cos(\\omega t + \\phi) \\rightarrow \\mathbf{V} = V_m\\angle\\phi$. Balik: dari $\\mathbf{V} = V_m\\angle\\phi$ kembali ke $V_m\\cos(\\omega t + \\phi)$ dengan mengalikan $e^{j\\omega t}$ lalu mengambil bagian nyatanya.` },
        { judul: 'Rektangular dan polar', isi: `Bentuk rektangular $a + jb$ dan polar $r\\angle\\theta$ saling berhubungan: $r = \\sqrt{a^2+b^2}$, $\\theta = \\tan^{-1}(b/a)$ dengan kuadran dari tanda $a$ dan $b$; sebaliknya $a = r\\cos\\theta$, $b = r\\sin\\theta$. Kalkulator tidak tahu kuadran, jadi periksa sendiri.` },
        { judul: 'Penjumlahan dengan frekuensi sama', isi: `Dua sinus dengan frekuensi sama dapat dijumlahkan sebagai fasor. Jumlahkan bagian rektangularnya, lalu ubah ke polar. Jangan menjumlahkan fasor dengan frekuensi berbeda.` },
      ],
      contoh: `Jumlahkan $y_1 = 20\\cos(\\omega t - 30^\\circ)$ dan $y_2 = 40\\cos(\\omega t + 60^\\circ)$.
        <ul><li>$\\mathbf{Y}_1 = 20\\angle -30^\\circ = 17{,}32 - j10$, dan $\\mathbf{Y}_2 = 40\\angle 60^\\circ = 20 + j34{,}64$.</li>
        <li>Jumlahnya $\\mathbf{Y} = 37{,}32 + j24{,}64$, dengan $|\\mathbf{Y}| = 44{,}72$ dan $\\theta = 33{,}43^\\circ$.</li>
        <li>Jadi $y(t) = 44{,}72\\cos(\\omega t + 33{,}43^\\circ)$.</li></ul>`,
      alat: alatJumlahFasor,
      latihan: [
        { q: 'Tulis $\\mathbf{V} = 3 + j4$ dalam bentuk polar.', a: '$|V| = 5$ dan $\\theta = \\tan^{-1}(4/3) = 53{,}13^\\circ$. Jadi $5\\angle 53{,}13^\\circ$.' },
        { q: 'Tulis $\\mathbf{V} = 18{,}6\\angle -54^\\circ$ sebagai fungsi waktu (frekuensi $\\omega$).', a: '$v(t) = 18{,}6\\cos(\\omega t - 54^\\circ)$ V.' },
      ],
    },
    {
      id: 'elemen', judul: 'R, L, dan C di domain frekuensi',
      ringkas: 'Hubungan tegangan dan arus untuk tiga elemen pasif, dan kapan tegangan mendahului atau tertinggal.',
      bagian: [
        { judul: 'Resistor', isi: `Dari hukum Ohm, $\\mathbf{V} = R\\mathbf{I}$. Tegangan dan arus sefasa, jadi tidak ada pergeseran sudut.` },
        { judul: 'Induktor', isi: `Dari $v = L\\,di/dt$, didapat $\\mathbf{V} = j\\omega L\\,\\mathbf{I}$. Impedansinya $Z_L = j\\omega L$ dan reaktansinya $X_L = \\omega L$. Tegangan mendahului arus sebesar $90^\\circ$.` },
        { judul: 'Kapasitor', isi: `Dari $i = C\\,dv/dt$, didapat $\\mathbf{V} = \\dfrac{1}{j\\omega C}\\mathbf{I} = -j\\dfrac{1}{\\omega C}\\mathbf{I}$. Impedansinya $Z_C = -j/(\\omega C)$ dan reaktansinya $X_C = -1/(\\omega C)$. Tegangan tertinggal arus sebesar $90^\\circ$.` },
        { judul: 'Cara mengingat', isi: `Pakai singkatan "ELI the ICEman": pada induktor (L) tegangan (E) mendahului arus (I), sedangkan pada kapasitor (C) arus (I) mendahului tegangan (E).` },
      ],
      contoh: `Induktor 20 mH dengan arus $i = 10\\cos(10000t + 30^\\circ)$ mA.
        <ul><li>$X_L = \\omega L = 10^4 \\cdot 20\\cdot 10^{-3} = 200\\ \\Omega$, jadi $Z_L = j200\\ \\Omega$.</li>
        <li>$\\mathbf{V}_L = j200 \\cdot 10\\angle 30^\\circ \\cdot 10^{-3} = 2\\angle 120^\\circ$ V.</li>
        <li>$v_L(t) = 2\\cos(10000t + 120^\\circ)$ V. Sudut 120° berarti tegangan 90° di depan arus.</li></ul>`,
      alat: alatElemen,
      latihan: [
        { q: 'Kapasitor 5 µF pada ω = 4000 rad/s. Berapa $Z_C$?', a: '$Z_C = -j/(4000\\cdot 5\\cdot 10^{-6}) = -j50\\ \\Omega$.' },
        { q: 'Apakah arus mendahului atau tertinggal dari tegangan pada kapasitor?', a: 'Arus mendahului tegangan sebesar 90°.' },
      ],
    },
    {
      id: 'impedansi', judul: 'Impedansi, seri, paralel, dan pembagi',
      ringkas: 'Impedansi dan admitansi, cara menggabungkan seri dan paralel, serta pembagi tegangan dan arus.',
      bagian: [
        { judul: 'Impedansi', isi: `Impedansi $Z = \\mathbf{V}/\\mathbf{I}$ dalam Ω. Bagian nyatanya adalah resistansi, dan bagian khayalnya disebut reaktansi. $Z = R + jX$.` },
        { judul: 'Seri dan paralel', isi: `Seri: $Z_{ekv} = Z_1 + Z_2 + \\cdots$. Paralel: $\\dfrac{1}{Z_{ekv}} = \\dfrac{1}{Z_1} + \\dfrac{1}{Z_2} + \\cdots$. Admitansi $Y = 1/Z = G + jB$ dalam siemens memudahkan perhitungan paralel.` },
        { judul: 'Pembagi tegangan dan arus', isi: `Pembagi tegangan (seri): $\\mathbf{V}_k = \\mathbf{V}\\dfrac{Z_k}{\\sum Z}$. Pembagi arus (dua cabang paralel): $\\mathbf{I}_1 = \\mathbf{I}\\dfrac{Z_2}{Z_1+Z_2}$. Pembagi hanya berlaku untuk bentuk yang sesuai, jadi cek dulu strukturnya.` },
      ],
      contoh: `Resistor 90 Ω, induktor 32 mH, dan kapasitor 5 µF seri, dengan $\\omega = 5000$ rad/s dan $\\mathbf{V}_s = 750\\angle 30^\\circ$ V.
        <ul><li>$Z_L = j160\\ \\Omega$ dan $Z_C = -j40\\ \\Omega$.</li>
        <li>$Z_{ab} = 90 + j160 - j40 = 90 + j120 = 150\\angle 53{,}13^\\circ\\ \\Omega$.</li>
        <li>$\\mathbf{I} = \\dfrac{750\\angle 30^\\circ}{150\\angle 53{,}13^\\circ} = 5\\angle -23{,}13^\\circ$ A, jadi $i(t) = 5\\cos(5000t - 23{,}13^\\circ)$ A.</li></ul>`,
      alat: alatSeriParalel,
      latihan: [
        { q: 'Resistor 10 Ω paralel dengan $j10\\,\\Omega$. Berapa impedansi ekivalennya?', a: '$Z = \\dfrac{(10)(j10)}{10+j10} = 5 + j5\\ \\Omega$.' },
        { q: 'Sumber 100∠0° V diberikan ke $Z_1 = 3\\,\\Omega$ seri $Z_2 = j4\\,\\Omega$. Berapa tegangan di $Z_2$?', a: '$\\mathbf{V}_2 = 100\\dfrac{j4}{3+j4} = 64 + j48 = 80\\angle 36{,}87^\\circ$ V.' },
      ],
    },
    {
      id: 'kirchhoff', judul: 'Hukum Kirchhoff di domain frekuensi',
      ringkas: 'KVL dan KCL tetap berlaku, tetapi semua besaran ditulis sebagai fasor.',
      bagian: [
        { judul: 'KVL dan KCL', isi: `Jumlah tegangan dalam satu loop sama dengan nol: $\\sum \\mathbf{V}_k = 0$. Jumlah arus di sebuah simpul sama dengan nol: $\\sum \\mathbf{I}_k = 0$. Keduanya berlaku untuk fasor dengan frekuensi yang sama.` },
        { judul: 'Urutan kerja', isi: `1) Ubah semua sumber ke fasor. 2) Hitung reaktansi dan impedansi. 3) Tulis KVL atau KCL. 4) Selesaikan sistem persamaan kompleks. 5) Ubah hasil kembali ke waktu.` },
        { judul: 'Jebakan umum', isi: `Jangan menjumlahkan tegangan dengan frekuensi berbeda sebagai fasor. Periksa arah referensi arus dan polaritas tegangan sebelum menulis persamaan.` },
      ],
      contoh: null,
      alat: null,
      latihan: [
        { q: 'Dalam satu loop ada $\\mathbf{V}_1 = 10\\angle 0^\\circ$ V dan $\\mathbf{V}_2 = 10\\angle 180^\\circ$ V. Berapa $\\mathbf{V}_1 + \\mathbf{V}_2$?', a: '$0$. Kedua tegangan saling meniadakan.' },
      ],
    },
    {
      id: 'thevenin', judul: 'Transformasi sumber, Thévenin, dan Norton',
      ringkas: 'Cara mengubah sumber tegangan menjadi sumber arus dan sebaliknya, serta ekuivalen Thévenin dan Norton.',
      bagian: [
        { judul: 'Transformasi sumber', isi: `Sumber tegangan $\\mathbf{V}_s$ seri $Z_s$ setara dengan sumber arus $\\mathbf{I}_s = \\mathbf{V}_s/Z_s$ paralel $Z_s$. Transformasi ini berlaku dua arah dan hanya mengubah bentuk, bukan hasil di terminal.` },
        { judul: 'Thévenin', isi: `$\\mathbf{V}_{Th}$ adalah tegangan terbuka di terminal $a$–$b$. $\\mathbf{Z}_{Th} = \\mathbf{V}_{Th}/\\mathbf{I}_{sc}$, dengan $\\mathbf{I}_{sc}$ arus saat $a$–$b$ dihubung singkat.` },
        { judul: 'Norton', isi: `Norton memakai $\\mathbf{I}_N = \\mathbf{I}_{sc}$ dan $\\mathbf{Z}_N = \\mathbf{Z}_{Th}$. Keduanya bisa saling diubah dengan transformasi sumber.` },
        { judul: 'Sumber tak-bebas', isi: `Jika ada sumber tak-bebas, jangan dimatikan. Pakai $\\mathbf{V}_{Th}/\\mathbf{I}_{sc}$ atau pasang sumber uji di $a$–$b$ untuk mendapatkan $\\mathbf{Z}_{Th}$.` },
      ],
      contoh: null,
      alat: null,
      latihan: [
        { q: 'Sumber $\\mathbf{V}_s = 40\\angle 0^\\circ$ V seri $Z_s = 4\\,\\Omega$. Berapa sumber arus ekivalennya?', a: '$\\mathbf{I}_s = 40/4 = 10\\angle 0^\\circ$ A, paralel $4\\,\\Omega$.' },
      ],
    },
    {
      id: 'simpul', judul: 'Tegangan simpul dan arus mesh',
      ringkas: 'Dua cara sistematis untuk rangkaian yang lebih rumit.',
      bagian: [
        { judul: 'Tegangan simpul', isi: `Pilih satu simpul sebagai acuan. Tulis KCL di setiap simpul lain dalam bentuk admitansi. Simpul yang langsung dihubungkan ke sumber tegangan tetap sudah diketahui tegangannya, jadi tidak perlu persamaan untuknya. Cocok bila jumlah simpul sedikit.` },
        { judul: 'Arus mesh', isi: `Beri arus loop searah jarum jam, lalu tulis KVL untuk tiap mesh. Arus yang bersama dua mesh dihitung sebagai selisih. Cocok bila jumlah loop sedikit dan sumbernya berupa tegangan.` },
        { judul: 'Sumber tak-bebas', isi: `Pada kedua metode, sumber tak-bebas diperlakukan seperti sumber biasa, tetapi nilainya dinyatakan dalam variabel kendalinya. Setelah itu tambahkan persamaan yang menghubungkan variabel kendali dengan besaran lain.` },
      ],
      contoh: null,
      alat: null,
      latihan: [
        { q: 'Simpul A hanya terhubung ke sumber tegangan 10 V dan ke acuan lewat $5\\,\\Omega$. Apakah simpul A perlu persamaan?', a: 'Tidak. Simpul yang langsung menempel ke sumber tegangan dengan acuan sudah tetap.' },
      ],
    },
  ];

  /* ---------- render ---------- */
  function render(host, bagian) {
    const kepala = bagian && bagian[0];
    if (kepala === 'contoh') return renderContohRute(host, bagian[1]);
    if (kepala === 'ujian') return renderUjian(host);
    if (kepala === 'glosarium') return renderGlosarium(host);
    const idx = kepala ? PELAJARAN.findIndex((p) => p.id === kepala) : -1;
    if (idx < 0) return renderDaftar(host);
    renderPelajaran(host, idx);
  }

  function renderDaftar(host) {
    host.innerHTML = `
      <h1>Penjelasan materi Bab 9</h1>
      <div class="kartu">
        <h3>Mulai dari sini</h3>
        <p>Ujian Kamis pukul 08.00 hanya satu soal, tetapi soalnya bisa berasal dari bab ini. Urutan belajar yang disarankan:</p>
        <ol class="langkah-peta">
          <li>Penjelasan materi bagian 1 sampai 3 (sinus, fasor, elemen R/L/C).</li>
          <li><a href="#/materi/contoh">Contoh terbimbing</a>, mulai dari contoh 1.</li>
          <li><a href="#/materi/ujian">Panduan ujian</a> dan daftar periksa.</li>
        </ol>
        <p class="muted"><a href="#/materi/glosarium">Glosarium</a> bisa dibuka kapan saja.</p>
      </div>

      <h2>Penjelasan materi</h2>
      <p class="muted">Setiap bagian menjelaskan satu gagasan dengan kata-kata sendiri, lalu memberi contoh dan latihan singkat. Alat bantu interaktif bisa diubah nilainya untuk melihat efeknya.</p>
      <div class="grid-soal">${PELAJARAN.map((p, i) => `
        <a class="kartu kartu-soal" href="#/materi/${p.id}">
          <div class="nomor">BAGIAN ${i + 1}</div>
          <h3>${esc(p.judul)}</h3>
          <p class="muted">${esc(p.ringkas)}</p>
        </a>`).join('')}</div>

      <h2 style="margin-top:1.4rem">Contoh terbimbing</h2>
      <p class="muted">Contoh dari materi dosen, dikerjakan satu langkah per klik. Angkanya dicek ulang dengan solver.</p>
      <div class="grid-soal">${CONTOH.map((c, i) => `
        <a class="kartu kartu-soal" href="#/materi/contoh/${c.id}">
          <div class="nomor">CONTOH ${i + 1}</div>
          <h3>${esc(c.judul)}</h3>
        </a>`).join('')}</div>`;
    math(host);
  }

  function renderPelajaran(host, idx) {
    const p = PELAJARAN[idx];
    const prev = idx > 0 ? PELAJARAN[idx - 1] : null;
    const next = idx < PELAJARAN.length - 1 ? PELAJARAN[idx + 1] : null;
    host.innerHTML = `
      <div class="nomor">BAGIAN ${idx + 1} DARI ${PELAJARAN.length}</div>
      <h1>${esc(p.judul)}</h1>
      <p class="muted">${esc(p.ringkas)}</p>

      ${p.bagian.map((b) => `
        <div class="kartu">
          <h3>${esc(b.judul)}</h3>
          <div class="isi-materi">${b.isi}</div>
        </div>`).join('')}

      ${p.contoh ? `<div class="kartu"><h3>Contoh</h3><div class="isi-materi">${p.contoh}</div></div>` : ''}

      ${p.alat ? `<div class="kartu"><h3>Coba sendiri</h3><div id="alat-host"></div></div>` : ''}

      <div class="kartu">
        <h3>Latihan singkat</h3>
        <p class="muted">Coba jawab di kertas dulu, lalu buka jawabannya.</p>
        ${p.latihan.map((l, i) => `
          <div class="latihan" data-i="${i}">
            <div class="isi-materi">${l.q}</div>
            <button type="button" class="tombol buka-jawab">Lihat jawaban</button>
            <div class="jawaban isi-materi" hidden>${l.a}</div>
          </div>`).join('')}
      </div>

      <div class="baris-nav">
        ${prev ? `<a class="tombol" href="#/materi/${prev.id}">← ${esc(prev.judul)}</a>` : '<span></span>'}
        ${next ? `<a class="tombol utama" href="#/materi/${next.id}">${esc(next.judul)} →</a>` : `<a class="tombol" href="#/materi">Kembali ke daftar</a>`}
      </div>`;

    if (p.alat) p.alat(host.querySelector('#alat-host'));
    host.querySelectorAll('.buka-jawab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const jawab = btn.parentElement.querySelector('.jawaban');
        jawab.hidden = !jawab.hidden;
        btn.textContent = jawab.hidden ? 'Lihat jawaban' : 'Sembunyikan jawaban';
        math(jawab);
      });
    });
    math(host);
  }

  /* ---------- contoh terbimbing: satu langkah per klik ---------- */
  function renderContohRute(host, id) {
    const c = (typeof CONTOH !== 'undefined' ? CONTOH : []).find((x) => x.id === id);
    if (!c) return renderContohDaftar(host);
    const r = c.hitung();
    const langkah = c.langkah(r);
    const idx = CONTOH.indexOf(c);
    const sebelum = idx > 0 ? CONTOH[idx - 1] : null;
    const sesudah = idx < CONTOH.length - 1 ? CONTOH[idx + 1] : null;
    let tampil = 1; // jumlah langkah yang sudah terbuka

    host.innerHTML = `
      <div class="nomor">CONTOH ${idx + 1} DARI ${CONTOH.length}</div>
      <h1>${esc(c.judul)}</h1>
      <div class="kartu">
        <h3>Soal</h3>
        <div class="isi-materi">$${c.soal}$</div>
      </div>
      <div class="kartu">
        <h3>Gambar rangkaian</h3>
        <p class="muted">Gambar ini dibuat ulang dari nol sesuai soal. Nilai pada label adalah nilai yang diberikan soal.</p>
        <svg id="contoh-gambar" viewBox="0 0 600 400" class="grafik"></svg>
      </div>
      <div class="kartu">
        <div class="stepper-atas">
          <h3 id="contoh-judul-langkah" style="margin:0"></h3>
          <span class="muted" id="contoh-posisi"></span>
        </div>
        <div id="contoh-langkah"></div>
        <p class="muted" style="margin-top:.6rem">Coba tulis langkah berikutnya di kertas dulu. Setelah itu klik lanjut.</p>
        <div class="baris-nav">
          <button type="button" class="tombol" id="contoh-mundur">← Sebelumnya</button>
          <button type="button" class="tombol utama" id="contoh-maju">Langkah berikutnya →</button>
        </div>
      </div>
      <div class="kartu" id="contoh-selesai" hidden>
        <h3>Pelajaran dari contoh ini</h3>
        <ul class="daftar">${c.pelajaran.map((x) => `<li>${x}</li>`).join('')}</ul>
        <p class="muted" style="margin-top:.6rem">Hasil dihitung ulang oleh solver dan sudah dicocokkan dengan jawaban dosen.</p>
      </div>
      <div class="baris-nav">
        ${sebelum ? `<a class="tombol" href="#/materi/contoh/${sebelum.id}">← ${esc(sebelum.judul)}</a>` : `<a class="tombol" href="#/materi">Kembali ke materi</a>`}
        ${sesudah ? `<a class="tombol" href="#/materi/contoh/${sesudah.id}">${esc(sesudah.judul)} →</a>` : `<a class="tombol" href="#/materi/ujian">Panduan ujian →</a>`}
      </div>`;

    const gambarEl = host.querySelector('#contoh-gambar');
    if (window.gambarRangkaian) {
      window.gambarRangkaian(gambarEl, {
        pos: c.pos, ground: c.ground,
        display: () => [{ omega: null, elements: c.elements() }],
      }, true);
    }

    const tampilkan = () => {
      const daftar = host.querySelector('#contoh-langkah');
      const aktif = langkah[tampil - 1];
      host.querySelector('#contoh-judul-langkah').textContent = `Langkah ${tampil}: ${aktif.j}`;
      host.querySelector('#contoh-posisi').textContent = `${tampil} dari ${langkah.length}`;
      daftar.innerHTML = `<div class="isi-materi">${aktif.t}</div>`;
      host.querySelector('#contoh-mundur').disabled = tampil === 1;
      host.querySelector('#contoh-maju').textContent = tampil === langkah.length ? 'Selesai' : 'Langkah berikutnya →';
      host.querySelector('#contoh-selesai').hidden = tampil < langkah.length;
      math(host);
    };
    host.querySelector('#contoh-maju').addEventListener('click', () => {
      if (tampil < langkah.length) tampil++;
      tampilkan();
    });
    host.querySelector('#contoh-mundur').addEventListener('click', () => {
      if (tampil > 1) tampil--;
      tampilkan();
    });
    tampilkan();
  }

  function renderContohDaftar(host) {
    host.innerHTML = `
      <h1>Contoh terbimbing</h1>
      <p class="muted">Setiap contoh dikerjakan satu langkah per klik. Coba tulis langkah berikutnya sendiri sebelum melihatnya. Mulai dari contoh 1 kalau kamu belum terbiasa dengan tegangan simpul.</p>
      <div class="grid-soal">${CONTOH.map((c, i) => `
        <a class="kartu kartu-soal" href="#/materi/contoh/${c.id}">
          <div class="nomor">CONTOH ${i + 1}</div>
          <h3>${esc(c.judul)}</h3>
        </a>`).join('')}</div>`;
    math(host);
  }

  /* ---------- panduan ujian ---------- */
  const KUNCI_UJIAN = 'rl-ujian-cek';
  const cekBaca = () => { try { return JSON.parse(localStorage.getItem(KUNCI_UJIAN) || '[]'); } catch (e) { return []; } };
  const cekTulis = (v) => { try { localStorage.setItem(KUNCI_UJIAN, JSON.stringify(v)); } catch (e) { /* abaikan */ } };

  const DAFTAR_UJIAN = [
    'Ubah semua sinus ke kosinus sebelum apa pun (sin θ = cos(θ − 90°)).',
    'Hitung ω, lalu X_L = ωL dan X_C = −1/(ωC). Kapasitor selalu negatif.',
    'Ubah ke fasor dan tulis impedansi: R, jωL, −j/(ωC).',
    'Pilih metode: seri–paralel (tanpa sumber tak-bebas), tegangan simpul (sedikit simpul), mesh (sedikit loop), Thévenin (ditanya Z atau V di terminal).',
    'Kalau ada sumber tak-bebas: jangan dimatikan kecuali untuk mencari Z dengan sumber uji.',
    'Hitung dalam bentuk rektangular, lalu ubah ke polar untuk hasil akhir. Periksa kuadran sudut.',
    'Ubah hasil kembali ke bentuk kosinus: |V|cos(ωt + θ).',
    'Cek: substitusi balik ke persamaan awal, atau jumlahkan arus/tegangan.',
  ];

  const KESALAHAN = [
    'Lupa mengubah sinus ke kosinus, sehingga sudut melenceng 90°.',
    'Menulis kapasitor sebagai +j. Kapasitor selalu −j/(ωC).',
    'Menjumlahkan fasor dengan frekuensi berbeda.',
    'Mematikan sumber tak-bebas padahal hanya boleh dimatikan sumber bebas.',
    'Lupa satuan: mA dan Ω tidak boleh dicampur.',
    'Lupa kuadran saat memakai tan⁻¹ pada kalkulator.',
  ];

  function renderUjian(host) {
    const sudah = cekBaca();
    host.innerHTML = `
      <h1>Panduan ujian Kamis</h1>
      <p class="muted">Ujiannya singkat, kira-kira satu soal, dengan materi dari satu bab yang sama. Yang dilatih di sini adalah langkah yang sama untuk semua soal, supaya kamu tidak perlu mengingat jawaban.</p>

      <div class="kartu">
        <h3>Rencana tiga hari</h3>
        <ul class="daftar">
          <li><b>Selasa (hari ini):</b> baca Penjelasan materi bagian 1–3, lalu Contoh 1 dan 2. Ikuti langkahnya pelan-pelan.</li>
          <li><b>Rabu:</b> Contoh 3–5. Tutup layar, lalu tulis ulang tiap langkah di kertas tanpa melihat.</li>
          <li><b>Kamis pagi (15 menit):</b> baca Kesalahan umum dan daftar periksa di bawah, lalu kerjakan satu contoh dari awal.</li>
        </ul>
      </div>

      <div class="kartu">
        <h3>Daftar periksa setiap soal</h3>
        <p class="muted">Centang setiap langkah yang sudah kamu kuasai. Centang tersimpan di browser ini.</p>
        ${DAFTAR_UJIAN.map((t, i) => `
          <label class="cek-baris"><input type="checkbox" data-i="${i}" ${sudah.includes(i) ? 'checked' : ''}> ${t}</label>`).join('')}
        <p class="muted" style="margin-top:.6rem"><b>${sudah.length}</b> dari ${DAFTAR_UJIAN.length} sudah dicentang.</p>
      </div>

      <div class="kartu">
        <h3>Kesalahan yang paling sering</h3>
        <ul class="daftar">${KESALAHAN.map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>

      <div class="kartu">
        <h3>Tipe soal dan contoh yang mirip</h3>
        <ul class="daftar">
          <li>Tegangan simpul dengan sumber tak-bebas → <a href="#/materi/contoh/node">Contoh 1</a></li>
          <li>Arus mesh dengan dua loop → <a href="#/materi/contoh/mesh">Contoh 2</a></li>
          <li>Thévenin dengan sumber tak-bebas → <a href="#/materi/contoh/thevenin">Contoh 3</a></li>
          <li>Transformasi sumber → <a href="#/materi/contoh/transformasi">Contoh 4</a></li>
          <li>Cabang paralel dan pembagi arus → <a href="#/materi/contoh/paralel">Contoh 5</a></li>
          <li>Soal dengan satu sinus dan impedansi → <a href="#/materi/impedansi">Impedansi dan pembagi</a></li>
        </ul>
      </div>`;

    host.querySelectorAll('input[type=checkbox]').forEach((el) => {
      el.addEventListener('change', () => {
        const i = Number(el.dataset.i);
        const sekarang = cekBaca().filter((x) => x !== i);
        if (el.checked) sekarang.push(i);
        cekTulis(sekarang);
        renderUjian(host);
      });
    });
    math(host);
  }

  /* ---------- glosarium ---------- */
  const GLOSARIUM = [
    ['Fasor', 'Bilangan kompleks yang menyimpan amplitudo dan sudut fasa dari sinus dengan satu frekuensi tertentu.'],
    ['Amplitudo (V_m)', 'Nilai puncak sinus. Nilai rms-nya adalah V_m dibagi √2.'],
    ['Sudut fasa (φ)', 'Pergeseran sinus terhadap t = 0, dinyatakan dalam derajat.'],
    ['Frekuensi sudut (ω)', 'Kecepatan sudut dalam rad/s. ω = 2πf.'],
    ['Reaktansi (X)', 'Bagian khayal dari impedansi. X_L = ωL, X_C = −1/(ωC).'],
    ['Impedansi (Z)', 'Perbandingan fasor tegangan terhadap fasor arus: Z = V/I. Bentuknya R + jX.'],
    ['Admitansi (Y)', 'Kebalikan impedansi: Y = 1/Z. Dipakai saat menghitung paralel.'],
    ['Simpul', 'Titik pertemuan dua atau lebih elemen.'],
    ['Acuan', 'Simpul yang dianggap bertegangan nol. Biasanya rel bawah.'],
    ['Loop dan mesh', 'Jalur tertutup dalam rangkaian. Mesh adalah loop yang tidak memuat loop lain di dalamnya.'],
    ['KCL', 'Jumlah arus yang masuk ke sebuah simpul sama dengan jumlah yang keluar.'],
    ['KVL', 'Jumlah tegangan dalam satu loop tertutup sama dengan nol.'],
    ['Sumber tak-bebas', 'Sumber yang nilainya bergantung pada tegangan atau arus di bagian lain rangkaian.'],
    ['Sumber uji', 'Sumber arus atau tegangan kecil yang dipasang di terminal untuk mengukur impedansi.'],
    ['Thévenin', 'Rangkaian sederhana sumber tegangan seri impedansi yang setara dengan rangkaian asli dilihat dari dua terminal.'],
    ['Norton', 'Rangkaian sederhana sumber arus paralel impedansi yang setara dengan rangkaian asli.'],
  ];

  function renderGlosarium(host) {
    host.innerHTML = `
      <h1>Glosarium</h1>
      <p class="muted">Istilah yang sering muncul, dijelaskan singkat dengan kata-kata sendiri.</p>
      <div class="kartu">
        <dl class="glosarium">
          ${GLOSARIUM.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}
        </dl>
      </div>`;
  }

  window.Materi = { render, PELAJARAN };
})();
