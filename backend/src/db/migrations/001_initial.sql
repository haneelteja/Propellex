-- ============================================================
-- Propellex — Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR(255) UNIQUE NOT NULL,
  phone                 VARCHAR(20),
  name                  VARCHAR(255) NOT NULL,
  user_type             VARCHAR(50) NOT NULL DEFAULT 'home_buyer',
  subscription_tier     VARCHAR(50) NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  preferences           JSONB NOT NULL DEFAULT '{}',
  interaction_count     INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login            TIMESTAMPTZ
);

-- ── Agencies ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agencies (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name           VARCHAR(255) NOT NULL,
  contact_name          VARCHAR(255) NOT NULL,
  email                 VARCHAR(255) UNIQUE NOT NULL,
  phone                 VARCHAR(20) NOT NULL,
  gstin                 VARCHAR(20),
  subscription_plan     VARCHAR(50) NOT NULL DEFAULT 'starter',
  subscription_status   VARCHAR(50) NOT NULL DEFAULT 'trial',
  listing_count         INTEGER NOT NULL DEFAULT 0,
  listing_limit         INTEGER NOT NULL DEFAULT 25,
  rera_agency_number    VARCHAR(100),
  verification_status   VARCHAR(50) NOT NULL DEFAULT 'pending',
  onboarded_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Properties ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rera_number         VARCHAR(100),
  rera_status         VARCHAR(50) NOT NULL DEFAULT 'pending',
  rera_verified_at    TIMESTAMPTZ,
  rera_completion_date DATE,
  title               VARCHAR(500) NOT NULL,
  description         TEXT,
  property_type       VARCHAR(50) NOT NULL,   -- residential/commercial/plot
  status              VARCHAR(50) NOT NULL,   -- under_construction/ready_to_move
  price               BIGINT NOT NULL,        -- in paise
  price_per_sqft      BIGINT NOT NULL,        -- in paise
  area_sqft           INTEGER NOT NULL,
  bedrooms            INTEGER,
  bathrooms           INTEGER,
  floor               INTEGER,
  total_floors        INTEGER,
  locality            VARCHAR(255) NOT NULL,
  city                VARCHAR(100) NOT NULL DEFAULT 'Hyderabad',
  lat                 DECIMAL(10,8),
  lng                 DECIMAL(11,8),
  pincode             VARCHAR(10),
  amenities           JSONB NOT NULL DEFAULT '[]',
  builder_name        VARCHAR(255),
  agency_id           UUID REFERENCES agencies(id),
  photos              JSONB NOT NULL DEFAULT '[]',
  brochure_url        VARCHAR(500),
  risk_score          INTEGER NOT NULL DEFAULT 50 CHECK (risk_score BETWEEN 0 AND 100),
  roi_estimate_3yr    DECIMAL(5,2),
  price_forecast_json JSONB,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  search_vector       TSVECTOR,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at        TIMESTAMPTZ
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties USING GIN(search_vector);

-- Composite query indexes
CREATE INDEX IF NOT EXISTS idx_properties_locality ON properties(locality, is_active);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price, is_active);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type, is_active);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city, is_active, published_at DESC);

-- Trigger to keep search_vector updated
CREATE OR REPLACE FUNCTION update_property_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.locality, '') || ' ' ||
    COALESCE(NEW.city, '') || ' ' ||
    COALESCE(NEW.builder_name, '') || ' ' ||
    COALESCE(NEW.description, '')
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_property_search
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_property_search_vector();

-- ── Portfolio ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id       UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  added_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes             TEXT,
  status            VARCHAR(50) NOT NULL DEFAULT 'saved',
  custom_roi_inputs JSONB NOT NULL DEFAULT '{}',
  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio(user_id, added_at DESC);

-- ── Recommendation feedback ───────────────────────────────────
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  feedback    VARCHAR(10) NOT NULL CHECK (feedback IN ('up', 'down')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- ── Market Intelligence ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_intelligence (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(500) NOT NULL,
  summary       TEXT,
  source_url    VARCHAR(1000),
  source_name   VARCHAR(255),
  category      VARCHAR(50),
  locality_tags JSONB NOT NULL DEFAULT '[]',
  sentiment     VARCHAR(20) NOT NULL DEFAULT 'neutral',
  published_at  TIMESTAMPTZ,
  ingested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intel_published ON market_intelligence(published_at DESC);

-- ── Price history (mocked) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_history (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locality  VARCHAR(255) NOT NULL,
  month     DATE NOT NULL,
  avg_price_per_sqft BIGINT NOT NULL,  -- paise
  UNIQUE(locality, month)
);
