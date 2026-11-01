CREATE TABLE investments (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES finance_users(id) ON DELETE CASCADE,
 name TEXT NOT NULL,
 kind TEXT NOT NULL,
 principal_cents INTEGER NOT NULL CHECK(principal_cents > 0),
 start_month TEXT NOT NULL,
 monthly_rate REAL NOT NULL DEFAULT 0
);
CREATE TABLE investment_yields (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 investment_id INTEGER NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
 month TEXT NOT NULL,
 amount_cents INTEGER NOT NULL,
 UNIQUE(investment_id,month)
);
CREATE INDEX idx_investments_user ON investments(user_id);
