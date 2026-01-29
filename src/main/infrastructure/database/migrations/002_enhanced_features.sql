-- Migration: 002_enhanced_features
-- Description: Enhanced features - Budget, Tags, Attachments, Transfers, Currencies, Recurring, Cash Flow, Notifications
-- Created: 2026-01-29

-- ============================================
-- TABLE: currencies
-- Description: Stores supported currencies
-- ============================================
CREATE TABLE IF NOT EXISTS currencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    decimal_places INTEGER DEFAULT 2,
    is_default INTEGER DEFAULT 0,
    exchange_rate DECIMAL(18, 8) DEFAULT 1,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_is_default ON currencies(is_default);

-- Insert default currency (BRL)
INSERT OR IGNORE INTO currencies (code, name, symbol, decimal_places, is_default, exchange_rate) 
VALUES ('BRL', 'Real Brasileiro', 'R$', 2, 1, 1);

INSERT OR IGNORE INTO currencies (code, name, symbol, decimal_places, is_default, exchange_rate) 
VALUES ('USD', 'Dólar Americano', '$', 2, 0, 5.50);

INSERT OR IGNORE INTO currencies (code, name, symbol, decimal_places, is_default, exchange_rate) 
VALUES ('EUR', 'Euro', '€', 2, 0, 6.00);

-- ============================================
-- TABLE: tags
-- Description: Stores transaction tags/labels
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES finance_users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- ============================================
-- TABLE: transaction_tags
-- Description: Many-to-many relationship between transactions and tags
-- ============================================
CREATE TABLE IF NOT EXISTS transaction_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(transaction_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction_id ON transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag_id ON transaction_tags(tag_id);

-- ============================================
-- TABLE: attachments
-- Description: Stores transaction attachments (receipts, invoices, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_transaction_id ON attachments(transaction_id);

-- ============================================
-- TABLE: transfers
-- Description: Stores transfers between accounts
-- ============================================
CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    from_account_id INTEGER NOT NULL,
    to_account_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    from_currency_id INTEGER,
    to_currency_id INTEGER,
    exchange_rate DECIMAL(18, 8) DEFAULT 1,
    converted_amount DECIMAL(10, 2),
    description TEXT,
    transfer_date DATE NOT NULL,
    from_transaction_id INTEGER,
    to_transaction_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES finance_users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (from_currency_id) REFERENCES currencies(id) ON DELETE SET NULL,
    FOREIGN KEY (to_currency_id) REFERENCES currencies(id) ON DELETE SET NULL,
    FOREIGN KEY (from_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (to_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_account_id ON transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_account_id ON transfers(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_transfer_date ON transfers(transfer_date);

-- ============================================
-- TABLE: budgets
-- Description: Monthly budgets per category
-- ============================================
CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    planned_amount DECIMAL(10, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES finance_users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(user_id, category_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_year_month ON budgets(year, month);

-- ============================================
-- TABLE: recurring_transactions
-- Description: Templates for recurring transactions
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    payment_method TEXT CHECK(payment_method IN ('credit', 'debit', 'pix', 'cash')),
    expense_type TEXT CHECK(expense_type IN ('fixed', 'variable')),
    frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
    day_of_month INTEGER,
    day_of_week INTEGER,
    account_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_occurrence DATE NOT NULL,
    last_generated DATE,
    is_active INTEGER DEFAULT 1,
    auto_confirm INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES finance_users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_occurrence ON recurring_transactions(next_occurrence);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_is_active ON recurring_transactions(is_active);

-- ============================================
-- TABLE: notifications
-- Description: Desktop notifications queue
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('bill_due', 'budget_exceeded', 'goal_reached', 'recurring_generated', 'low_balance', 'invoice_closing', 'custom')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    reference_type TEXT,
    reference_id INTEGER,
    is_read INTEGER DEFAULT 0,
    is_dismissed INTEGER DEFAULT 0,
    scheduled_at DATETIME,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES finance_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at);

-- ============================================
-- TABLE: notification_settings
-- Description: User notification preferences
-- ============================================
CREATE TABLE IF NOT EXISTS notification_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    bill_due_enabled INTEGER DEFAULT 1,
    bill_due_days_before INTEGER DEFAULT 3,
    budget_exceeded_enabled INTEGER DEFAULT 1,
    budget_threshold_percent INTEGER DEFAULT 80,
    goal_reached_enabled INTEGER DEFAULT 1,
    recurring_generated_enabled INTEGER DEFAULT 1,
    low_balance_enabled INTEGER DEFAULT 1,
    low_balance_threshold DECIMAL(10, 2) DEFAULT 100,
    invoice_closing_enabled INTEGER DEFAULT 1,
    invoice_closing_days_before INTEGER DEFAULT 5,
    sound_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES finance_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- ============================================
-- TABLE: bank_imports
-- Description: Bank statement imports (Santander OFX/CSV)
-- ============================================
CREATE TABLE IF NOT EXISTS bank_imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    bank_code TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK(file_type IN ('ofx', 'csv', 'xlsx')),
    import_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    start_date DATE,
    end_date DATE,
    total_transactions INTEGER DEFAULT 0,
    imported_count INTEGER DEFAULT 0,
    duplicate_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES finance_users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bank_imports_user_id ON bank_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_imports_account_id ON bank_imports(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_imports_status ON bank_imports(status);

-- ============================================
-- TABLE: bank_import_transactions
-- Description: Imported transactions pending reconciliation
-- ============================================
CREATE TABLE IF NOT EXISTS bank_import_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_id INTEGER NOT NULL,
    external_id TEXT,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    raw_data TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'imported', 'ignored', 'duplicate')),
    matched_transaction_id INTEGER,
    suggested_category_id INTEGER,
    confidence_score DECIMAL(5, 2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_id) REFERENCES bank_imports(id) ON DELETE CASCADE,
    FOREIGN KEY (matched_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (suggested_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bank_import_transactions_import_id ON bank_import_transactions(import_id);
CREATE INDEX IF NOT EXISTS idx_bank_import_transactions_status ON bank_import_transactions(status);
CREATE INDEX IF NOT EXISTS idx_bank_import_transactions_external_id ON bank_import_transactions(external_id);

-- ============================================
-- ALTER: Add currency_id to accounts
-- ============================================
ALTER TABLE accounts ADD COLUMN currency_id INTEGER REFERENCES currencies(id) ON DELETE SET NULL;

-- ============================================
-- ALTER: Add reconciliation fields to transactions
-- ============================================
ALTER TABLE transactions ADD COLUMN is_confirmed INTEGER DEFAULT 1;
ALTER TABLE transactions ADD COLUMN bank_reference TEXT;
ALTER TABLE transactions ADD COLUMN import_id INTEGER REFERENCES bank_imports(id) ON DELETE SET NULL;

-- ============================================
-- ALTER: Add transfer_id to transactions
-- ============================================
ALTER TABLE transactions ADD COLUMN transfer_id INTEGER REFERENCES transfers(id) ON DELETE SET NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_transactions_is_confirmed ON transactions(is_confirmed);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_reference ON transactions(bank_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON transactions(transfer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_currency_id ON accounts(currency_id);
