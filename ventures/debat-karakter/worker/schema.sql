-- Skema Sidang Karakter (D1 / SQLite)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Token sesi disimpan dalam bentuk hash SHA-256, bukan token asli.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

-- Progres per pengguna per karakter (episode/titik terakhir yang sudah ditandai).
CREATE TABLE IF NOT EXISTS progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (user_id, character_id)
);

CREATE TABLE IF NOT EXISTS arguments (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stance TEXT NOT NULL CHECK (stance IN ('pro', 'kontra')),
  ref INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_arguments_char ON arguments (character_id, hidden, ref);

-- Satu akun hanya bisa memberi satu suara per argumen.
CREATE TABLE IF NOT EXISTS votes (
  argument_id TEXT NOT NULL REFERENCES arguments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (argument_id, user_id)
);

-- Satu akun hanya bisa melaporkan satu argumen sekali.
-- Argumen disembunyikan otomatis setelah REPORT_HIDE_THRESHOLD laporan dari akun berbeda.
CREATE TABLE IF NOT EXISTS reports (
  argument_id TEXT NOT NULL REFERENCES arguments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (argument_id, user_id)
);

-- Pembatas laju sederhana (fixed window) untuk registrasi, login, posting, vote, dan laporan.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);
