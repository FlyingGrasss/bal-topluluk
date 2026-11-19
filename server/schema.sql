PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
PRAGMA user_version = 1;

CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 60),
  slug TEXT NOT NULL UNIQUE CHECK (length(slug) BETWEEN 2 AND 60),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 10 AND 1200),
  category TEXT NOT NULL CHECK (
    category IN ('müzik', 'spor', 'bilim', 'sanat', 'girişim', 'diğer')
  ),
  meeting_note TEXT NOT NULL DEFAULT '' CHECK (length(meeting_note) <= 200),
  contact TEXT NOT NULL DEFAULT '' CHECK (length(contact) <= 120),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clubs_category ON clubs(category);
CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs(name);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL CHECK (length(author_name) BETWEEN 2 AND 40),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 120),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 10 AND 4000),
  category TEXT NOT NULL CHECK (
    category IN ('duyuru', 'etkinlik', 'soru', 'genel')
  ),
  pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_board
  ON posts(pinned DESC, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category
  ON posts(category, pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_club
  ON posts(club_id, pinned DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 120),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 10 AND 800),
  starts_at INTEGER NOT NULL,
  location TEXT NOT NULL CHECK (length(location) BETWEEN 2 AND 120),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_club_starts_at
  ON events(club_id, starts_at);
