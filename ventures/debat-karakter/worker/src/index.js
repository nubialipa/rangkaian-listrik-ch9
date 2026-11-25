// Sidang Karakter: API Worker. Berkas statis dilayani oleh aset Cloudflare (lihat wrangler.toml).
import { CHARACTERS, findCharacter, maxAtOf, publicCharacterMeta } from './characters.js';
import {
  visibleEvents, parseAt, validateArgument, validateUsername, validatePassword,
  summarizeDebate, sortArguments,
} from './logic.js';
import { hashPassword, verifyPassword, newToken, sha256Hex } from './auth.js';

const SESSION_TTL = 30 * 24 * 3600;     // 30 hari
// Hash tiruan untuk menyamakan waktu verifikasi saat akun tidak ditemukan (tidak pernah cocok).
const DUMMY_HASH = 'pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(43) + '=';
const MAX_BODY_BYTES = 8192;
const REPORT_HIDE_THRESHOLD = 3;

// Batas laju per jendela waktu (detik).
const LIMITS = {
  register: { key: (ip) => `reg:${ip}`, limit: 5, window: 3600 },
  login: { key: (ip) => `login:${ip}`, limit: 20, window: 900 },
  post: { key: (uid) => `post:${uid}`, limit: 5, window: 3600 },
  vote: { key: (uid) => `vote:${uid}`, limit: 60, window: 3600 },
  report: { key: (uid) => `report:${uid}`, limit: 20, window: 3600 },
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const now = () => Math.floor(Date.now() / 1000);

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers,
    },
  });
}

async function readJson(request) {
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new HttpError(415, 'Kirim data sebagai JSON.');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'Data terlalu besar.');
  try {
    return JSON.parse(text || '{}');
  } catch {
    throw new HttpError(400, 'JSON tidak valid.');
  }
}

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'local';
}

// Perlindungan CSRF: untuk metode yang mengubah data, origin harus sama dengan situs ini.
function checkOrigin(request, url) {
  if (request.method === 'GET' || request.method === 'HEAD') return;
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) throw new HttpError(403, 'Permintaan lintas situs ditolak.');
}

// Pembatas laju fixed-window. Naik setiap kali dipanggil; melempar 429 jika melewati batas.
async function rateLimit(env, rule, id) {
  const key = rule.key(id);
  const t = now();
  const row = await env.DB.prepare('SELECT window_start, count FROM rate_limits WHERE key = ?').bind(key).first();
  if (!row || t - row.window_start >= rule.window) {
    await env.DB.prepare(
      'INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, count = 1'
    ).bind(key, t).run();
    return;
  }
  if (row.count >= rule.limit) throw new HttpError(429, 'Terlalu banyak permintaan. Coba lagi beberapa saat lagi.');
  await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
}

function sessionCookie(token) {
  return `sk=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}`;
}

async function currentUser(request, env) {
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)sk=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  const hash = await sha256Hex(m[1]);
  return env.DB.prepare(
    'SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  ).bind(hash, now()).first();
}

async function requireUser(request, env) {
  const user = await currentUser(request, env);
  if (!user) throw new HttpError(401, 'Masuk terlebih dahulu.');
  return user;
}

async function createSession(env, userId) {
  const token = newToken();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256Hex(token), userId, now() + SESSION_TTL).run();
  return token;
}

function requireCharacter(id) {
  const c = findCharacter(id);
  if (!c) throw new HttpError(404, 'Karakter tidak ditemukan.');
  return c;
}

async function getProgress(env, userId, characterId) {
  const row = await env.DB.prepare('SELECT at FROM progress WHERE user_id = ? AND character_id = ?')
    .bind(userId, characterId).first();
  return row ? row.at : 0;
}

// ---------- Handler ----------

