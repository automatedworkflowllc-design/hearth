ALTER TABLE resources
  ADD COLUMN contacts_json TEXT NOT NULL DEFAULT '[]';
