// Jalankan: node --test ventures/cek-pph-umkm/rules.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate, LIMIT_TURNOVER } = require('./rules.js');

const base = { entity: 'orang_pribadi', excludedProfession: '', turnover: 100000000, coopYearsUsed: 0 };

test('orang pribadi dengan omzet kecil eligible dan pajak 0', () => {
  const r = evaluate(base);
  assert.equal(r.valid, true);
  assert.equal(r.eligible, true);
  assert.equal(r.estimatedTax, 0);
});

test('omzet tepat Rp500 juta masih 0%', () => {
  const r = evaluate({ ...base, turnover: 500000000 });
  assert.equal(r.estimatedTax, 0);
});

test('omzet di atas Rp500 juta kena 0,5% dari omzet bruto', () => {
  const r = evaluate({ ...base, turnover: 1000000000 });
  assert.equal(r.eligible, true);
  assert.equal(r.estimatedTax, 5000000);
});

test('omzet tepat Rp4,8 miliar masih eligible', () => {
  const r = evaluate({ ...base, turnover: LIMIT_TURNOVER });
  assert.equal(r.eligible, true);
});

test('omzet di atas Rp4,8 miliar tidak eligible dan tanpa estimasi pajak', () => {
  const r = evaluate({ ...base, turnover: LIMIT_TURNOVER + 1 });
  assert.equal(r.eligible, false);
  assert.equal(r.estimatedTax, null);
  assert.equal(r.estimatedTaxText, '-');
});

test('profesi yang dikecualikan tidak eligible', () => {
  const r = evaluate({ ...base, excludedProfession: 'dokter' });
  assert.equal(r.eligible, false);
  assert.match(r.reasons[0], /Dokter/);
});

test('PT perorangan eligible', () => {
  assert.equal(evaluate({ ...base, entity: 'pt_perorangan' }).eligible, true);
});

test('CV/firma/PT dengan banyak pemilik tidak eligible', () => {
  assert.equal(evaluate({ ...base, entity: 'cv_firma_pt' }).eligible, false);
});

test('koperasi masih dalam 4 tahun eligible, lewat 4 tahun tidak', () => {
  assert.equal(evaluate({ ...base, entity: 'koperasi', coopYearsUsed: 3 }).eligible, true);
  assert.equal(evaluate({ ...base, entity: 'koperasi', coopYearsUsed: 4 }).eligible, false);
});

test('input tidak valid ditolak', () => {
  assert.equal(evaluate({ ...base, turnover: -5 }).valid, false);
  assert.equal(evaluate({ ...base, turnover: 'abc' }).valid, false);
  assert.equal(evaluate({ ...base, entity: 'lainnya' }).valid, false);
});
