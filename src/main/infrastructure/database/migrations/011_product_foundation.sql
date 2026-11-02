-- Evolução compatível com bancos do esquema 3. Não recria nem apaga registros.
ALTER TABLE accounts ADD COLUMN image_data TEXT;
ALTER TABLE accounts ADD COLUMN due_day INTEGER;
CREATE TABLE balance_adjustments (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES finance_users(id),
 account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
 delta_cents INTEGER NOT NULL CHECK(typeof(delta_cents)='integer'),
 reason TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_balance_adjustment_account ON balance_adjustments(user_id,account_id);
CREATE TABLE onboarding_progress (
 user_id INTEGER PRIMARY KEY REFERENCES finance_users(id) ON DELETE CASCADE,
 current_step INTEGER NOT NULL DEFAULT 0,
 completed_at TEXT
);

INSERT INTO categories(name,type,icon,is_default) SELECT 'Moradia','expense','Home',1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Moradia' AND type='expense' AND is_default=1);
UPDATE categories SET icon='Home' WHERE name='Moradia' AND type='expense' AND is_default=1 AND (icon IS NULL OR icon NOT GLOB '[A-Z]*');

INSERT INTO categories(name,type,icon,is_default) SELECT 'Alimentação','expense','Restaurant',1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Alimentação' AND type='expense' AND is_default=1);
UPDATE categories SET icon='Restaurant' WHERE name='Alimentação' AND type='expense' AND is_default=1 AND (icon IS NULL OR icon NOT GLOB '[A-Z]*');

INSERT INTO categories(name,type,icon,is_default) SELECT 'Transporte','expense','DirectionsCar',1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Transporte' AND type='expense' AND is_default=1);
UPDATE categories SET icon='DirectionsCar' WHERE name='Transporte' AND type='expense' AND is_default=1 AND (icon IS NULL OR icon NOT GLOB '[A-Z]*');

INSERT INTO categories(name,type,icon,is_default) SELECT 'Lazer','expense','SportsEsports',1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Lazer' AND type='expense' AND is_default=1);
UPDATE categories SET icon='SportsEsports' WHERE name='Lazer' AND type='expense' AND is_default=1 AND (icon IS NULL OR icon NOT GLOB '[A-Z]*');

INSERT INTO categories(name,type,icon,is_default) SELECT 'Saúde','expense','LocalHospital',1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Saúde' AND type='expense' AND is_default=1);
UPDATE categories SET icon='LocalHospital' WHERE name='Saúde' AND type='expense' AND is_default=1 AND (icon IS NULL OR icon NOT GLOB '[A-Z]*');

INSERT INTO categories(name,type,icon,is_default) SELECT 'Educação','expense','School',1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Educação' AND type='expense' AND is_default=1);
UPDATE categories SET icon='School' WHERE name='Educação' AND type='expense' AND is_default=1 AND (icon IS NULL OR icon NOT GLOB '[A-Z]*');

INSERT INTO categories(name,type,icon,is_default) SELECT 'Salário','income','Payments',1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Salário' AND type='income' AND is_default=1);
UPDATE categories SET icon='Payments' WHERE name='Salário' AND type='income' AND is_default=1 AND (icon IS NULL OR icon NOT GLOB '[A-Z]*');

INSERT INTO categories(name,type,icon,is_default) SELECT 'Investimentos','income','TrendingUp',1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Investimentos' AND type='income' AND is_default=1);
UPDATE categories SET icon='TrendingUp' WHERE name='Investimentos' AND type='income' AND is_default=1 AND (icon IS NULL OR icon NOT GLOB '[A-Z]*');

INSERT INTO categories(name,type,icon,is_default) SELECT 'Freelas','income','Work',1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Freelas' AND type='income' AND is_default=1);
UPDATE categories SET icon='Work' WHERE name='Freelas' AND type='income' AND is_default=1 AND (icon IS NULL OR icon NOT GLOB '[A-Z]*');

INSERT INTO categories(name,type,icon,is_default) SELECT 'Outros','expense','MoreHoriz',1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Outros' AND type='expense' AND is_default=1);
UPDATE categories SET icon='MoreHoriz' WHERE name='Outros' AND type='expense' AND is_default=1 AND (icon IS NULL OR icon NOT GLOB '[A-Z]*');

UPDATE categories SET icon=CASE icon WHEN 'trending_up' THEN 'TrendingUp' WHEN 'trending_down' THEN 'TrendingDown' ELSE icon END WHERE is_default=1;
