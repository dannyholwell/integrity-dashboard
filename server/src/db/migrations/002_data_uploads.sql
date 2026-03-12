CREATE TABLE IF NOT EXISTS data_upload (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL CHECK (domain IN ('tasks', 'finance', 'health', 'mood')),
  original_file_name TEXT NOT NULL,
  stored_file_name TEXT NOT NULL,
  relative_path TEXT NOT NULL UNIQUE,
  file_size_bytes INTEGER NOT NULL,
  date_range_start TEXT,
  date_range_end TEXT,
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
