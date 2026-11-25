import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, newToken, sha256Hex } from '../src/auth.js';

test('hash kata sandi cocok dengan kata sandi yang benar saja', async () => {
  const stored = await hashPassword('rahasia-123');
  assert.match(stored, /^pbkdf2\$100000\$/);
  assert.equal(await verifyPassword('rahasia-123', stored), true);
  assert.equal(await verifyPassword('rahasia-124', stored), false);
});

test('hash berbeda untuk input yang sama karena salt acak', async () => {
  const a = await hashPassword('sama-sama');
  const b = await hashPassword('sama-sama');
  assert.notEqual(a, b);
});

test('format hash rusak ditolak tanpa melempar error', async () => {
  assert.equal(await verifyPassword('apa-saja', 'bukan-hash'), false);
  assert.equal(await verifyPassword('apa-saja', undefined), false);
});

test('token sesi acak dan hash SHA-256 stabil', async () => {
  const t1 = newToken();
  const t2 = newToken();
  assert.notEqual(t1, t2);
  assert.match(t1, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
