-- Migration: 001_finance_flow_schema
-- Description: FinanceFlow database schema for personal finance management
-- Created: 2026-01-28

-- ============================================
-- TABLE: migrations
-- Description: Tracks applied migrations
-- ============================================
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: finance_users
-- Description: Stores user information with secure password storage
-- ============================================
CREATE TABLE IF NOT EXISTS finance_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finance_users_email ON finance_users(email);

-- ============================================
-- TABLE: accounts
-- Description: Stores financial accounts (checking, savings, credit card, wallet)
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('checking', 'savings', 'credit_card', 'wallet')),
    balance INTEGER DEFAULT 0 CHECK (balance IS NULL OR typeof(balance)='integer'),
    credit_limit INTEGER CHECK (credit_limit IS NULL OR typeof(credit_limit)='integer'),
    closing_day INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES finance_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);

-- ============================================
-- TABLE: categories
-- Description: Stores transaction categories (income/expense)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    icon TEXT,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES finance_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_is_default ON categories(is_default);

-- ============================================
-- TABLE: credit_card_invoices
-- Description: Stores credit card invoices/statements
-- ============================================
CREATE TABLE IF NOT EXISTS credit_card_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_amount INTEGER DEFAULT 0 CHECK (total_amount IS NULL OR typeof(total_amount)='integer'),
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'paid')),
    paid_at DATETIME,
    payment_account_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_card_invoices_account_id ON credit_card_invoices(account_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoices_year_month ON credit_card_invoices(year, month);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoices_status ON credit_card_invoices(status);
CREATE INDEX IF NOT EXISTS idx_credit_card_invoices_due_date ON credit_card_invoices(due_date);

-- ============================================
-- TABLE: transactions
-- Description: Stores all financial transactions (income and expenses)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount IS NULL OR typeof(amount)='integer'),
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    payment_method TEXT CHECK(payment_method IN ('credit', 'debit', 'pix', 'cash')),
    expense_type TEXT CHECK(expense_type IN ('fixed', 'variable')),
    transaction_date DATE NOT NULL,
    due_date DATE,
    installment_number INTEGER,
    total_installments INTEGER,
    installment_group_id TEXT,
    recurrence TEXT CHECK(recurrence IN ('once', 'monthly', 'weekly')),
    account_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    credit_card_invoice_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (credit_card_invoice_id) REFERENCES credit_card_invoices(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_credit_card_invoice_id ON transactions(credit_card_invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_installment_group_id ON transactions(installment_group_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recurrence ON transactions(recurrence);

-- ============================================
-- TABLE: goals
-- Description: Stores financial goals/savings targets
-- ============================================
CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target_amount INTEGER NOT NULL CHECK (target_amount IS NULL OR typeof(target_amount)='integer'),
    current_amount INTEGER DEFAULT 0 CHECK (current_amount IS NULL OR typeof(current_amount)='integer'),
    deadline DATE,
    account_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES finance_users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_account_id ON goals(account_id);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);

-- ============================================
-- TABLE: goal_contributions
-- Description: Stores contributions made to financial goals
-- ============================================
CREATE TABLE IF NOT EXISTS goal_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    amount INTEGER NOT NULL CHECK (amount IS NULL OR typeof(amount)='integer'),
    contribution_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_contribution_date ON goal_contributions(contribution_date);

-- ============================================
-- TABLE: alerts
-- Description: Stores spending alerts/limits per category
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    limit_amount INTEGER NOT NULL CHECK (limit_amount IS NULL OR typeof(limit_amount)='integer'),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES finance_users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_category_id ON alerts(category_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts(is_active);
