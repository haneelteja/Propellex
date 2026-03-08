-- Migration 004: AI property analysis storage
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;
