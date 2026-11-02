CREATE TABLE investment_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 investment_id INTEGER NOT NULL REFERENCES investments(id) ON DELETE RESTRICT,
 user_id INTEGER NOT NULL REFERENCES finance_users(id),
 account_id INTEGER REFERENCES accounts(id) ON DELETE RESTRICT,
 kind TEXT NOT NULL CHECK(kind IN ('initial','deposit','withdrawal','fee','tax')),
 amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
 event_date TEXT NOT NULL,
 request_id TEXT NOT NULL,
 UNIQUE(user_id,request_id)
);
CREATE INDEX idx_investment_events_holding ON investment_events(investment_id,event_date);
