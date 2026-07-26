ALTER TABLE resources
  ADD COLUMN availability_start TEXT;

ALTER TABLE resources
  ADD COLUMN availability_end TEXT;

CREATE INDEX IF NOT EXISTS resources_active_availability_idx
  ON resources (active, availability_start, availability_end);
