/*
 * Antarmuka: peta belajar, halaman per soal (langkah dengan rumus,
 * mode latihan, penanda selesai), animasi rangkaian, timer fokus,
 * dan halaman kunci verifikasi.
 */
(function () {
  'use strict';

  const { C, run, fmt, tex: T } = Solver;
  const app = document.getElementById('app');
  const NS = 'http://www.w3.org/2000/svg';
  const VIEW_W = 600, VIEW_H = 400;
  let stopAnim = null;
  let idSoalTerakhir = null;
  let modeGambar = 'animasi'; // 'animasi' atau 'bersih'

  // Kartu soal: diketahui, ditanya, letak di PDF, dan slot gambar asli lokal
  function infoHtml(p) {
    const info = p.info;
    if (!info) return '';
    return `
      <div class="kartu info-soal">
        <div class="info-kolom">
          <h3>Diketahui</h3>
          <ul class="daftar">${info.diketahui.map((x) => `<li>${x}</li>`).join('')}</ul>
        </div>
        <div class="info-kolom">
          <h3>Ditanya</h3>
          <ul class="daftar">${info.ditanya.map((x) => `<li>${x}</li>`).join('')}</ul>
          <p class="muted info-hal">Soal asli ada di halaman ${info.hal} PDF buku soal.</p>
        </div>
        <div class="info-asli">
          <img src="asli/${encodeURIComponent(p.id)}.png" alt="Gambar soal asli ${esc(p.id)}" onerror="this.parentElement.remove()">
        </div>
      </div>`;
  }

  /* ---------- penyimpanan kecil di browser (dibungkus try/catch) ---------- */
  const simpan = {
    baca(kunci, nilai) {
      try { const v = localStorage.getItem(kunci); return v == null ? nilai : JSON.parse(v); } catch (e) { return nilai; }
    },
    tulis(kunci, nilai) {
      try { localStorage.setItem(kunci, JSON.stringify(nilai)); } catch (e) { /* abaikan */ }
    },
  };
  const KUNCI_SELESAI = 'rl-selesai';
  const KUNCI_LATIHAN = 'rl-latihan';
  const selesaiList = () => simpan.baca(KUNCI_SELESAI, []);
  const sudahSelesai = (id) => selesaiList().includes(id);

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
  const outsMap = (outs) => Object.fromEntries(outs.map((o) => [o.key, o]));

  // Render rumus LaTeX di dalam elemen (jika KaTeX berhasil dimuat)
  function renderMath(el) {
    if (!el || typeof window.renderMathInElement !== 'function') return;
    window.renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    });
  }

  // Ubah label biasa (mis. "V_o1 (ω = 2000)") menjadi LaTeX
  const labelTex = (s) => `$${String(s).replace(/_(\w+)/g, '_{$1}').replace(/ω/g, '\\omega')}$`;
  const SATUAN = { 'Ω': '\\Omega', 'V': '\\text{V}', 'A': '\\text{A}', 'mA': '\\text{mA}', 'µs': '\\mu\\text{s}' };
  const satuanTex = (u) => SATUAN[u] || `\\text{${u}}`;

  // Arus di bawah 0,1 A ditampilkan dalam mA agar angkanya terbaca
  function otomatis(z, unit) {
    if (unit === 'A' && C.abs(z) < 0.1) return { z: C.scale(1000, z), unit: 'mA' };
    return { z, unit };
  }

  /* ---------- peta belajar ---------- */
  function viewPeta() {
    const selesai = selesaiList().length;
    app.innerHTML = `
      <h1>Cara mempelajari Bab 9</h1>
      <p class="muted">Semua soal Bab 9 diselesaikan dengan pola yang sama. Yang berbeda hanya metode di tiap langkah. Halaman ini merangkum polanya, lalu soal-soal di bawah menunjukkan penerapannya.</p>

      <div class="kartu rencana">
        <div>
          <h2>Rencana belajar</h2>
          <p>Target yang realistis untuk ujian harian: <b>2 soal per hari</b>, dengan mode latihan aktif. Setelah itu tutup dan ulangi satu soal dari hari sebelumnya tanpa melihat langkah.</p>
          <p class="muted">Sudah selesai: <b>${selesai} dari ${PROBLEMS.length}</b> soal.</p>
        </div>
        <div class="rencana-aksi">
          ${berikutnya() ? `<a class="tombol utama" href="#/soal/${encodeURIComponent(berikutnya().id)}">Lanjut ke ${esc(berikutnya().id)}</a>` : `<span class="chip">Semua soal sudah ditandai selesai</span>`}
        </div>
      </div>

      <div class="kartu">
        <h2>Enam langkah untuk setiap soal</h2>
        <ol class="langkah-peta">
          <li><b>Tandai frekuensi dan ubah sumber ke fasor.</b> Ambil $\\omega$ dari sumber. Kalau sumbernya sinus, ubah dulu ke kosinus: $\\sin\\theta = \\cos(\\theta - 90^\\circ)$.</li>
          <li><b>Ubah semua elemen ke impedansi.</b> $R$ tetap $R$. Induktor menjadi $j\\omega L$. Kapasitor menjadi $\\dfrac{1}{j\\omega C} = -\\dfrac{j}{\\omega C}$.</li>
          <li><b>Pilih metode sesuai bentuk rangkaian.</b> Lihat tabel di bawah.</li>
          <li><b>Hitung dalam bentuk kompleks.</b> Untuk pembagian, kalikan dengan konjugat penyebut. Untuk pembagian polar, bagi besar dan kurangi sudut.</li>
          <li><b>Kembalikan ke waktu.</b> Fasor $|V|\\angle\\theta$ menjadi $|V|\\cos(\\omega t + \\theta)$.</li>
          <li><b>Periksa.</b> Substitusi hasil ke persamaan awal. Cek satuan dan kuadran sudut.</li>
        </ol>
      </div>

      <div class="kartu">
        <h2>Tipe soal dan metode yang dipakai</h2>
        <table class="peta-tabel">
          <tr><th>Tipe rangkaian</th><th>Metode</th><th>Tanda untuk memilihnya</th></tr>
          <tr><td>Seri atau paralel murni</td><td>Reduksi seri–paralel</td><td>Tidak ada sumber tak-bebas, dan tidak ada kawat yang menyatukan cabang.</td></tr>
          <tr><td>Banyak simpul, sedikit sumber</td><td>Tegangan simpul</td><td>Ada satu atau dua simpul tak diketahui. Pilih rel bawah sebagai acuan.</td></tr>
          <tr><td>Banyak loop seri</td><td>Arus mesh</td><td>Sumber tegangan berada di loop.</td></tr>
          <tr><td>Ada sumber tak-bebas</td><td>Sumber uji 1 A atau $V_{Th}/I_{sc}$</td><td>Jangan matikan sumber tak-bebas. Pasang sumber uji di terminal.</td></tr>
          <tr><td>Ditanya ekuivalen</td><td>Thévenin atau Norton</td><td>Soal meminta $V_{Th}$, $I_{sc}$, $Z_{Th}$, $I_N$, atau $Z_N$.</td></tr>
          <tr><td>Dua sumber, dua frekuensi</td><td>Superposisi</td><td>Koefisien $t$ berbeda. Jangan gabungkan jadi satu fasor.</td></tr>
          <tr><td>Satu loop tanpa cabang</td><td>Pembagi tegangan</td><td>Semua elemen dalam satu arus. Tegangan diambil di antara dua blok seri.</td></tr>
        </table>
      </div>

      <div class="kartu">
        <h2>Daftar soal</h2>
        <p class="muted">Klik salah satu soal untuk melihat langkah dan hasilnya. Tanda ✓ berarti sudah ditandai selesai.</p>
        ${gridSoal()}
      </div>
    `;
    setTab('peta');
    renderMath(app);
  }

  function berikutnya() {
    const selesai = selesaiList();
    return PROBLEMS.find((p) => !selesai.includes(p.id)) || null;
  }

  function gridSoal() {
    return `<div class="grid-soal">${PROBLEMS.map((p, i) => `
      <a class="kartu kartu-soal" href="#/soal/${encodeURIComponent(p.id)}">
        <div class="nomor">SOAL ${i + 1} · ${esc(p.id)} ${sudahSelesai(p.id) ? '<span class="ok">✓</span>' : ''}</div>
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
      try { outs = p.analyze().filter((o) => o.kind !== 'aux'); } catch (e) { err = e.message; }
      if (err) {
        rows += `<tr><td>${esc(p.id)}</td><td>${esc(p.judul)}</td><td colspan="3" class="beda">Galat: ${esc(err)}</td></tr>`;
        semua++;
        continue;
      }
      for (const o of outs) {
        const exp = p.expect[o.key];
        semua++;
        const a = otomatis(o.z, o.unit);
        if (!exp) {
          rows += `<tr><td>${esc(p.id)}</td><td>${esc(o.label)}</td><td class="mono">${esc(cplx(a.z))} ${esc(a.unit)}</td><td class="muted">belum ada kunci</td><td></td></tr>`;
          continue;
        }
        const relErr = C.abs(C.sub(o.z, exp)) / Math.max(C.abs(exp), 1e-12);
        const ok = relErr < 0.01;
        if (ok) cocok++;
        const e = otomatis(exp, o.unit);
        rows += `<tr>
          <td>${esc(p.id)}</td>
          <td>${esc(o.label)}</td>
          <td class="mono">${esc(cplx(a.z))} ${esc(a.unit)}<br><span class="muted">${esc(polar(a.z))}</span></td>
          <td class="mono">${esc(cplx(e.z))} ${esc(e.unit)}<br><span class="muted">${esc(polar(e.z))}</span></td>
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
  let terbuka = new Set(); // langkah yang sudah dibuka di soal ini

  function viewSoal(id, indeks) {
    const p = PROBLEMS.find((q) => q.id === id);
    if (!p) { app.innerHTML = `<p>Soal tidak ditemukan.</p>`; return; }
    const nomor = PROBLEMS.indexOf(p) + 1;
    const outs = p.analyze();
    const om = outsMap(outs);
    const steps = p.steps(om);
    const step = Math.min(Math.max(indeks ?? 0, 0), steps.length - 1);
    const latihan = simpan.baca(KUNCI_LATIHAN, true);
    const selesai = sudahSelesai(p.id);
    const perluTebak = latihan && !terbuka.has(`${p.id}:${step}`);

    const chipOmega = p.labelOmega
      ? `<span class="chip">${esc(p.labelOmega)}</span>`
      : p.omega ? `<span class="chip">ω = ${p.omega} rad/s</span>` : `<span class="chip">impedansi tanpa frekuensi tertentu</span>`;

    app.innerHTML = `
      <div class="soal-atas">
        <span class="nomor">SOAL ${nomor} · ${esc(p.id)}</span>
        <h1 style="margin:0">${esc(p.judul)}</h1>
      </div>
      <div style="margin-bottom:1rem"><span class="chip">${esc(p.tipe)}</span>${chipOmega}</div>
      <p class="muted" style="max-width:52rem">${esc(p.ringkas)}</p>

      ${infoHtml(p)}

      <div class="soal-dua" style="margin-top:1rem">
        <div>
          <div class="kartu">
            <div class="stepper-atas">
              <h3 style="margin:0">Langkah ${step + 1} dari ${steps.length}</h3>
              <div class="titik" id="titik">${steps.map((_, i) => `<span class="${i === step ? 'aktif' : i < step ? 'lewat' : ''}"></span>`).join('')}</div>
            </div>
            <div class="langkah-judul">${esc(steps[step].j)}</div>
            ${perluTebak
              ? `<div class="tebak">
                   <p class="muted">Coba tulis langkah ini di kertas dulu. Setelah itu buka pembahasannya.</p>
                   <button class="tombol utama" id="buka" type="button">Buka pembahasan</button>
                 </div>`
              : `<div class="langkah-teks">${steps[step].t}</div>`}
            <div class="baris-nav">
              <button class="tombol" id="sebelum" type="button" ${step === 0 ? 'disabled' : ''}>← Sebelumnya</button>
              ${step < steps.length - 1
                ? `<a class="tombol utama" href="#/soal/${encodeURIComponent(p.id)}/${step + 2}">Berikutnya →</a>`
                : `<a class="tombol" href="#/soal">Kembali ke daftar</a>`}
            </div>
          </div>

          <div class="kartu opsi">
            <label><input id="latihan" type="checkbox" ${latihan ? 'checked' : ''}> Mode latihan (buka pembahasan setelah mencoba)</label>
            <button class="tombol ${selesai ? '' : 'utama'}" id="selesai" type="button">${selesai ? 'Tandai belum selesai' : 'Tandai selesai'}</button>
          </div>
        </div>

        <div>
          <div class="tab-gambar" role="tablist">
            <button type="button" role="tab" id="tab-anim" class="tombol-tab ${modeGambar === 'animasi' ? 'aktif' : ''}">Animasi arus</button>
            <button type="button" role="tab" id="tab-bersih" class="tombol-tab ${modeGambar === 'bersih' ? 'aktif' : ''}">Gambar bersih</button>
          </div>
          <div class="panel-rangkaian">
            <svg id="gambar" viewBox="0 0 ${VIEW_W} ${VIEW_H}" role="img" aria-label="Gambar rangkaian ${esc(p.id)}"></svg>
            <div class="kontrol" id="kontrol-anim" ${modeGambar === 'animasi' ? '' : 'style="display:none"'}>
              <button id="putar" type="button">Jeda</button>
              <label>Kecepatan <input id="kecepatan" type="range" min="0.1" max="2" step="0.1" value="1"></label>
              <label><input id="label" type="checkbox" checked> Label</label>
            </div>
            <div class="catatan-animasi">${modeGambar === 'animasi'
              ? 'Titik bergerak mengikuti arah arus sesaat. Animasi diperlambat; bentuk gelombangnya sama dengan hasil fasor.'
              : 'Gambar ulang dari nol sesuai netlist soal. Nilai pada label adalah nilai yang diberikan soal.'}</div>
          </div>

          <div class="kartu" style="margin-top:1rem">
            <h3>Hasil</h3>
            <div class="hasil-baris">${hasilHtml(outs)}</div>
          </div>
          <div class="kartu">
            <h3>Pelajaran dari soal ini</h3>
            <ul class="daftar">${p.pelajaran.map((x) => `<li>${x}</li>`).join('')}</ul>
          </div>
          <div class="kartu">
            <h3>Jebakan yang sering terjadi</h3>
            <ul class="daftar jebakan">${p.jebakan.map((x) => `<li>${x}</li>`).join('')}</ul>
          </div>
        </div>
      </div>`;

    setTab('soal');
    renderMath(app);

    const back = document.getElementById('sebelum');
    if (back && !back.disabled) back.addEventListener('click', () => { location.hash = `#/soal/${encodeURIComponent(p.id)}/${step}`; });
    const buka = document.getElementById('buka');
    if (buka) buka.addEventListener('click', () => { terbuka.add(`${p.id}:${step}`); viewSoal(p.id, step); });
    document.getElementById('latihan').addEventListener('change', (e) => {
      simpan.tulis(KUNCI_LATIHAN, e.target.checked);
      viewSoal(p.id, step);
    });
    document.getElementById('selesai').addEventListener('click', () => {
      const daftar = selesaiList();
      const baru = daftar.includes(p.id) ? daftar.filter((x) => x !== p.id) : [...daftar, p.id];
      simpan.tulis(KUNCI_SELESAI, baru);
      viewSoal(p.id, step);
    });

    document.getElementById('tab-anim').addEventListener('click', () => { modeGambar = 'animasi'; viewSoal(p.id, step); });
    document.getElementById('tab-bersih').addEventListener('click', () => { modeGambar = 'bersih'; viewSoal(p.id, step); });

    if (stopAnim) stopAnim();
    stopAnim = mulaiAnimasi(p, document.getElementById('gambar'), modeGambar === 'bersih');
  }

  function hasilHtml(outs) {
    return outs.filter((o) => o.kind !== 'aux').map((o) => {
      const { z, unit } = otomatis(o.z, o.unit);
      const u = satuanTex(unit);
      const baris = [];
      if (o.kind === 'value') {
        baris.push(`<span class="k">${labelTex(o.label)}</span><span class="v">$${o.z.re.toFixed(3)}\\,${u}$</span>`);
      } else {
        baris.push(`<span class="k">${labelTex(o.label)}</span><span class="v">$${T.rect(z)}\\,${u}$</span>`);
        baris.push(`<span class="k"></span><span class="v">$${T.polar(z)}\\,${u}$</span>`);
        if (o.omega) {
          const nama = o.label.replace(/ .*/, '').replace(/_(\w+)/g, '_{$1}');
          baris.push(`<span class="k"></span><span class="v">$${nama}(t) = ${T.time(z, o.omega)}\\,${u}$</span>`);
        }
      }
      return baris.join('');
    }).join('');
  }

  /* ---------- timer fokus (25 menit fokus, 5 menit istirahat) ---------- */
  function pasangFokus() {
    const host = document.getElementById('fokus');
    if (!host) return;
    const FOKUS = 25 * 60, ISTIRAHAT = 5 * 60;
    let mode = 'fokus';
    let sisa = FOKUS;
    let jalan = false;
    let timer = null;

    host.innerHTML = `
      <span class="fokus-mode" id="fokus-mode">Fokus</span>
      <span class="fokus-waktu mono" id="fokus-waktu">25:00</span>
      <button class="fokus-tombol" id="fokus-jalan" type="button">Mulai</button>
      <button class="fokus-tombol" id="fokus-ulang" type="button">Ulang</button>`;

    const tampil = () => {
      const m = String(Math.floor(sisa / 60)).padStart(2, '0');
      const d = String(sisa % 60).padStart(2, '0');
      document.getElementById('fokus-waktu').textContent = `${m}:${d}`;
      document.getElementById('fokus-mode').textContent = mode === 'fokus' ? 'Fokus' : 'Istirahat';
      document.getElementById('fokus-jalan').textContent = jalan ? 'Jeda' : 'Mulai';
    };
    const pindah = () => {
      mode = mode === 'fokus' ? 'istirahat' : 'fokus';
      sisa = mode === 'fokus' ? FOKUS : ISTIRAHAT;
      jalan = false;
      clearInterval(timer);
      tampil();
      if (mode === 'istirahat') {
        alert('Waktunya istirahat 5 menit. Lihat sesuatu yang jauh selama 20 detik, lalu berdiri dan minum air.');
      }
    };
    document.getElementById('fokus-jalan').addEventListener('click', () => {
      jalan = !jalan;
      clearInterval(timer);
      if (jalan) {
        timer = setInterval(() => {
          sisa -= 1;
          if (sisa <= 0) pindah();
          else tampil();
        }, 1000);
      }
      tampil();
    });
    document.getElementById('fokus-ulang').addEventListener('click', () => {
      jalan = false;
      clearInterval(timer);
      mode = 'fokus';
      sisa = FOKUS;
      tampil();
    });
    tampil();
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

  function gambarSimbol(parent, e, sg) {
    const mx = (sg.x1 + sg.x2) / 2, my = (sg.y1 + sg.y2) / 2;
    const ang = (Math.atan2(sg.y2 - sg.y1, sg.x2 - sg.x1) * 180) / Math.PI;
    const g = svgEl('g', { transform: `translate(${mx.toFixed(1)},${my.toFixed(1)}) rotate(${ang.toFixed(1)})`, class: 'simbol' }, parent);
    const stroke = { stroke: '#e6edf5', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' };

    if (e.kind === 'Z') {
      const z = e.z;
      if (z.im === 0) {
        svgEl('polyline', { points: '-22,0 -16,0 -12,-6 -6,6 0,-6 6,6 12,-6 16,0 22,0', ...stroke }, g);
      } else if (z.re === 0 && z.im > 0) {
        svgEl('path', { d: 'M-24,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0', ...stroke }, g);
      } else if (z.re === 0 && z.im < 0) {
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
      svgEl('polygon', { points: '0,-13 13,0 0,13 -13,0', ...stroke, fill: '#0f1b2a' }, g);
    }
  }

  function mulaiAnimasi(p, svg, statis = false) {
    if (!svg) return () => {};
    svg.innerHTML = '';
    const pos = p.pos;

    const kawatG = svgEl('g', {}, svg);
    const dotG = svgEl('g', {}, svg);
    const simbolG = svgEl('g', {}, svg);
    const labelG = svgEl('g', {}, svg);
    const simpulG = svgEl('g', {}, svg);

    const cases = p.display();
    const hasil = cases.map((c) => ({ omega: c.omega, elements: c.elements, s: run(c.elements, p.ground) }));

    const wList = cases.map((c) => c.omega).filter((w) => w != null);
    const wmin = wList.length ? Math.min(...wList) : 1;
    const kScale = (2 * Math.PI * 0.25) / wmin;

    const comp = new Map();
    for (const h of hasil) {
      for (const e of h.elements) {
        if (!comp.has(e.id)) comp.set(e.id, []);
        let I;
        try { I = h.s.cur(e.id); } catch (err) { I = C.c(0, 0); }
        comp.get(e.id).push({ wv: kScale * (h.omega ?? 1), I });
      }
    }

    const unik = [];
    const sudah = new Set();
    for (const h of hasil) for (const e of h.elements) if (!sudah.has(e.id)) { sudah.add(e.id); unik.push(e); }

    let imax = 0;
    for (const id of comp.keys()) {
      const amp = comp.get(id).reduce((a, c) => a + C.abs(c.I), 0);
      imax = Math.max(imax, amp);
    }
    if (imax === 0) imax = 1;
    const skalaMA = imax < 0.1;
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

    const rec = [];
    for (const e of unik) {
      const pts = ptsOf(e, pos);
      const info = polylineInfo(pts);
      svgEl('polyline', {
        points: pts.map((q) => q.join(',')).join(' '),
        fill: 'none', stroke: e.wire ? '#3d4d61' : '#7d8fa6', 'stroke-width': e.wire ? 1.2 : 2,
        'stroke-linejoin': 'round',
      }, kawatG);
      const sg = longestSeg(info);
      if (!e.wire) gambarSimbol(simbolG, e, sg);

      const dots = [];
      if (!statis) for (let j = 0; j < 5; j++) dots.push(svgEl('circle', { r: 3.2, fill: '#ffc35a' }, dotG));

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
      rec.push({ e, info, dots, nama, lbl, id: e.id });
    }

    const namaSimpul = new Set();
    for (const e of unik) { namaSimpul.add(e.a); namaSimpul.add(e.b); }
    for (const nm of namaSimpul) {
      const q = pos[nm];
      if (!q) continue;
      svgEl('circle', { cx: q[0], cy: q[1], r: 4, fill: '#e6edf5' }, simpulG);
      const t = svgEl('text', { x: q[0] + 7, y: q[1] - 7, fill: '#9aa8b8', 'font-size': 11 }, simpulG);
      t.textContent = nm === p.ground ? 'acuan' : nm;
    }

    let tau = 0;
    let berjalan = true;
    let kecepatan = 1;
    let lastT = null;
    let rafId = null;
    const btnPutar = document.getElementById('putar');
    const sliderKec = document.getElementById('kecepatan');
    const cekLabel = document.getElementById('label');
    if (statis) {
      // Gambar bersih: label menampilkan nilai soal, tanpa animasi
      rec.forEach((r) => { r.nama.textContent = ''; });
      rec.forEach((r) => { r.lbl.textContent = r.e.label || r.e.id; });
      return () => {};
    }
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
    if (bagian[0] === 'materi') return { tipe: 'materi', bagian: bagian.slice(1) };
    return { tipe: 'peta' };
  }

  function render() {
    if (stopAnim) { stopAnim(); stopAnim = null; }
    const r = rute();
    if (r.tipe === 'soal' && r.id !== idSoalTerakhir) { terbuka = new Set(); idSoalTerakhir = r.id; }
    if (r.tipe !== 'soal') idSoalTerakhir = null;
    if (r.tipe === 'peta') viewPeta();
    else if (r.tipe === 'daftar') viewDaftarSoal();
    else if (r.tipe === 'kunci') viewKunci();
    else if (r.tipe === 'materi') { setTab('materi'); Materi.render(app, r.bagian); }
    else viewSoal(r.id, r.indeks);
    window.scrollTo({ top: 0 });
  }

  window.addEventListener('hashchange', render);
  document.addEventListener('keydown', (e) => {
    const r = rute();
    if (r.tipe !== 'soal') return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const p = PROBLEMS.find((q) => q.id === r.id);
    if (!p) return;
    const total = p.steps(outsMap(p.analyze())).length;
    if (e.key === 'ArrowRight' && r.indeks < total - 1) location.hash = `#/soal/${encodeURIComponent(p.id)}/${r.indeks + 2}`;
    if (e.key === 'ArrowLeft' && r.indeks > 0) location.hash = `#/soal/${encodeURIComponent(p.id)}/${r.indeks}`;
  });

  // Dipakai oleh halaman contoh terbimbing: gambar statis rangkaian dengan label nilai
  window.gambarRangkaian = (svg, p, statis) => mulaiAnimasi(p, svg, statis);

  render();
  pasangFokus();
})();
