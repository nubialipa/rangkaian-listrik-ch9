// Tes integrasi: butuh `npm run db:init` lalu `npm run dev` berjalan di BASE.
// Menguji alur nyata: registrasi, progres anti-spoiler, argumen, suara, laporan, batas laju, dan CSRF.
import assert from 'node:assert/strict';

const BASE = process.env.BASE || 'http://localhost:8787';
const run = Math.random().toString(36).slice(2, 8);
let ipCounter = 0;
const nextIp = () => `10.${run.length}.${ipCounter++}.${Math.floor(Math.random() * 250)}`;

async function call(method, path, { body, cookie, ip, origin } = {}) {
  const headers = { 'CF-Connecting-IP': ip || nextIp() };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (cookie) headers.cookie = cookie;
  if (origin) headers.origin = origin;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  const setCookie = res.headers.get('set-cookie') || '';
  const m = setCookie.match(/sk=([^;]+)/);
  const newCookie = m && m[1] ? `sk=${m[1]}` : null;
  return { status: res.status, data, cookie: newCookie };
}

const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push(['PASS', name]);
  } catch (e) {
    results.push(['FAIL', name, e.message]);
  }
}

const ITACHI = 'itachi-uchiha';
const ipA = nextIp();
const ipB = nextIp();

const A = { name: `a${run}`, pw: 'kata-sandi-A1' };
const B = { name: `b${run}`, pw: 'kata-sandi-B1' };
let cookieA, cookieB, argId;

await step('registrasi dua pengguna', async () => {
  const ra = await call('POST', '/api/register', { body: { username: A.name, password: A.pw }, ip: ipA });
  assert.equal(ra.status, 201, JSON.stringify(ra.data));
  cookieA = ra.cookie;
  assert.ok(cookieA, 'cookie sesi A harus ada');
  const rb = await call('POST', '/api/register', { body: { username: B.name, password: B.pw }, ip: ipB });
  assert.equal(rb.status, 201);
  cookieB = rb.cookie;
});

await step('username sudah dipakai ditolak', async () => {
  const r = await call('POST', '/api/register', { body: { username: A.name, password: A.pw } });
  assert.equal(r.status, 409);
});

await step('validasi username dan kata sandi', async () => {
  assert.equal((await call('POST', '/api/register', { body: { username: 'X Y', password: 'kata-sandi' } })).status, 400);
  assert.equal((await call('POST', '/api/register', { body: { username: `ok${run}`, password: 'pendek' } })).status, 400);
});

await step('tamu melihat kronologi tertutup sesuai ?at=', async () => {
  const r = await call('GET', `/api/characters/${ITACHI}?at=0`);
  assert.equal(r.status, 200);
  assert.equal(r.data.events.length, 0);
  assert.equal(r.data.hiddenEvents, 5);
  const r2 = await call('GET', `/api/characters/${ITACHI}?at=2`);
  assert.equal(r2.data.events.length, 2);
});

await step('progres pengguna tersimpan dan dipakai di detail', async () => {
  const p = await call('PUT', `/api/characters/${ITACHI}/progress`, { body: { at: 2 }, cookie: cookieA });
  assert.equal(p.status, 200);
  const d = await call('GET', `/api/characters/${ITACHI}`, { cookie: cookieA });
  assert.equal(d.data.at, 2);
  assert.equal(d.data.events.length, 2);
  assert.equal(d.data.user.username, A.name);
});

await step('progres di luar rentang ditolak', async () => {
  const p = await call('PUT', `/api/characters/${ITACHI}/progress`, { body: { at: 99 }, cookie: cookieA });
  assert.equal(p.status, 400);
});

await step('argumen dengan rujukan di atas progres ditolak', async () => {
  const r = await call('POST', `/api/characters/${ITACHI}/arguments`, {
    body: { stance: 'pro', ref: 4, text: 'Mencoba merujuk kejadian yang belum saya buka.' }, cookie: cookieA,
  });
  assert.equal(r.status, 400);
});

