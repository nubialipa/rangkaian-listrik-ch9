import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  visibleEvents, parseAt, validateArgument, validateUsername, validatePassword,
  summarizeDebate, sortArguments, sanitizeText,
} from '../src/logic.js';
import { CHARACTERS, maxAtOf, findCharacter } from '../src/characters.js';

const events = [{ at: 1 }, { at: 2 }, { at: 3 }];
const good = { stance: 'pro', ref: 2, text: 'Argumen yang cukup panjang untuk lolos validasi.' };

test('anti-spoiler: hanya kejadian sampai titik progres yang tampil', () => {
  assert.equal(visibleEvents(events, 0).length, 0);
  assert.equal(visibleEvents(events, 2).length, 2);
  assert.equal(visibleEvents(events, 99).length, 3);
});

test('parseAt menolak nilai di luar rentang atau bukan bilangan bulat', () => {
  assert.equal(parseAt('2', 5), 2);
  assert.equal(parseAt('0', 5), 0);
  assert.equal(parseAt('6', 5), null);
  assert.equal(parseAt('-1', 5), null);
  assert.equal(parseAt('1.5', 5), null);
  assert.equal(parseAt('abc', 5), null);
  assert.equal(parseAt(undefined, 5), null);
});

test('argumen valid lolos dan teksnya dibersihkan', () => {
  const r = validateArgument({ ...good, text: '  ' + good.text + '\u0007 ' }, { maxAt: 3, progress: 3 });
  assert.equal(r.valid, true);
  assert.equal(r.clean.text, good.text);
});

test('argumen ditolak bila posisi salah, terlalu pendek, atau terlalu panjang', () => {
  const ctx = { maxAt: 3, progress: 3 };
  assert.equal(validateArgument({ ...good, stance: 'netral' }, ctx).valid, false);
  assert.equal(validateArgument({ ...good, text: 'pendek' }, ctx).valid, false);
  assert.equal(validateArgument({ ...good, text: 'x'.repeat(601) }, ctx).valid, false);
});

test('rujukan harus ada di karakter dan sudah dibuka penulis', () => {
  const ctx = { maxAt: 3, progress: 2 };
  assert.equal(validateArgument({ ...good, ref: 0 }, ctx).valid, false);
  assert.equal(validateArgument({ ...good, ref: 4 }, ctx).valid, false);
  assert.equal(validateArgument({ ...good, ref: 3 }, ctx).valid, false, 'rujukan di atas progres harus ditolak');
  assert.equal(validateArgument({ ...good, ref: 2 }, ctx).valid, true);
});

test('validasi username dan kata sandi', () => {
  assert.equal(validateUsername('abc_1'), true);
  assert.equal(validateUsername('AB'), false);
  assert.equal(validateUsername('nama spasi'), false);
  assert.equal(validateUsername('x'.repeat(21)), false);
  assert.equal(validatePassword('12345678'), true);
  assert.equal(validatePassword('1234567'), false);
});

test('summarizeDebate menghitung posisi dan kecenderungan', () => {
  const s = summarizeDebate([{ stance: 'pro', votes: 3 }, { stance: 'kontra', votes: 1 }, { stance: 'pro', votes: 0 }]);
  assert.equal(s.pro, 2);
  assert.equal(s.kontra, 1);
  assert.equal(s.leading, 'pro');
  assert.equal(summarizeDebate([{ stance: 'pro', votes: 2 }, { stance: 'kontra', votes: 2 }]).leading, 'seimbang');
});

test('sortArguments: suara terbanyak dulu, lalu yang terbaru', () => {
  const sorted = sortArguments([
    { id: 'x', votes: 1, createdAt: 10 },
    { id: 'y', votes: 5, createdAt: 1 },
    { id: 'z', votes: 1, createdAt: 20 },
  ]);
  assert.deepEqual(sorted.map((a) => a.id), ['y', 'z', 'x']);
});

test('sanitizeText membuang karakter kontrol', () => {
  assert.equal(sanitizeText('a\u0000b\r\nc'), 'ab\nc');
});

test('setiap karakter punya urutan titik unik dan sumber', () => {
  for (const c of CHARACTERS) {
    const ats = c.events.map((e) => e.at);
    assert.equal(new Set(ats).size, ats.length, `${c.id}: titik duplikat`);
    assert.ok(c.sources.length > 0, `${c.id}: sumber kosong`);
    assert.equal(findCharacter(c.id), c);
    assert.equal(maxAtOf(c), Math.max(...ats));
  }
});
