ALTER TABLE transactions ADD COLUMN recurring_rule_id INTEGER REFERENCES recurring_transactions(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX idx_transaction_occurrence ON transactions(recurring_rule_id,transaction_date) WHERE recurring_rule_id IS NOT NULL;
