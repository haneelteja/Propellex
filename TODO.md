# Propellex — V1 Feature Tracker

## P0 — Must Have for Launch

- [ ] **Auth & Onboarding**
  - [ ] POST /api/auth/send-otp
  - [ ] POST /api/auth/verify-otp (issues JWT)
  - [ ] GET/PUT /api/auth/profile
  - [ ] Investment preference wizard (budget, location, property type, ROI, risk)
  - [ ] JWT session management + protected routes

- [ ] **Property Discovery & Search**
  - [ ] GET /api/properties (search + filters + pagination)
  - [ ] GET /api/properties/:id
  - [ ] Filters: location, price range, area, bedrooms, property type, RERA status, amenities
  - [ ] Results page: cards + map view (Leaflet.js)
  - [ ] Property detail page: photos, RERA badge, investment panel
  - [ ] Sort: relevance, price, newest, AI match score

- [ ] **AI Personalized Recommendations**
  - [ ] POST /api/recommendations (personalized feed)
  - [ ] Rule-based scoring: locality 30%, budget 25%, type 20%, ROI 15%, risk 10%
  - [ ] "Why Recommended" tag per card
  - [ ] POST /api/recommendations/feedback (thumbs up/down)

- [ ] **NLP Chatbot**
  - [ ] POST /api/chat (stream via SSE)
  - [ ] Claude API (claude-sonnet-4-20250514) with RAG over property DB
  - [ ] Intent: Search | Compare | Market Info | Compliance | Portfolio
  - [ ] 5 queries/day free, unlimited premium
  - [ ] Floating chat widget UI

---

## P1 — Core Value Features

- [ ] **Property Investment Intelligence**
  - [ ] ROI Calculator per property
  - [ ] Price trend chart (6-month, mocked)
  - [ ] Risk Score (0–100) with factor breakdown
  - [ ] Comparable properties (5 similar)
  - [ ] Locality Scorecard (static data V1)

- [ ] **RERA Auto-Verification**
  - [ ] Python Playwright scraper (rera.telangana.gov.in)
  - [ ] Change detection + hash comparison
  - [ ] Badge system: Verified / Pending / Flagged
  - [ ] Celery nightly scheduled scrape

- [ ] **Shortlist & Portfolio Tracker**
  - [ ] Save / compare (up to 4) / status tracking
  - [ ] Free: max 3 saves; Premium: unlimited
  - [ ] Portfolio summary view

- [ ] **Agency Portal**
  - [ ] Agency registration + admin login
  - [ ] Property listing CRUD + photo upload
  - [ ] Inquiry management
  - [ ] Subscription tier enforcement

---

## P2 — Monetization & Intelligence

- [ ] **Market Intelligence Feed**
  - [ ] RSS aggregator cron (Google News "Hyderabad real estate")
  - [ ] Sentiment tagging, category filters
  - [ ] Locality price trends (mocked V1)

- [ ] **Freemium Gating & Subscriptions**
  - [ ] Free limits: 5 searches/day, 3 saves, 5 chats/day
  - [ ] Premium (₹999/mo): unlimited
  - [ ] Upgrade prompt at limits
  - [ ] Agency plans: Starter ₹4,999 (25 listings), Growth ₹12,999 (100 listings)

---

## Infrastructure & DevOps

- [ ] Docker Compose (PostgreSQL, Redis, Elasticsearch)
- [ ] Seed data: 50 properties, 5 agencies, 10 users, 20 news items
- [ ] GitHub Actions CI/CD (V2)
- [ ] Structured logging
- [ ] `/health` + `/metrics` endpoints
