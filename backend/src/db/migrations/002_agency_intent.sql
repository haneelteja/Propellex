-- Migration 002: Add intent to portfolio, agency_id to users
ALTER TABLE portfolio
  ADD COLUMN IF NOT EXISTS intent VARCHAR(20) NOT NULL DEFAULT 'watch'
    CHECK (intent IN ('buy', 'invest', 'watch'));

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id);
