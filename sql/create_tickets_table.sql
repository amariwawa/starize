-- Migration: Add ticket delivery columns to the existing tickets table
-- Run this in your Supabase SQL Editor

-- 1. Add new columns for ticket delivery
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS buyer_name TEXT,
  ADD COLUMN IF NOT EXISTS buyer_email TEXT,
  ADD COLUMN IF NOT EXISTS ticket_tier TEXT,
  ADD COLUMN IF NOT EXISTS ticket_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS event_name TEXT DEFAULT 'Starize S7 Grand Finale',
  ADD COLUMN IF NOT EXISTS event_date TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- 2. Create an index on ticket_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(ticket_code);

-- 3. Create an index on paystack_reference for webhook idempotency
CREATE INDEX IF NOT EXISTS idx_tickets_reference ON tickets(paystack_reference);

-- 4. Add a check constraint for status values
ALTER TABLE tickets
  DROP CONSTRAINT IF EXISTS tickets_status_check;

ALTER TABLE tickets
  ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('active', 'used', 'cancelled'));

-- 5. (Optional) Backfill existing rows: copy full_name -> buyer_name, email -> buyer_email, tier -> ticket_tier
UPDATE tickets
SET
  buyer_name = COALESCE(buyer_name, full_name),
  buyer_email = COALESCE(buyer_email, email),
  ticket_tier = COALESCE(ticket_tier, tier)
WHERE buyer_name IS NULL OR buyer_email IS NULL OR ticket_tier IS NULL;
