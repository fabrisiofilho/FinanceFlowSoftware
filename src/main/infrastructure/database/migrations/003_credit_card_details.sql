-- Migration: Add credit card details (color, brand, bank)
-- Version: 003

-- Add card_color column to accounts
ALTER TABLE accounts ADD COLUMN card_color TEXT;

-- Add card_brand column to accounts
ALTER TABLE accounts ADD COLUMN card_brand TEXT;

-- Add bank_name column to accounts
ALTER TABLE accounts ADD COLUMN bank_name TEXT;
