// Verifikasi: hasil solver dibandingkan dengan kunci jawaban buku soal.
const path = require('path');
require(path.join(__dirname, '../site/js/solver.js'));
const PROBLEMS = require(path.join(__dirname, '../site/js/problems.js'));
const { C, fmt } = Solver;

let gagal = 0;
for (const p of PROBLEMS) {
  try {
    const outs = p.analyze();
    for (const o of outs) {
      const exp = p.expect[o.key];
      if (!exp) { console.log(`${p.id} ${o.key}: (tanpa kunci)`); continue; }
      const err = C.abs(C.sub(o.z, exp)) / Math.max(C.abs(exp), 1e-12);
      const ok = err < 0.01;
      if (!ok) gagal++;
      console.log(`${ok ? 'OK  ' : 'BEDA'} ${p.id} ${o.key.padEnd(5)} hitung=${fmt.rect(o.z)} | kunci=${fmt.rect(exp)} | selisih=${(err * 100).toFixed(3)}%`);
    }
  } catch (e) {
    gagal++;
    console.log(`GALAT ${p.id}: ${e.message}`);
  }
}
console.log(gagal === 0 ? '\nSemua hasil cocok dengan kunci.' : `\n${gagal} hasil belum cocok.`);
process.exit(gagal === 0 ? 0 : 1);
