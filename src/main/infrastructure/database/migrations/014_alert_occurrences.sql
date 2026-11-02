CREATE TABLE alert_occurrences (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES finance_users(id),
 rule_id INTEGER NOT NULL,
 period TEXT NOT NULL,
 severity TEXT NOT NULL CHECK(severity IN ('warning','critical')),
 category_name TEXT NOT NULL,
 percentage REAL NOT NULL,
 state TEXT NOT NULL DEFAULT 'active' CHECK(state IN ('active','resolved','dismissed')),
 condition_active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(user_id,rule_id,period,severity)
);
CREATE INDEX idx_alert_occurrence_owner ON alert_occurrences(user_id,state,id);
