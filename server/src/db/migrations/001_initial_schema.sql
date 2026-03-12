CREATE TABLE IF NOT EXISTS import_batch (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_file_name TEXT NOT NULL,
  source_file_hash TEXT NOT NULL,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS import_reject (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES import_batch(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raw_task_import (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES import_batch(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  source_record_id TEXT,
  title_raw TEXT,
  category_raw TEXT,
  effort_raw TEXT,
  status_raw TEXT,
  due_raw TEXT,
  source_path_raw TEXT,
  raw_payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS core_task (
  id TEXT PRIMARY KEY,
  source_system TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  effort TEXT NOT NULL CHECK (effort IN ('low', 'medium', 'high')),
  status TEXT NOT NULL CHECK (status IN ('ready', 'active', 'waiting')),
  due_date TEXT,
  scheduled_at TEXT,
  completed_at TEXT,
  source_path TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_system, source_record_id)
);

CREATE TABLE IF NOT EXISTS core_account (
  id TEXT PRIMARY KEY,
  source_system TEXT NOT NULL,
  source_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  institution TEXT,
  account_type TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_system, source_account_id)
);

CREATE TABLE IF NOT EXISTS raw_transaction_import (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES import_batch(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  source_record_id TEXT,
  account_ref_raw TEXT,
  posted_at_raw TEXT,
  description_raw TEXT,
  amount_raw TEXT,
  balance_raw TEXT,
  category_raw TEXT,
  raw_payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS core_transaction (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES core_account(id),
  source_system TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  posted_at TEXT NOT NULL,
  settled_at TEXT,
  description TEXT NOT NULL,
  merchant TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  direction TEXT NOT NULL CHECK (direction IN ('debit', 'credit')),
  balance_minor INTEGER,
  note TEXT,
  dedupe_hash TEXT NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_system, source_record_id)
);

CREATE TABLE IF NOT EXISTS raw_health_import (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES import_batch(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  source_record_id TEXT,
  day_raw TEXT,
  metric_payload_json TEXT,
  raw_payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS core_daily_health (
  day TEXT PRIMARY KEY,
  source_system TEXT NOT NULL,
  steps INTEGER NOT NULL DEFAULT 0,
  active_calories INTEGER,
  resting_heart_rate REAL,
  hrv_ms REAL,
  sleep_minutes INTEGER,
  workout_minutes INTEGER,
  body_weight_kg REAL,
  recovery_score INTEGER,
  oxygen_saturation_pct REAL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raw_mood_import (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES import_batch(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  source_record_id TEXT,
  entry_at_raw TEXT,
  mood_raw TEXT,
  energy_raw TEXT,
  stress_raw TEXT,
  tags_raw TEXT,
  note_raw TEXT,
  raw_payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS core_mood_entry (
  id TEXT PRIMARY KEY,
  source_system TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  entry_at TEXT NOT NULL,
  day TEXT NOT NULL,
  mood_score REAL NOT NULL,
  energy_score INTEGER,
  stress_score INTEGER,
  tags_json TEXT,
  note TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_system, source_record_id)
);

CREATE INDEX IF NOT EXISTS idx_core_task_status_due_date ON core_task(status, due_date);
CREATE INDEX IF NOT EXISTS idx_core_task_category ON core_task(category);
CREATE INDEX IF NOT EXISTS idx_core_transaction_posted_at ON core_transaction(posted_at);
CREATE INDEX IF NOT EXISTS idx_core_transaction_account_posted_at ON core_transaction(account_id, posted_at);
CREATE INDEX IF NOT EXISTS idx_core_mood_entry_day ON core_mood_entry(day);
CREATE INDEX IF NOT EXISTS idx_core_mood_entry_entry_at ON core_mood_entry(entry_at);

CREATE VIEW IF NOT EXISTS vw_task_summary AS
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) AS ready_count,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
  SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) AS waiting_count
FROM core_task
WHERE is_archived = 0;

CREATE VIEW IF NOT EXISTS vw_finance_overview AS
SELECT
  COALESCE((
    SELECT SUM(amount_minor)
    FROM core_transaction
    WHERE direction = 'debit'
      AND posted_at >= date('now', 'localtime', 'start of month')
  ), 0) AS current_month_spend_minor,
  COALESCE((
    SELECT SUM(amount_minor)
    FROM core_transaction
    WHERE direction = 'credit'
      AND posted_at >= date('now', 'localtime', 'start of month')
  ), 0) AS current_month_income_minor;

CREATE VIEW IF NOT EXISTS vw_health_overview AS
SELECT
  day AS latest_day,
  steps AS latest_steps,
  active_calories AS latest_active_calories,
  hrv_ms AS latest_hrv_ms,
  resting_heart_rate AS latest_resting_heart_rate,
  oxygen_saturation_pct AS latest_oxygen_saturation_pct
FROM core_daily_health
ORDER BY day DESC
LIMIT 1;

CREATE VIEW IF NOT EXISTS vw_mood_overview AS
SELECT
  entry_at AS latest_entry_at,
  mood_score AS latest_mood_score,
  energy_score AS latest_energy_score,
  stress_score AS latest_stress_score
FROM core_mood_entry
ORDER BY entry_at DESC
LIMIT 1;

INSERT OR IGNORE INTO core_task (
  id,
  source_system,
  source_record_id,
  title,
  summary,
  category,
  effort,
  status,
  due_date,
  source_path
) VALUES
  ('task-career-nab-g4', 'obsidian', 'nab-g4-cv', 'Update CV for NAB G4 Role', 'Refine impact metrics and align the profile with governance, controls, and operational risk language.', 'Career Transition', 'high', 'ready', date('now', 'localtime'), 'Projects/Career Transition/NAB G4 Role.md'),
  ('task-dichotomy-card-backs', 'obsidian', 'dichotomy-card-backs', 'Finalise Dichotomy Card Backs', 'Lock the back design system and export a print-ready revision with consistent hierarchy.', 'Creativity', 'medium', 'active', date('now', 'localtime', '+3 days'), 'Projects/Creativity/Dichotomy Deck.md'),
  ('task-health-rebate', 'obsidian', 'health-rebate', 'Submit Health Rebate', 'Upload the latest invoice set and clear the outstanding reimbursement before month-end.', 'Admin', 'low', 'ready', date('now', 'localtime'), 'Areas/Admin/Claims.md'),
  ('task-strength-block', 'obsidian', 'strength-block', 'Schedule Next Strength Block', 'Review physio guidance and sequence the next two-week program around recovery capacity.', 'Health', 'medium', 'waiting', date('now', 'localtime', '+1 day'), 'Areas/Health/Training Program.md'),
  ('task-budget-audit', 'obsidian', 'budget-audit', 'Reconcile February Budget Drift', 'Check discretionary overspend, update categories, and reset the daily runway for March.', 'Finance', 'medium', 'ready', date('now', 'localtime', '+2 days'), 'Areas/Finance/Budget Review.md'),
  ('task-follow-up-recruiter', 'obsidian', 'recruiter-follow-up', 'Follow Up With Recruiter', 'Send a short update on availability, role fit, and interview timeline for current leads.', 'Career Transition', 'low', 'waiting', date('now', 'localtime'), 'Areas/Career/Conversations.md'),
  ('task-research-automation', 'obsidian', 'task-export-options', 'Map Obsidian Task Export Options', 'Compare JSON export, plugin-based sync, and local API approaches for feeding the dashboard.', 'Systems', 'high', 'active', date('now', 'localtime', '+4 days'), 'Projects/Systems/Task Sync.md'),
  ('task-weekly-reset', 'obsidian', 'weekly-reset', 'Weekly Apartment Reset', 'Clear surfaces, reset laundry, and prep the environment for a lower-friction work week.', 'Home', 'low', 'ready', date('now', 'localtime', '+5 days'), 'Areas/Home/Routines.md'),
  ('task-dichotomy-landing', 'obsidian', 'dichotomy-landing-copy', 'Draft Dichotomy Landing Page Copy', 'Write the narrative arc, offer framing, and primary CTA blocks for the first public page.', 'Creativity', 'high', 'ready', date('now', 'localtime', '+2 days'), 'Projects/Creativity/Dichotomy Launch.md');

INSERT OR IGNORE INTO core_account (
  id,
  source_system,
  source_account_id,
  name,
  institution,
  account_type
) VALUES
  ('acct-checking', 'manual', 'checking-main', 'Everyday Account', 'Local Bank', 'transaction'),
  ('acct-savings', 'manual', 'savings-main', 'Savings Buffer', 'Local Bank', 'savings');

INSERT OR IGNORE INTO core_transaction (
  id,
  account_id,
  source_system,
  source_record_id,
  posted_at,
  description,
  merchant,
  category,
  amount_minor,
  direction,
  balance_minor,
  dedupe_hash
) VALUES
  ('txn-salary-001', 'acct-checking', 'manual', 'salary-001', date('now', 'localtime', 'start of month', '+1 day'), 'Salary Payment', 'Employer', 'Income', 360000, 'credit', 1185000, 'salary-001'),
  ('txn-rent-001', 'acct-checking', 'manual', 'rent-001', date('now', 'localtime', 'start of month', '+2 day'), 'Monthly Rent', 'Landlord', 'Rent', 120000, 'debit', 1065000, 'rent-001'),
  ('txn-groceries-001', 'acct-checking', 'manual', 'groceries-001', date('now', 'localtime', '-6 day'), 'Groceries', 'Market Hall', 'Groceries', 4500, 'debit', 940500, 'groceries-001'),
  ('txn-recovery-001', 'acct-checking', 'manual', 'recovery-001', date('now', 'localtime', '-5 day'), 'Recovery Session', 'Physio Clinic', 'Recovery/Health', 2000, 'debit', 938500, 'recovery-001'),
  ('txn-rent-topup-001', 'acct-checking', 'manual', 'rent-topup-001', date('now', 'localtime', '-4 day'), 'Quarterly Utilities', 'Energy Provider', 'Rent', 12000, 'debit', 926500, 'rent-topup-001'),
  ('txn-subscriptions-001', 'acct-checking', 'manual', 'subscriptions-001', date('now', 'localtime', '-3 day'), 'Subscriptions', 'Software Bundle', 'Subscriptions', 1500, 'debit', 925000, 'subscriptions-001'),
  ('txn-discretionary-001', 'acct-checking', 'manual', 'discretionary-001', date('now', 'localtime', '-2 day'), 'Dinner Out', 'Restaurant', 'Discretionary', 3000, 'debit', 922000, 'discretionary-001'),
  ('txn-groceries-002', 'acct-checking', 'manual', 'groceries-002', date('now', 'localtime', '-1 day'), 'Groceries Top-Up', 'Market Hall', 'Groceries', 8500, 'debit', 913500, 'groceries-002'),
  ('txn-recovery-002', 'acct-checking', 'manual', 'recovery-002', date('now', 'localtime'), 'Supplement Refill', 'Pharmacy', 'Recovery/Health', 4000, 'debit', 909500, 'recovery-002'),
  ('txn-rent-annual-001', 'acct-checking', 'manual', 'rent-annual-001', date('now', 'localtime', 'start of month', '+5 day'), 'Furniture Storage', 'Storage Co', 'Rent', 108000, 'debit', 801500, 'rent-annual-001'),
  ('txn-discretionary-002', 'acct-checking', 'manual', 'discretionary-002', date('now', 'localtime', 'start of month', '+6 day'), 'Books and Supplies', 'Bookshop', 'Discretionary', 22000, 'debit', 779500, 'discretionary-002'),
  ('txn-savings-snapshot-001', 'acct-savings', 'manual', 'savings-snapshot-001', date('now', 'localtime'), 'Savings Balance Snapshot', 'Local Bank', 'Transfer', 0, 'credit', 465500, 'savings-snapshot-001');

INSERT OR IGNORE INTO core_daily_health (
  day,
  source_system,
  steps,
  active_calories,
  resting_heart_rate,
  hrv_ms,
  sleep_minutes,
  workout_minutes,
  oxygen_saturation_pct
) VALUES
  (date('now', 'localtime', '-6 day'), 'manual', 6200, 2100, 62, 55, 440, 40, 98),
  (date('now', 'localtime', '-5 day'), 'manual', 8400, 2350, 58, 62, 455, 50, 98),
  (date('now', 'localtime', '-4 day'), 'manual', 3100, 1800, 68, 45, 390, 10, 97),
  (date('now', 'localtime', '-3 day'), 'manual', 7800, 2200, 60, 58, 430, 35, 98),
  (date('now', 'localtime', '-2 day'), 'manual', 9200, 2500, 55, 70, 470, 60, 99),
  (date('now', 'localtime', '-1 day'), 'manual', 5500, 2000, 64, 52, 410, 20, 98),
  (date('now', 'localtime'), 'manual', 8402, 2140, 59, 62, 450, 30, 98);

INSERT OR IGNORE INTO core_mood_entry (
  id,
  source_system,
  source_record_id,
  entry_at,
  day,
  mood_score,
  energy_score,
  stress_score,
  tags_json,
  note
) VALUES
  ('mood-001', 'manual', 'mood-001', datetime('now', 'localtime', '-6 day', '18:00'), date('now', 'localtime', '-6 day'), 6.0, 6, 4, '["baseline"]', 'Settling into the week.'),
  ('mood-002', 'manual', 'mood-002', datetime('now', 'localtime', '-5 day', '18:10'), date('now', 'localtime', '-5 day'), 8.0, 8, 3, '["training"]', 'Strong day after recovery work.'),
  ('mood-003', 'manual', 'mood-003', datetime('now', 'localtime', '-4 day', '18:15'), date('now', 'localtime', '-4 day'), 4.0, 4, 7, '["fatigue"]', 'Low mood after a compressed work block.'),
  ('mood-004', 'manual', 'mood-004', datetime('now', 'localtime', '-3 day', '18:20'), date('now', 'localtime', '-3 day'), 7.0, 7, 4, '["stable"]', 'Recovered by the evening.'),
  ('mood-005', 'manual', 'mood-005', datetime('now', 'localtime', '-2 day', '18:30'), date('now', 'localtime', '-2 day'), 9.0, 9, 2, '["creative"]', 'High-energy creative day.'),
  ('mood-006', 'manual', 'mood-006', datetime('now', 'localtime', '-1 day', '18:10'), date('now', 'localtime', '-1 day'), 5.0, 5, 5, '["reset"]', 'Evening reset helped.'),
  ('mood-007', 'manual', 'mood-007', datetime('now', 'localtime', '18:15'), date('now', 'localtime'), 7.2, 7, 3, '["focused"]', 'Good energy for concentrated work.');
