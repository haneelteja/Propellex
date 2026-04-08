-- Market Intelligence: news articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  summary      TEXT,
  url          TEXT        NOT NULL,
  source       TEXT        NOT NULL,
  published_at TIMESTAMPTZ,
  sentiment    TEXT        CHECK (sentiment IN ('positive', 'negative', 'neutral')) DEFAULT 'neutral',
  localities   TEXT[]      DEFAULT '{}',
  fetched_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(url)
);

CREATE INDEX IF NOT EXISTS idx_news_published  ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_sentiment  ON news_articles(sentiment);
CREATE INDEX IF NOT EXISTS idx_news_localities ON news_articles USING GIN(localities);

-- RERA verification fields on properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rera_number      TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rera_status      TEXT CHECK (rera_status IN ('verified','pending','not_registered','unknown')) DEFAULT 'unknown';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rera_verified_at TIMESTAMPTZ;
