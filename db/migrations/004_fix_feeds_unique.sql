-- Fix feeds table: make name the UNIQUE key instead of url
CREATE TABLE IF NOT EXISTS feeds_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  url TEXT,
  last_fetched TIMESTAMP,
  last_updated TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO feeds_new (id, name, url, last_fetched, last_updated, status, created_at)
  SELECT id, name, url, last_fetched, last_updated, status, created_at FROM feeds;

DROP TABLE IF EXISTS feeds;
ALTER TABLE feeds_new RENAME TO feeds;
