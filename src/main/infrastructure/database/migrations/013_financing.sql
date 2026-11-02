CREATE TABLE financing_contracts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES finance_users(id),
 name TEXT NOT NULL, creditor TEXT NOT NULL,
 account_id INTEGER NOT NULL REFERENCES accounts(id),
 category_id INTEGER NOT NULL REFERENCES categories(id),
 method TEXT NOT NULL CHECK(method IN ('MANUAL','SAC','PRICE')),
 principal_cents INTEGER NOT NULL CHECK(principal_cents>=0),
 terms_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE financing_installments (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 contract_id INTEGER NOT NULL REFERENCES financing_contracts(id),
 number INTEGER NOT NULL, due_date TEXT NOT NULL,
 principal_cents INTEGER NOT NULL, interest_cents INTEGER NOT NULL,
 fees_cents INTEGER NOT NULL, total_cents INTEGER NOT NULL CHECK(total_cents>0),
 UNIQUE(contract_id,number)
);
CREATE TABLE financing_payments (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 installment_id INTEGER NOT NULL REFERENCES financing_installments(id),
 user_id INTEGER NOT NULL REFERENCES finance_users(id),
 paid_at TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
 principal_cents INTEGER NOT NULL CHECK(principal_cents>=0 AND principal_cents<=amount_cents),
 principal_transaction_id INTEGER REFERENCES transactions(id),
 cost_transaction_id INTEGER REFERENCES transactions(id),
 request_id TEXT NOT NULL, reversed INTEGER NOT NULL DEFAULT 0,
 UNIQUE(user_id,request_id)
);
CREATE TABLE financing_revisions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 contract_id INTEGER NOT NULL REFERENCES financing_contracts(id),
 installment_id INTEGER REFERENCES financing_installments(id),
 old_total_cents INTEGER, new_total_cents INTEGER, reason TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_financing_owner ON financing_contracts(user_id,id);
CREATE INDEX idx_financing_due ON financing_installments(contract_id,due_date,id);
CREATE INDEX idx_financing_payment ON financing_payments(installment_id,reversed);
CREATE TRIGGER financing_protect_update BEFORE UPDATE ON transactions
WHEN EXISTS(SELECT 1 FROM financing_payments p WHERE p.reversed=0 AND (p.principal_transaction_id=OLD.id OR p.cost_transaction_id=OLD.id))
BEGIN SELECT RAISE(ABORT,'Estorne o pagamento na área Financiamentos.'); END;
CREATE TRIGGER financing_protect_delete BEFORE DELETE ON transactions
WHEN EXISTS(SELECT 1 FROM financing_payments p WHERE p.principal_transaction_id=OLD.id OR p.cost_transaction_id=OLD.id)
BEGIN SELECT RAISE(ABORT,'Pagamento vinculado a financiamento.'); END;
