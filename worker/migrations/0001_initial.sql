PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_updated_at TEXT,
  fetched_at TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude REAL,
  longitude REAL,
  phone TEXT,
  website TEXT,
  hours_text TEXT NOT NULL DEFAULT 'Call to confirm current hours.',
  eligibility TEXT,
  services_json TEXT NOT NULL DEFAULT '[]',
  tags_json TEXT NOT NULL DEFAULT '[]',
  search_text TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'exception',
  review_note TEXT,
  reviewed_at TEXT NOT NULL,
  review_due_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  UNIQUE (source_name, source_record_id)
);

CREATE INDEX IF NOT EXISTS resources_active_category_idx
  ON resources (active, category);
CREATE INDEX IF NOT EXISTS resources_active_zip_idx
  ON resources (active, zip_code);
CREATE INDEX IF NOT EXISTS resources_active_city_state_idx
  ON resources (active, city, state);
CREATE INDEX IF NOT EXISTS resources_active_coordinates_idx
  ON resources (active, latitude, longitude);
CREATE INDEX IF NOT EXISTS resources_source_idx
  ON resources (source_name, fetched_at);

CREATE TABLE IF NOT EXISTS zip_centroids (
  zip_code TEXT PRIMARY KEY,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  source_name TEXT NOT NULL,
  source_year INTEGER NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_runs (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  source_url TEXT NOT NULL,
  imported_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed'))
);
