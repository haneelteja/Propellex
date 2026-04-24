-- ============================================================
-- Migration 005: Add video_url to properties
-- ============================================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);
