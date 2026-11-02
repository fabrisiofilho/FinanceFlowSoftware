-- Estado financeiro: a competência continua sendo o dia transaction_date.
ALTER TABLE transactions ADD COLUMN status TEXT NOT NULL DEFAULT 'settled' CHECK(status IN ('pending','settled','cancelled'));
ALTER TABLE transactions ADD COLUMN settlement_date DATE;
ALTER TABLE transactions ADD COLUMN origin TEXT NOT NULL DEFAULT 'entry' CHECK(origin IN ('entry','transfer'));
UPDATE transactions SET settlement_date=transaction_date WHERE status='settled';
UPDATE transactions SET origin='transfer' WHERE id IN (SELECT from_transaction_id FROM transfers UNION SELECT to_transaction_id FROM transfers);
CREATE INDEX idx_transactions_settlement ON transactions(status,settlement_date);
ALTER TABLE credit_card_invoices ADD COLUMN payment_date DATE;