await step('argumen valid tersimpan dan tampil untuk yang sudah membuka rujukannya', async () => {
  const r = await call('POST', `/api/characters/${ITACHI}/arguments`, {
    body: { stance: 'pro', ref: 2, text: 'Keputusannya masuk akal karena ia bekerja dari dalam organisasi.' }, cookie: cookieA,
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  argId = r.data.id;
  // Database lokal bisa berisi data dari run sebelumnya, jadi cek argumen ini lewat ID-nya.
  const guestEarly = await call('GET', `/api/characters/${ITACHI}?at=1`);
  assert.equal(guestEarly.data.arguments.some((a) => a.id === argId), false, 'argumen rujukan 2 tidak boleh bocor ke titik 1');
  assert.equal(guestEarly.data.arguments.every((a) => a.ref <= 1), true, 'semua argumen di at=1 harus merujuk titik 1 atau lebih awal');
  const guestLate = await call('GET', `/api/characters/${ITACHI}?at=2`);
  const mine = guestLate.data.arguments.find((a) => a.id === argId);
  assert.ok(mine, 'argumen harus tampil di titik 2');
  assert.equal(mine.text.startsWith('Keputusannya'), true);
});

await step('teks HTML tersimpan sebagai teks biasa (tidak dieksekusi di server)', async () => {
  const r = await call('POST', `/api/characters/${ITACHI}/arguments`, {
    body: { stance: 'kontra', ref: 1, text: '<script>alert(1)</script> argumen cukup panjang di sini.' }, cookie: cookieB,
  });
  assert.equal(r.status, 400, 'B belum membuka titik 1');
  await call('PUT', `/api/characters/${ITACHI}/progress`, { body: { at: 1 }, cookie: cookieB });
  const ok = await call('POST', `/api/characters/${ITACHI}/arguments`, {
    body: { stance: 'kontra', ref: 1, text: '<script>alert(1)</script> argumen cukup panjang di sini.' }, cookie: cookieB,
  });
  assert.equal(ok.status, 201);
});

await step('suara: pemilik tidak bisa memilih argumennya sendiri', async () => {
  const r = await call('POST', `/api/arguments/${argId}/vote`, { cookie: cookieA });
  assert.equal(r.status, 403);
});

await step('suara: harus sudah membuka rujukan argumen', async () => {
  // B progres 1, argumen rujukan 2
  const r = await call('POST', `/api/arguments/${argId}/vote`, { cookie: cookieB });
  assert.equal(r.status, 403);
});

await step('suara: sekali per akun, kedua kali ditolak', async () => {
  await call('PUT', `/api/characters/${ITACHI}/progress`, { body: { at: 2 }, cookie: cookieB });
  const first = await call('POST', `/api/arguments/${argId}/vote`, { cookie: cookieB });
  assert.equal(first.status, 200);
  const second = await call('POST', `/api/arguments/${argId}/vote`, { cookie: cookieB });
  assert.equal(second.status, 409);
  const d = await call('GET', `/api/characters/${ITACHI}`, { cookie: cookieA });
  const arg = d.data.arguments.find((a) => a.id === argId);
  assert.equal(arg.votes, 1);
  assert.ok(d.data.summary.proVotes >= 1);
});

await step('laporan: argumen disembunyikan setelah 3 akun berbeda melapor', async () => {
  const reporters = [];
  for (let i = 0; i < 3; i++) {
    const r = await call('POST', '/api/register', { body: { username: `r${run}${i}`, password: 'kata-sandi-R' } });
    reporters.push(r.cookie);
  }
  // Laporan dari pelapor yang sama tidak dihitung dua kali.
  await call('POST', `/api/arguments/${argId}/report`, { cookie: reporters[0] });
  await call('POST', `/api/arguments/${argId}/report`, { cookie: reporters[0] });
  await call('POST', `/api/arguments/${argId}/report`, { cookie: reporters[1] });
  let d = await call('GET', `/api/characters/${ITACHI}?at=2`);
  assert.ok(d.data.arguments.some((a) => a.id === argId), 'dua pelapor belum cukup');
  await call('POST', `/api/arguments/${argId}/report`, { cookie: reporters[2] });
  d = await call('GET', `/api/characters/${ITACHI}?at=2`);
  assert.equal(d.data.arguments.some((a) => a.id === argId), false, 'harus tersembunyi');
});

await step('CSRF: permintaan dari origin lain ditolak', async () => {
  const r = await call('POST', '/api/logout', { cookie: cookieA, origin: 'https://evil.example' });
  assert.equal(r.status, 403);
});

await step('login: kata sandi salah ditolak, benar diterima', async () => {
  const bad = await call('POST', '/api/login', { body: { username: A.name, password: 'salah-total' } });
  assert.equal(bad.status, 401);
  const none = await call('POST', '/api/login', { body: { username: `tidak${run}`, password: 'apa-saja-1' } });
  assert.equal(none.status, 401);
  assert.equal(none.data.error, bad.data.error, 'pesan galat harus sama');
  const ok = await call('POST', '/api/login', { body: { username: A.name, password: A.pw } });
  assert.equal(ok.status, 200);
  assert.ok(ok.cookie);
});

await step('logout menghapus sesi', async () => {
  const login = await call('POST', '/api/login', { body: { username: B.name, password: B.pw } });
  await call('POST', '/api/logout', { cookie: login.cookie });
  const me = await call('GET', '/api/me', { cookie: login.cookie });
  assert.equal(me.data.user, null);
});

await step('batas laju registrasi per IP', async () => {
  const ip = nextIp();
  let last;
  for (let i = 0; i < 6; i++) {
    last = await call('POST', '/api/register', { body: { username: `lim${run}${i}`, password: 'kata-sandi-L' }, ip });
  }
  assert.equal(last.status, 429);
});

await step('rute tidak dikenal mengembalikan 404 JSON', async () => {
  const r = await call('GET', '/api/tidak-ada');
  assert.equal(r.status, 404);
  assert.equal(typeof r.data.error, 'string');
});

await step('body bukan JSON ditolak dengan 415', async () => {
  const res = await fetch(BASE + '/api/login', {
    method: 'POST', headers: { 'content-type': 'text/plain', 'CF-Connecting-IP': nextIp() }, body: 'x',
  });
  assert.equal(res.status, 415);
});

let failed = 0;
for (const [status, name, msg] of results) {
  console.log(`${status}  ${name}${msg ? `\n      ${msg}` : ''}`);
  if (status === 'FAIL') failed++;
}
console.log(`\n${results.length - failed}/${results.length} lulus`);
process.exit(failed ? 1 : 0);
