-- ============================================================
-- Migration 006: Add media_sources to properties
-- Stores real external media URLs (builder site, brochure,
-- 99acres listing, news, authorized rendering) with source
-- labels. Replaces fake stock photos from seeds.
-- ============================================================
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS media_sources JSONB NOT NULL DEFAULT '[]';

-- Clear fake Unsplash stock photos — agents will add real ones
UPDATE properties SET photos = '[]' WHERE is_active = true;
