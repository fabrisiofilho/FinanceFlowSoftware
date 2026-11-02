CREATE TABLE emergency_fund_sources (
 account_id INTEGER PRIMARY KEY REFERENCES accounts(id),
 user_id INTEGER NOT NULL REFERENCES finance_users(id)
);
CREATE INDEX idx_emergency_fund_owner ON emergency_fund_sources(user_id,account_id);