async function register(request, env) {
  await rateLimit(env, LIMITS.register, clientIp(request));
  const body = await readJson(request);
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  if (!validateUsername(username)) throw new HttpError(400, 'Username 3–20 karakter: huruf kecil, angka, atau garis bawah.');
  if (!validatePassword(body.password)) throw new HttpError(400, 'Kata sandi minimal 8 karakter.');

  const exists = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (exists) throw new HttpError(409, 'Username sudah dipakai.');

  const hash = await hashPassword(body.password);
  const res = await env.DB.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)')
    .bind(username, hash, now()).run();
  const userId = res.meta.last_row_id;
  const token = await createSession(env, userId);
  return json({ user: { id: userId, username } }, 201, { 'set-cookie': sessionCookie(token) });
}

async function login(request, env) {
  await rateLimit(env, LIMITS.login, clientIp(request));
  const body = await readJson(request);
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const user = await env.DB.prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
    .bind(username).first();
  // Selalu jalankan verifikasi (dengan hash tiruan jika akun tidak ada), supaya waktu respons tidak membocorkan username.
  const pw = typeof body.password === 'string' ? body.password : '';
  const ok = await verifyPassword(pw, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok || !pw) throw new HttpError(401, 'Username atau kata sandi salah.');
  const token = await createSession(env, user.id);
  return json({ user: { id: user.id, username: user.username } }, 200, { 'set-cookie': sessionCookie(token) });
}

async function logout(request, env) {
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)sk=([A-Za-z0-9_-]+)/);
  if (m) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(m[1])).run();
  }
  return json({ ok: true }, 200, { 'set-cookie': 'sk=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' });
}

async function characterDetail(request, env, url, characterId) {
  const c = requireCharacter(characterId);
  const maxAt = maxAtOf(c);
  const user = await currentUser(request, env);
  const stored = user ? await getProgress(env, user.id, c.id) : null;

  // Titik tampilan: untuk pengguna masuk pakai progres tersimpan; tamu boleh kirim ?at= dari perangkatnya.
  let at = parseAt(url.searchParams.get('at'), maxAt);
  if (user) at = at ?? stored;
  if (at === null) at = 0;

  const viewerId = user ? user.id : -1;
  const rows = await env.DB.prepare(`
    SELECT a.id, a.stance, a.ref, a.text, a.created_at, a.user_id, u.username,
      (SELECT COUNT(*) FROM votes v WHERE v.argument_id = a.id) AS votes,
      (SELECT COUNT(*) FROM votes v WHERE v.argument_id = a.id AND v.user_id = ?) AS voted
    FROM arguments a JOIN users u ON u.id = a.user_id
    WHERE a.character_id = ? AND a.hidden = 0 AND a.ref <= ?`)
    .bind(viewerId, c.id, at).all();

  const args = sortArguments(rows.results.map((r) => ({
    id: r.id,
    stance: r.stance,
    ref: r.ref,
    text: r.text,
    votes: r.votes,
    author: r.username,
    createdAt: r.created_at,
    voted: r.voted > 0,
    mine: user ? r.user_id === user.id : false,
  })));

  const events = visibleEvents(c.events, at);
  return json({
    character: publicCharacterMeta(c),
    sources: c.sources,
    at,
    progress: stored,
    events,
    hiddenEvents: c.events.length - events.length,
    arguments: args,
    summary: summarizeDebate(args),
    user: user ? { id: user.id, username: user.username } : null,
  });
}

async function setProgress(request, env, characterId) {
  const user = await requireUser(request, env);
  const c = requireCharacter(characterId);
  const body = await readJson(request);
  const at = parseAt(body.at, maxAtOf(c));
  if (at === null) throw new HttpError(400, 'Titik progres tidak valid.');
  await env.DB.prepare(`
    INSERT INTO progress (user_id, character_id, at) VALUES (?, ?, ?)
    ON CONFLICT(user_id, character_id) DO UPDATE SET at = excluded.at`)
    .bind(user.id, c.id, at).run();
  return json({ at });
}

async function postArgument(request, env, characterId) {
  const user = await requireUser(request, env);
  const c = requireCharacter(characterId);
  await rateLimit(env, LIMITS.post, user.id);
  const body = await readJson(request);
  const progress = await getProgress(env, user.id, c.id);
  const check = validateArgument(body, { maxAt: maxAtOf(c), progress });
  if (!check.valid) throw new HttpError(400, check.errors.join(' '));

  const id = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO arguments (id, character_id, user_id, stance, ref, text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, c.id, user.id, check.clean.stance, check.clean.ref, check.clean.text, now()).run();
  return json({ id }, 201);
}

