/*
 * Solver rangkaian AC keadaan tunak (fasor) memakai Modified Nodal Analysis.
 * Bilangan kompleks dinyatakan sebagai {re, im}. Satuan: V, A, Ω, rad/s.
 *
 * Jenis elemen (field `kind`):
 *   'Z'     impedansi a→b                      (z)
 *   'V'     sumber tegangan, V_a - V_b = E      (E)  — J = arus keluar dari terminal +
 *   'I'     sumber arus, mengalir dari a ke b    (J)
 *   'VCVS'  V_a - V_b = k (V_c - V_d)            (k, c, d)
 *   'CCVS'  V_a - V_b = k I_ctrl                 (k, ctrl) — I_ctrl = arus elemen 'Z' ctrl dari ctrl.a ke ctrl.b
 *   'VCCS'  I dari a ke b = g (V_c - V_d)        (g, c, d)
 *   'CCCS'  I dari a ke b = k I_ctrl             (k, ctrl)
 */
(function (root) {
  'use strict';

  const C = {
    c: (re, im = 0) => ({ re, im }),
    add: (a, b) => ({ re: a.re + b.re, im: a.im + b.im }),
    sub: (a, b) => ({ re: a.re - b.re, im: a.im - b.im }),
    mul: (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }),
    div: (a, b) => {
      const d = b.re * b.re + b.im * b.im;
      if (d === 0) throw new Error('Pembagian dengan nol: ada impedansi nol atau simpul mengambang');
      return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
    },
    neg: (a) => ({ re: -a.re, im: -a.im }),
    abs: (a) => Math.hypot(a.re, a.im),
    deg: (a) => (Math.atan2(a.im, a.re) * 180) / Math.PI,
    polar: (r, d) => ({ re: r * Math.cos((d * Math.PI) / 180), im: r * Math.sin((d * Math.PI) / 180) }),
    inv: (a) => C.div({ re: 1, im: 0 }, a),
    scale: (k, a) => ({ re: k * a.re, im: k * a.im }),
  };

  // Impedansi induktor dan kapasitor pada frekuensi sudut w (rad/s)
  const L = (H, w) => ({ re: 0, im: w * H });
  const Cap = (F, w) => ({ re: 0, im: -1 / (w * F) });

  function gauss(A, b) {
    const n = b.length;
    const M = A.map((r, i) => [...r, b[i]]);
    for (let col = 0; col < n; col++) {
      let piv = col;
      let best = C.abs(M[col][col]);
      for (let r = col + 1; r < n; r++) {
        const v = C.abs(M[r][col]);
        if (v > best) { best = v; piv = r; }
      }
      if (best < 1e-12) {
        throw new Error('Sistem singular: periksa simpul yang mengambang, loop sumber tegangan, atau elemen yang saling mengunci');
      }
      [M[col], M[piv]] = [M[piv], M[col]];
      for (let r = 0; r < n; r++) {
        if (r === col) continue;
        const f = C.div(M[r][col], M[col][col]);
        if (f.re === 0 && f.im === 0) continue;
        for (let k = col; k <= n; k++) M[r][k] = C.sub(M[r][k], C.mul(f, M[col][k]));
      }
    }
    return M.map((row, i) => C.div(row[n], row[i]));
  }

  function run(elements, ground) {
    const byId = new Map(elements.map((e) => [e.id, e]));
    const names = new Set();
    for (const e of elements) for (const k of ['a', 'b', 'c', 'd']) if (e[k] != null) names.add(e[k]);
    names.delete(ground);
    const nodes = [...names];
    const idx = new Map(nodes.map((n, i) => [n, i]));
    const nN = nodes.length;

    const vdef = elements.filter((e) => e.kind === 'V' || e.kind === 'VCVS' || e.kind === 'CCVS');
    const jIdx = new Map(vdef.map((e, k) => [e.id, nN + k]));
    const N = nN + vdef.length;

    const A = Array.from({ length: N }, () => Array.from({ length: N }, () => C.c(0, 0)));
    const rhs = Array.from({ length: N }, () => C.c(0, 0));
    const row = (n) => (n === ground ? -1 : idx.get(n));
    const addA = (r, c, v) => { if (r < 0 || c < 0) return; A[r][c] = C.add(A[r][c], v); };
    const addB = (r, v) => { if (r < 0) return; rhs[r] = C.add(rhs[r], v); };

    const stampY = (a, b, Y) => {
      const ia = row(a), ib = row(b);
      addA(ia, ia, Y); addA(ib, ib, Y);
      addA(ia, ib, C.neg(Y)); addA(ib, ia, C.neg(Y));
    };
    const stampG = (a, b, c, d, g) => {
      const ia = row(a), ib = row(b), ic = row(c), id = row(d);
      addA(ib, ic, C.neg(g)); addA(ib, id, g);
      addA(ia, ic, g); addA(ia, id, C.neg(g));
    };
    const ctrlY = (id) => {
      const ce = byId.get(id);
      if (!ce || ce.kind !== 'Z') throw new Error('Elemen kontrol harus impedansi: ' + id);
      return C.inv(ce.z);
    };

    for (const e of elements) {
      if (e.kind === 'Z') {
        stampY(e.a, e.b, C.inv(e.z));
      } else if (e.kind === 'I') {
        addB(row(e.b), e.J);
        addB(row(e.a), C.neg(e.J));
      } else if (e.kind === 'VCCS') {
        stampG(e.a, e.b, e.c, e.d, e.g);
      } else if (e.kind === 'CCCS') {
        const ce = byId.get(e.ctrl);
        stampG(e.a, e.b, ce.a, ce.b, C.mul(e.k, ctrlY(e.ctrl)));
      } else {
        const j = jIdx.get(e.id);
        addA(row(e.a), j, C.c(-1));
        addA(row(e.b), j, C.c(1));
        addA(j, row(e.a), C.c(1));
        addA(j, row(e.b), C.c(-1));
        if (e.kind === 'V') {
          rhs[j] = C.add(rhs[j], e.E);
        } else if (e.kind === 'VCVS') {
          addA(j, row(e.c), C.neg(e.k));
          addA(j, row(e.d), e.k);
        } else if (e.kind === 'CCVS') {
          const ce = byId.get(e.ctrl);
          const g = C.mul(e.k, ctrlY(e.ctrl));
          addA(j, row(ce.a), C.neg(g));
          addA(j, row(ce.b), g);
        } else {
          throw new Error('Jenis elemen tidak dikenal: ' + e.kind);
        }
      }
    }

    const x = gauss(A, rhs);
    const v = (n) => (n === ground ? C.c(0, 0) : x[idx.get(n)]);
    const J = (id) => x[jIdx.get(id)];

    // Arus yang mengalir melalui elemen dari terminal a ke terminal b
    const cur = (id) => {
      const e = byId.get(id);
      if (!e) throw new Error('Elemen tidak ada: ' + id);
      if (e.kind === 'Z') return C.mul(C.inv(e.z), C.sub(v(e.a), v(e.b)));
      if (e.kind === 'I') return e.J;
      if (e.kind === 'V' || e.kind === 'VCVS' || e.kind === 'CCVS') return C.neg(J(id));
      if (e.kind === 'VCCS') return C.mul(e.g, C.sub(v(e.c), v(e.d)));
      if (e.kind === 'CCCS') return C.mul(e.k, C.mul(ctrlY(e.ctrl), C.sub(v(byId.get(e.ctrl).a), v(byId.get(e.ctrl).b))));
      throw new Error('Tidak bisa menghitung arus: ' + id);
    };

    return { v, J, cur, nodes };
  }

  // Format untuk ditampilkan
  const fmt = {
    rect(z, d = 2) {
      const s = z.im < 0 ? '−' : '+';
      return `${z.re.toFixed(d)} ${s} j${Math.abs(z.im).toFixed(d)}`;
    },
    polar(z, d = 2) {
      return `${C.abs(z).toFixed(d)} ∠ ${C.deg(z).toFixed(d)}°`;
    },
    // bentuk waktu: |Z| cos(wt + θ)
    time(z, w, d = 2, name = '') {
      const th = C.deg(z);
      const s = th < 0 ? '−' : '+';
      const om = w == null ? '' : `${w}t`;
      return `${name}${C.abs(z).toFixed(d)} cos(${om} ${s} ${Math.abs(th).toFixed(d)}°)`;
    },
  };

  root.Solver = { C, L, Cap, run, fmt };
  if (typeof module !== 'undefined') module.exports = root.Solver;
})(typeof window !== 'undefined' ? window : globalThis);
