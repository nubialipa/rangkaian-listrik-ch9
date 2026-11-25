// Jalankan: node --test ventures/debat-karakter/logic.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('./logic.js');

const char = {
  events: [
    { at: 1, title: 'A', summary: 'a' },
    { at: 2, title: 'B', summary: 'b' },
    { at: 3, title: 'C', summary: 'c' }
  ]
};
const good = { stance: 'pro', ref: 2, text: 'Argumen yang cukup panjang untuk lolos validasi.' };

test('visibleEvents menyembunyikan kejadian di atas progres', () => {
  assert.deepEqual(L.visibleEvents(char, 0).length, 0);
  assert.equal(L.visibleEvents(char, 2).length, 2);
  assert.equal(L.visibleEvents(char, 99).length, 3);
});

test('argumen valid lolos', () => {
  assert.equal(L.validateArgument(char, good).valid, true);
});

test('argumen tanpa posisi, terlalu pendek, atau rujukan tidak ada ditolak', () => {
  assert.equal(L.validateArgument(char, { ...good, stance: 'netral' }).valid, false);
  assert.equal(L.validateArgument(char, { ...good, text: 'pendek' }).valid, false);
  assert.equal(L.validateArgument(char, { ...good, ref: 7 }).valid, false);
  assert.equal(L.validateArgument(char, { ...good, ref: 0 }).valid, false);
});

test('argumen terlalu panjang ditolak', () => {
  assert.equal(L.validateArgument(char, { ...good, text: 'x'.repeat(601) }).valid, false);
});

test('summarizeDebate menghitung pro/kontra dan suara', () => {
  const s = L.summarizeDebate([
    { stance: 'pro', votes: 3 },
    { stance: 'kontra', votes: 1 },
    { stance: 'pro', votes: 0 }
  ]);
  assert.equal(s.pro, 2);
  assert.equal(s.kontra, 1);
  assert.equal(s.proVotes, 3);
  assert.equal(s.leading, 'pro');
});

test('summarizeDebate menandai seimbang saat suara sama', () => {
  assert.equal(L.summarizeDebate([{ stance: 'pro', votes: 2 }, { stance: 'kontra', votes: 2 }]).leading, 'seimbang');
});

test('sortArguments mengurutkan suara terbanyak lalu yang terbaru', () => {
  const sorted = L.sortArguments([
    { id: 'x', votes: 1, createdAt: 10 },
    { id: 'y', votes: 5, createdAt: 1 },
    { id: 'z', votes: 1, createdAt: 20 }
  ]);
  assert.deepEqual(sorted.map(a => a.id), ['y', 'z', 'x']);
});