async function voteArgument(request, env, argId) {
  const user = await requireUser(request, env);
  const arg = await env.DB.prepare('SELECT id, character_id, user_id, ref, hidden FROM arguments WHERE id = ?')
    .bind(argId).first();
  if (!arg || arg.hidden) throw new HttpError(404, 'Argumen tidak ditemukan.');
  if (arg.user_id === user.id) throw new HttpError(403, 'Kamu tidak bisa memberi suara pada argumenmu sendiri.');
  const progress = await getProgress(env, user.id, arg.character_id);
  if (arg.ref > progress) throw new HttpError(403, 'Buka kejadian rujukan argumen ini terlebih dahulu.');
  await rateLimit(env, LIMITS.vote, user.id);

  const res = await env.DB.prepare('INSERT OR IGNORE INTO votes (argument_id, user_id, created_at) VALUES (?, ?, ?)')
    .bind(argId, user.id, now()).run();
  if (res.meta.changes === 0) throw new HttpError(409, 'Kamu sudah memberi suara pada argumen ini.');
  return json({ ok: true });
}

async function reportArgument(request, env, argId) {
  const user = await requireUser(request, env);
  const arg = await env.DB.prepare('SELECT id, user_id, hidden FROM arguments WHERE id = ?').bind(argId).first();
  if (!arg || arg.hidden) throw new HttpError(404, 'Argumen tidak ditemukan.');
  if (arg.user_id === user.id) throw new HttpError(403, 'Tidak bisa melaporkan argumenmu sendiri.');
  await rateLimit(env, LIMITS.report, user.id);

  await env.DB.prepare('INSERT OR IGNORE INTO reports (argument_id, user_id, created_at) VALUES (?, ?, ?)')
    .bind(argId, user.id, now()).run();
  const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM reports WHERE argument_id = ?').bind(argId).first();
  if (count.n >= REPORT_HIDE_THRESHOLD) {
    await env.DB.prepare('UPDATE arguments SET hidden = 1 WHERE id = ?').bind(argId).run();
  }
  return json({ ok: true });
}

// ---------- Routing ----------

async function route(request, env, url) {
  const { pathname } = url;
  const m = request.method;
  checkOrigin(request, url);

  if (pathname === '/api/register' && m === 'POST') return register(request, env);
  if (pathname === '/api/login' && m === 'POST') return login(request, env);
  if (pathname === '/api/logout' && m === 'POST') return logout(request, env);
  if (pathname === '/api/me' && m === 'GET') {
    const user = await currentUser(request, env);
    return json({ user: user ? { id: user.id, username: user.username } : null });
  }
  if (pathname === '/api/characters' && m === 'GET') {
    return json({ characters: CHARACTERS.map(publicCharacterMeta) });
  }

  let match = pathname.match(/^\/api\/characters\/([a-z0-9-]+)$/);
  if (match && m === 'GET') return characterDetail(request, env, url, match[1]);

  match = pathname.match(/^\/api\/characters\/([a-z0-9-]+)\/progress$/);
  if (match && m === 'PUT') return setProgress(request, env, match[1]);

  match = pathname.match(/^\/api\/characters\/([a-z0-9-]+)\/arguments$/);
  if (match && m === 'POST') return postArgument(request, env, match[1]);

  match = pathname.match(/^\/api\/arguments\/([a-f0-9-]+)\/vote$/);
  if (match && m === 'POST') return voteArgument(request, env, match[1]);

  match = pathname.match(/^\/api\/arguments\/([a-f0-9-]+)\/report$/);
  if (match && m === 'POST') return reportArgument(request, env, match[1]);

  throw new HttpError(404, 'Tidak ditemukan.');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      return await route(request, env, url);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error('internal error', err);
      return json({ error: 'Terjadi kesalahan di server.' }, 500);
    }
  },
};
