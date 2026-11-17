/*
 * Antarmuka: peta belajar, halaman per soal (gambar rangkaian + animasi
 * arus sesaat + langkah), dan halaman kunci verifikasi.
 */
(function () {
  'use strict';

  const { C, run, fmt } = Solver;
  const app = document.getElementById('app');
  const NS = 'http://www.w3.org/2000/svg';
  const VIEW_W = 600, VIEW_H = 400;
  let stopAnim = null;

  /* ---------- util ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svgEl = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const cplx = (z) => fmt.rect(z);
  const polar = (z) => fmt.polar(z);

  function outsMap(outs) {
    const m = {};
    for (const o of outs) m[o.key] = o;
    return m;
  }

  /* ---------- peta belajar ---------- */
  function viewPeta() {
    app.innerHTML = `
      <h1>Cara mempelajari Bab 9</h1>
      <p class="muted">Semua soal Bab 9 diselesaikan dengan pola yang sama. Yang berbeda hanya metode yang dipakai di tiap langkah. Halaman ini merangkum polanya, lalu soal-soal di bawah menunjukkan penerapannya.</p>

      <div class="kartu">
        <h2>Enam langkah untuk setiap soal</h2>
        <ol class="langkah-peta">
          <li><b>Tandai frekuensi dan ubah sumber ke fasor.</b> Ambil ω dari sumber. Kalau sumbernya sinus, ubah dulu ke kosinus (sin θ = cos(θ − 90°)), lalu tulis sebagai fasor besar∠sudut.</li>
          <li><b>Ubah semua elemen ke impedansi.</b> R tetap R. Induktor menjadi jωL. Kapasitor menjadi −j/(ωC). Kapasitor selalu negatif di bagian khayal.</li>
          <li><b>Pilih metode sesuai bentuk rangkaian.</b> Lihat tabel di bawah. Jangan memakai metode yang rumit kalau ada cara yang lebih pendek.</li>
          <li><b>Hitung dalam bentuk kompleks.</b> Pecahan dikalikan konjugatnya. Untuk pembagian besar, bagi besar dan kurangi sudut.</li>
          <li><b>Kembalikan ke waktu.</b> Fasor besar∠θ menjadi besar·cos(ωt + θ). Kalau soalnya minta v(t), jangan berhenti di fasor.</li>
          <li><b>Periksa.</b> Substitusi hasil ke persamaan awal. Cek satuan, dan cek kuadran sudut. Di halaman tiap soal ada animasi arus untuk melihat apakah arahnya masuk akal.</li>
        </ol>
      </div>

      <div class="kartu">
        <h2>Tipe soal dan metode yang dipakai</h2>
        <table class="peta-tabel">
          <tr><th>Tipe rangkaian</th><th>Metode</th><th>Tanda untuk memilihnya</th></tr>
          <tr><td>Seri atau paralel murni</td><td>Reduksi seri–paralel</td><td>Tidak ada sumber tak-bebas, dan tidak ada cabang yang saling bersambung lewat kawat tengah.</td></tr>
          <tr><td>Banyak simpul, sedikit sumber</td><td>Tegangan simpul (node-voltage)</td><td>Ada satu atau dua simpul tak diketahui. Pilih rel bawah sebagai acuan.</td></tr>
          <tr><td>Banyak loop seri</td><td>Arus mesh</td><td>Sumber tegangan berada di loop. Gunakan arus mesh searah jarum jam.</td></tr>
          <tr><td>Ada sumber tak-bebas</td><td>Sumber uji 1 A atau Vth/Isc</td><td>Jangan matikan sumber tak-bebas. Pasang sumber uji di terminal dan ukur V/I.</td></tr>
          <tr><td>Ditanya ekuivalen</td><td>Thévenin atau Norton</td><td>Soal meminta Vth, Isc, Zth, atau IN dan ZN.</td></tr>
          <tr><td>Dua sumber, dua frekuensi</td><td>Superposisi</td><td>Koefisien t berbeda. Jangan gabungkan jadi satu fasor.</td></tr>
          <tr><td>Satu loop tanpa cabang</td><td>Pembagi tegangan</td><td>Semua elemen dalam satu arus. Tegangan diambil di antara dua blok seri.</td></tr>
        </table>
      </div>

      <div class="kartu">
        <h2>Daftar soal</h2>
        <p class="muted">Klik salah satu soal untuk melihat langkah, animasi rangkaian, dan hasilnya.</p>
        ${gridSoal()}
      </div>
    `;
    setTab('peta');
  }

  function gridSoal() {
    return `<div class="grid-soal">${PROBLEMS.map((p, i) => `
      <a class="kartu kartu-soal" href="#/soal/${encodeURIComponent(p.id)}">
        <div class="nomor">SOAL ${i + 1} · ${esc(p.id)}</div>
        <h3>${esc(p.judul)}</h3>
        <div><span class="chip">${esc(p.tipe)}</span></div>
      </a>`).join('')}</div>`;
  }

  function viewDaftarSoal() {
    app.innerHTML = `
      <h1>Soal 1–14</h1>
      <p class="muted">Setiap soal punya langkah yang bisa diikuti satu per satu, rangkaian animasi, dan hasil yang sudah dicek.</p>
      ${gridSoal()}`;
    setTab('soal');
  }

  /* ---------- kunci verifikasi ---------- */
  function viewKunci() {
    let rows = '';
    let semua = 0, cocok = 0;
    for (const p of PROBLEMS) {
      let outs = [];
      let err = null;
      try { outs = p.analyze(); } catch (e) { err = e.message; }
      if (err) {
        rows += `<tr><td>${esc(p.id)}</td><td>${esc(p.judul)}</td><td colspan="3" class="beda">Galat: ${esc(err)}</td></tr>`;
        semua++;
        continue;
      }
      for (const o of outs) {
        const exp = p.expect[o.key];
        semua++;
        if (!exp) {
          rows += `<tr><td>${esc(p.id)}</td><td>${esc(o.label)}</td><td class="mono">${esc(cplx(o.z))}</td><td class="muted">belum ada kunci</td><td></td></tr>`;
          continue;
        }
        const relErr = C.abs(C.sub(o.z, exp)) / Math.max(C.abs(exp), 1e-12);
        const ok = relErr < 0.01;
        if (ok) cocok++;
        rows += `<tr>
          <td>${esc(p.id)}</td>
          <td>${esc(o.label)}</td>
          <td class="mono">${esc(cplx(otomatis(o.z, o.unit).z))} ${esc(otomatis(o.z, o.unit).unit)}<br><span class="muted">${esc(polar(otomatis(o.z, o.unit).z))}</span></td>
          <td class="mono">${esc(cplx(otomatis(exp, o.unit).z))} ${esc(otomatis(exp, o.unit).unit)}<br><span class="muted">${esc(polar(otomatis(exp, o.unit).z))}</span></td>
          <td class="${ok ? 'ok' : 'beda'}">${ok ? 'cocok' : 'beda'} <span class="muted">(${(relErr * 100).toFixed(2)}%)</span></td>
        </tr>`;
      }
    }
    app.innerHTML = `
      <h1>Kunci verifikasi</h1>
      <p class="muted">Setiap hasil dihitung ulang oleh solver di browser, lalu dibandingkan dengan kunci jawaban dari buku soal. Selisih di bawah 1% dianggap cocok.</p>
      <div class="kartu">
        <p><b>${cocok} dari ${semua}</b> hasil cocok dengan kunci.</p>
        <table>
          <tr><th>Soal</th><th>Besaran</th><th>Hasil solver</th><th>Kunci buku</th><th>Status</th></tr>
          ${rows}
        </table>
      </div>`;
    setTab('kunci');
  }

  /* ---------- halaman satu soal ---------- */
  function viewSoal(id, indeks) {
    const p = PROBLEMS.find((q) => q.id === id);
    if (!p) { app.innerHTML = `<p>Soal tidak ditemukan.</p>`; return; }
    const nomor = PROBLEMS.indexOf(p) + 1;
    const outs = p.analyze();
    const om = outsMap(outs);
    const steps = p.steps(om);
    const step = indeks ?? 0;

    app.innerHTML = `
      <div class="soal-atas">
        <span class="nomor">SOAL ${nomor} · ${esc(p.id)}</span>
        <h1 style="margin:0">${esc(p.judul)}</h1>
      </div>
      <div style="margin-bottom:1rem"><span class="chip">${esc(p.tipe)}</span>${p.labelOmega ? `<span class="chip">${esc(p.labelOmega)}</span>` : p.omega ? `<span class="chip">ω = ${p.omega} rad/s</span>` : `<span class="chip">impedansi tanpa frekuensi tertentu</span>`}</div>
      <p class="muted" style="max-width:52rem">${esc(p.ringkas)}</p>

      <div class="soal-dua" style="margin-top:1rem">
        <div>
          <div class="panel-rangkaian">
            <svg id="gambar" viewBox="0 0 ${VIEW_W} ${VIEW_H}" role="img" aria-label="Gambar rangkaian ${esc(p.id)} dengan animasi arus"></svg>
            <div class="kontrol">
              <button id="putar" type="button">Jeda</button>
              <label>Kecepatan <input id="kecepatan" type="range" min="0.1" max="2" step="0.1" value="1"></label>
              <label><input id="label" type="checkbox" checked> Tampilkan label</label>
            </div>
            <div class="catatan-animasi">Titik bergerak mengikuti arah arus sesaat: maju saat arus positif, mundur saat negatif. Animasi diperlambat, bentuk gelombangnya tetap sama dengan hasil fasor.</div>
          </div>
          <div class="kartu" style="margin-top:1rem">
            <h3>Hasil</h3>
            <div class="hasil-baris">${hasilHtml(p, outs)}</div>
          </div>
        </div>

        <div>
          <div class="kartu">
            <div class="stepper-atas">
              <h3 style="margin:0">Langkah ${step + 1} dari ${steps.length}</h3>
              <div class="titik" id="titik">${steps.map((_, i) => `<span class="${i === step ? 'aktif' : i < step ? 'lewat' : ''}"></span>`).join('')}</div>
            </div>
            <div class="langkah-judul" id="lj">${esc(steps[step].j)}</div>
            <div class="langkah-teks" id="lt">${esc(steps[step].t)}</div>
            <div class="baris-nav">
              <button class="tombol" id="sebelum" type="button" ${step === 0 ? 'disabled' : ''}>← Sebelumnya</button>
              <a class="tombol utama" href="#/soal/${encodeURIComponent(p.id)}/${Math.min(step + 2, steps.length)}" id="berikut" ${step === steps.length - 1 ? 'style="display:none"' : ''}>Berikutnya →</a>
              ${step === steps.length - 1 ? `<a class="tombol" href="#/soal">Kembali ke daftar</a>` : ''}
            </div>
          </div>

          <div class="kartu">
            <h3>Pelajaran dari soal ini</h3>
            <ul class="daftar">${p.pelajaran.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          </div>
          <div class="kartu">
            <h3>Jebakan yang sering terjadi</h3>
            <ul class="daftar jebakan">${p.jebakan.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          </div>
        </div>
      </div>`;

    setTab('soal');
    const back = document.getElementById('sebelum');
    if (back && !back.disabled) back.addEventListener('click', () => { location.hash = `#/soal/${encodeURIComponent(p.id)}/${step}`; });

    if (stopAnim) stopAnim();
    stopAnim = mulaiAnimasi(p, document.getElementById('gambar'));
  }

  // Arus di bawah 0,1 A ditampilkan dalam mA agar angkanya terbaca
  function otomatis(z, unit) {
    if (unit === 'A' && C.abs(z) < 0.1) return { z: C.scale(1000, z), unit: 'mA' };
    return { z, unit };
  }

  function hasilHtml(p, outs) {
    return outs.map((o) => {
      const { z, unit } = otomatis(o.z, o.unit);
      const baris = [];
      baris.push(`<span class="k">${esc(o.label)}</span><span class="v">${esc(o.kind === 'value' ? `${o.z.re.toFixed(3)} ${o.unit}` : cplx(z) + ' ' + unit)}</span>`);
      if (o.kind !== 'value') {
        baris.push(`<span class="k"></span><span class="v muted">${esc(polar(z))} ${esc(unit)}</span>`);
        if (o.omega) {
          const nama = `${o.label.replace(/ .*/, '')}(t) = `;
          baris.push(`<span class="k"></span><span class="v">${esc(fmt.time(z, o.omega, 2, nama))} ${esc(unit)}</span>`);
        }
      }
      return baris.join('');
    }).join('');
  }

  /* ---------- gambar & animasi ---------- */
  function ptsOf(e, pos) {
    const a = pos[e.a], b = pos[e.b];
    if (!a || !b) throw new Error(`Posisi simpul belum ada untuk ${e.id}`);
    return [a, ...(e.path || []), b];
  }

  function polylineInfo(pts) {
    const segs = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const len = Math.hypot(x2 - x1, y2 - y1);
      segs.push({ x1, y1, x2, y2, len, start: total });
      total += len;
    }
    return { segs, total };
  }

  function pointAt(info, s) {
    const d = Math.max(0, Math.min(1, s)) * info.total;
    for (const sg of info.segs) {
      if (d <= sg.start + sg.len || sg === info.segs[info.segs.length - 1]) {
        const t = sg.len === 0 ? 0 : (d - sg.start) / sg.len;
        return [sg.x1 + (sg.x2 - sg.x1) * t, sg.y1 + (sg.y2 - sg.y1) * t];
      }
    }
    return [info.segs[0].x1, info.segs[0].y1];
  }

  function longestSeg(info) {
    return info.segs.reduce((a, b) => (b.len > a.len ? b : a));
  }

  function gambarSimbol(parent, e, sg, info) {
    const mx = (sg.x1 + sg.x2) / 2, my = (sg.y1 + sg.y2) / 2;
    const ang = (Math.atan2(sg.y2 - sg.y1, sg.x2 - sg.x1) * 180) / Math.PI;
    const g = svgEl('g', { transform: `translate(${mx.toFixed(1)},${my.toFixed(1)}) rotate(${ang.toFixed(1)})`, class: 'simbol' }, parent);
    const stroke = { stroke: '#e6edf5', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' };

    if (e.kind === 'Z') {
      const z = e.z;
      if (z.im === 0) {
        // resistor: zigzag
        svgEl('polyline', { points: '-22,0 -16,0 -12,-6 -6,6 0,-6 6,6 12,-6 16,0 22,0', ...stroke }, g);
      } else if (z.re === 0 && z.im > 0) {
        // induktor: deretan busur
        svgEl('path', { d: 'M-24,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0', ...stroke }, g);
      } else if (z.re === 0 && z.im < 0) {
        // kapasitor: dua pelat
        svgEl('path', { d: 'M-22,0 L-4,0 M-4,-11 L-4,11 M4,-11 L4,11 M4,0 L22,0', ...stroke }, g);
      } else {
        svgEl('rect', { x: -22, y: -8, width: 44, height: 16, ...stroke }, g);
      }
    } else if (e.kind === 'V') {
      if (e.wire) return;
      svgEl('circle', { cx: 0, cy: 0, r: 13, ...stroke, fill: '#0f1b2a' }, g);
      svgEl('text', { x: -20, y: 4, fill: '#e6edf5', 'font-size': 11, 'text-anchor': 'middle' }, g).textContent = '+';
      svgEl('text', { x: 20, y: 4, fill: '#e6edf5', 'font-size': 11, 'text-anchor': 'middle' }, g).textContent = '−';
    } else if (e.kind === 'I') {
      svgEl('circle', { cx: 0, cy: 0, r: 13, ...stroke, fill: '#0f1b2a' }, g);
      svgEl('path', { d: 'M-8,0 L8,0 M2,-4 L8,0 L2,4', ...stroke }, g);
    } else {
      // sumber terkontrol: belah ketupat
      svgEl('polygon', { points: '0,-13 13,0 0,13 -13,0', ...stroke, fill: '#0f1b2a' }, g);
    }
  }

  function mulaiAnimasi(p, svg) {
    if (!svg) return () => {};
    svg.innerHTML = '';
    const pos = p.pos;

    // Gambar kawat dan simpul
    const kawatG = svgEl('g', {}, svg);
    const dotG = svgEl('g', {}, svg);
    const simbolG = svgEl('g', {}, svg);
    const labelG = svgEl('g', {}, svg);
    const simpulG = svgEl('g', {}, svg);

    const cases = p.display();
    const hasil = cases.map((c) => ({ omega: c.omega, elements: c.elements, s: run(c.elements, p.ground) }));

    // Kumpulkan arus tiap elemen dari semua kasus (superposisi per frekuensi)
    const wList = cases.map((c) => c.omega).filter((w) => w != null);
    const wmin = wList.length ? Math.min(...wList) : 1;
    const kScale = (2 * Math.PI * 0.25) / wmin; // 0,25 Hz untuk frekuensi terendah

    const comp = new Map();
    const elemIds = [];
    for (const h of hasil) {
      for (const e of h.elements) {
        if (!comp.has(e.id)) { comp.set(e.id, []); elemIds.push(e); }
        let I;
        try { I = h.s.cur(e.id); } catch (err) { I = C.c(0, 0); }
        comp.get(e.id).push({ wv: kScale * (h.omega ?? 1), I });
      }
    }

    // Pulihkan elemen unik untuk gambar
    const unik = [];
    const sudah = new Set();
    for (const e of hasil[0].elements) { if (!sudah.has(e.id)) { sudah.add(e.id); unik.push(e); } }
    for (const h of hasil.slice(1)) for (const e of h.elements) if (!sudah.has(e.id)) { sudah.add(e.id); unik.push(e); }

    // Amplitudo total tiap elemen (untuk normalisasi)
    let imax = 0;
    for (const id of comp.keys()) {
      const amp = comp.get(id).reduce((a, c) => a + C.abs(c.I), 0);
      imax = Math.max(imax, amp);
    }
    if (imax === 0) imax = 1;
    const skalaMA = imax < 0.1; // tampilkan mA bila arusnya kecil
    const satuan = skalaMA ? 'mA' : 'A';
    const pengali = skalaMA ? 1000 : 1;

    const instan = (id, tau) => {
      let s = 0;
      for (const c of comp.get(id) || []) {
        const ph = c.wv * tau;
        s += c.I.re * Math.cos(ph) - c.I.im * Math.sin(ph);
      }
      return s;
    };

    // Gambar kawat tiap elemen dan simbolnya
    const rec = [];
    for (const e of unik) {
      const pts = ptsOf(e, pos);
      const info = polylineInfo(pts);
      svgEl('polyline', {
        points: pts.map((q) => q.join(',')).join(' '),
        fill: 'none', stroke: e.wire ? '#3d4d61' : '#7d8fa6', 'stroke-width': e.wire ? 1.2 : 2,
        'stroke-linejoin': 'round',
      }, kawatG);
      if (!e.wire) {
        const sg = longestSeg(info);
        gambarSimbol(simbolG, e, sg, info);
      }
      // titik-titik arus
      const dots = [];
      const nd = 5;
      for (let j = 0; j < nd; j++) {
        const dot = svgEl('circle', { r: 3.2, fill: '#ffc35a' }, dotG);
        dots.push(dot);
      }
      // label arus
      const sg = longestSeg(info);
      const mx = (sg.x1 + sg.x2) / 2, my = (sg.y1 + sg.y2) / 2;
      const len = Math.hypot(sg.x2 - sg.x1, sg.y2 - sg.y1) || 1;
      const nx = -(sg.y2 - sg.y1) / len, ny = (sg.x2 - sg.x1) / len;
      const lbl = svgEl('text', {
        x: (mx + nx * 30).toFixed(1), y: (my + ny * 30 + 4).toFixed(1),
        fill: '#e6edf5', 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'ui-monospace, Consolas, monospace',
      }, labelG);
      lbl.textContent = e.id;
      const nama = svgEl('text', {
        x: (mx + nx * 30).toFixed(1), y: (my + ny * 30 + 16).toFixed(1),
        fill: '#9aa8b8', 'font-size': 10, 'text-anchor': 'middle',
      }, labelG);
      rec.push({ e, info, dots, lbl, nama, id: e.id });
    }

    // simpul
    const namaSimpul = new Set();
    for (const e of unik) { namaSimpul.add(e.a); namaSimpul.add(e.b); }
    for (const nm of namaSimpul) {
      const q = pos[nm];
      if (!q) continue;
      svgEl('circle', { cx: q[0], cy: q[1], r: 4, fill: '#e6edf5' }, simpulG);
      const t = svgEl('text', { x: q[0] + 7, y: q[1] - 7, fill: '#9aa8b8', 'font-size': 11 }, simpulG);
      t.textContent = nm === p.ground ? 'acuan' : nm;
    }

    // Pengaturan kontrol
    let tau = 0;
    let berjalan = true;
    let kecepatan = 1;
    let lastT = null;
    let rafId = null;
    const btnPutar = document.getElementById('putar');
    const sliderKec = document.getElementById('kecepatan');
    const cekLabel = document.getElementById('label');
    btnPutar.onclick = () => {
      berjalan = !berjalan;
      btnPutar.textContent = berjalan ? 'Jeda' : 'Putar';
      lastT = null;
    };
    sliderKec.oninput = () => { kecepatan = Number(sliderKec.value); };
    cekLabel.onchange = () => { labelG.style.display = cekLabel.checked ? '' : 'none'; };

    const frame = (now) => {
      if (lastT == null) lastT = now;
      const dt = Math.min(0.1, (now - lastT) / 1000);
      lastT = now;
      if (berjalan) tau += dt * kecepatan;

      // normalisasi nilai sesaat terhadap amplitudo terbesar
      for (const r of rec) {
        const i = instan(r.id, tau);
        const n = Math.max(-1, Math.min(1, i / imax));
        for (let j = 0; j < r.dots.length; j++) {
          const base = (j + 0.5) / r.dots.length;
          const s = Math.max(0.02, Math.min(0.98, base + 0.045 * n));
          const [x, y] = pointAt(r.info, s);
          r.dots[j].setAttribute('cx', x.toFixed(1));
          r.dots[j].setAttribute('cy', y.toFixed(1));
          r.dots[j].setAttribute('opacity', (0.35 + 0.65 * Math.min(1, Math.abs(n))).toFixed(2));
        }
        const iv = i * pengali;
        r.nama.textContent = `i = ${iv.toFixed(Math.abs(iv) < 10 ? 2 : 1)} ${satuan}`;
      }
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }

  /* ---------- router ---------- */
  function setTab(nama) {
    document.querySelectorAll('#tab a').forEach((a) => {
      a.classList.toggle('aktif', a.dataset.tab === nama);
    });
  }

  function rute() {
    const h = location.hash.replace(/^#\/?/, '');
    const bagian = h.split('/').filter(Boolean).map(decodeURIComponent);
    if (bagian[0] === 'soal' && bagian[1]) return { tipe: 'soal', id: bagian[1], indeks: bagian[2] ? Number(bagian[2]) - 1 : 0 };
    if (bagian[0] === 'soal') return { tipe: 'daftar' };
    if (bagian[0] === 'kunci') return { tipe: 'kunci' };
    return { tipe: 'peta' };
  }

  function render() {
    if (stopAnim) { stopAnim(); stopAnim = null; }
    const r = rute();
    if (r.tipe === 'peta') viewPeta();
    else if (r.tipe === 'daftar') viewDaftarSoal();
    else if (r.tipe === 'kunci') viewKunci();
    else viewSoal(r.id, r.indeks);
    window.scrollTo({ top: 0 });
  }

  window.addEventListener('hashchange', render);
  document.addEventListener('keydown', (e) => {
    if (rute().tipe !== 'soal') return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const p = PROBLEMS.find((q) => q.id === rute().id);
    if (!p) return;
    const idx = rute().indeks;
    const total = p.steps({}).length;
    if (e.key === 'ArrowRight' && idx < total - 1) { location.hash = `#/soal/${encodeURIComponent(p.id)}/${idx + 2}`; }
    if (e.key === 'ArrowLeft' && idx > 0) { location.hash = `#/soal/${encodeURIComponent(p.id)}/${idx}`; }
  });

  render();
})();
