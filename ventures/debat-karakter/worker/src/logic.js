// Logika murni (tanpa I/O) untuk Sidang Karakter. Dipakai oleh Worker dan diuji dengan node.

export const STANCES = ['pro', 'kontra'];
export const ARG_MIN = 20;
export const ARG_MAX = 600;

// Anti-spoiler: hanya kejadian sampai titik `at` yang boleh tampil.
export function visibleEvents(events, at) {
  return events.filter((e) => e.at <= at);
}

// Ubah input at/progres menjadi bilangan bulat dalam rentang [0, maxAt]. Mengembalikan null jika tidak valid.
export function parseAt(raw, maxAt) {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > maxAt) return null;
  return n;
}

// Buang karakter kontrol, normalisasi baris baru, dan potong spasi di ujung.
export function sanitizeText(s) {
  return String(s ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .trim();
}

// Validasi argumen. `progress` adalah titik terakhir yang sudah dicapai penulis.
export function validateArgument(input, { maxAt, progress }) {
  const errors = [];
  const stance = input?.stance;
  const text = sanitizeText(input?.text);
  const ref = Number(input?.ref);

  if (!STANCES.includes(stance)) errors.push('Pilih pro atau kontra.');
  if (text.length < ARG_MIN) errors.push(`Argumen minimal ${ARG_MIN} karakter.`);
  if (text.length > ARG_MAX) errors.push(`Argumen maksimal ${ARG_MAX} karakter.`);
  if (!Number.isInteger(ref) || ref < 1 || ref > maxAt) {
    errors.push('Rujukan titik tidak valid.');
  } else if (ref > progress) {
    errors.push('Kamu hanya bisa merujuk kejadian yang sudah kamu tandai sebagai dibuka.');
  }
  return { valid: errors.length === 0, errors, clean: { stance, ref, text } };
}

// Username: huruf kecil, angka, dan garis bawah, 3 sampai 20 karakter.
export function validateUsername(u) {
  return typeof u === 'string' && /^[a-z0-9_]{3,20}$/.test(u);
}

export function validatePassword(p) {
  return typeof p === 'string' && p.length >= 8 && p.length <= 200;
}

// Ringkasan papan debat: jumlah argumen dan suara per posisi.
export function summarizeDebate(args) {
  let pro = 0, kontra = 0, proVotes = 0, kontraVotes = 0;
  for (const a of args) {
    const v = Number(a.votes) || 0;
    if (a.stance === 'pro') { pro++; proVotes += v; }
    else if (a.stance === 'kontra') { kontra++; kontraVotes += v; }
  }
  let leading = 'seimbang';
  if (proVotes > kontraVotes) leading = 'pro';
  else if (kontraVotes > proVotes) leading = 'kontra';
  return { pro, kontra, proVotes, kontraVotes, leading };
}

// Urutkan: suara terbanyak dulu, lalu yang terbaru.
export function sortArguments(args) {
  return args.slice().sort((a, b) => {
    if ((b.votes || 0) !== (a.votes || 0)) return (b.votes || 0) - (a.votes || 0);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}
