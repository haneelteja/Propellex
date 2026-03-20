# CLAUDE.md — Propellex

AI-powered real estate discovery & investment intelligence platform for HNIs in Hyderabad, India.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + React Query v5 + Zustand + react-leaflet |
| Backend | Node.js 22 + Express + TypeScript + pg (node-postgres) + ioredis + JWT |
| AI Service | Python 3.12 + FastAPI + Anthropic SDK (claude-sonnet-4-20250514) + Google Gemini |
| Database | PostgreSQL 16 (Neon in prod) |
| Cache | Redis 7 (ioredis) |
| Infra | Docker Compose, Render (backend + AI), Vercel (frontend) |

## Dev Commands

```bash
# Start infra
docker compose up postgres redis -d

# Backend
cd backend && npm install && npm run dev      # :3001
npm run seed                                   # seed 50 properties

# AI service
cd ai-service && pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Frontend
cd frontend && npm install && npm run dev      # :5173

# Build check
cd backend && npm run build   # tsc
```

## Non-Negotiable Rules

### Money
- **Always store as BIGINT paise** in PostgreSQL — never strings or floats
- **Convert to rupees ONLY** in the response layer via `serializeMoney()`
- **Never do math on rupees** — always on paise
- Frontend display: `formatRupeesCr()` → "₹1.5 Cr", `formatRupees()` → Intl.NumberFormat en-IN

### Styling
- **Tailwind CSS only** — no inline `style={{}}`, no CSS modules, no raw hex values outside `tailwind.config`
- Design tokens: Navy `#1E3A5F`, Brand Blue `#2E86AB`, Gold `#C9A84C`, Surface `#F8FAFC`
- Font: Inter (loaded in index.html — do not add font imports elsewhere)

### Backend (Express/TypeScript)
- Every async route handler **must** be wrapped with `asyncHandler()`
- **Always `throw new AppError(message, statusCode)`** — never `res.status().json()` inline
- Use `ok()`, `paginated()`, `fail()` from `utils/response.ts` — never naked `res.json(data)`
- DB error log pattern:
  ```ts
  const err = e as Error & { code?: string };
  console.error('[Module] op failed — code:', err.code, '| message:', err.message);
  throw new AppError(`Context (${err.code ?? err.name})`, 500);
  ```
- AI service HTML detection: `errText.trimStart().startsWith('<')` → log `HTTP ${status} (service unavailable)`
- Chat SSE proxy: always `reader.cancel().catch(() => {})` in `finally`

### AI Service (FastAPI/Python)
- Always `finally: await conn.close()` in rag_service.py — never leak DB connections
- Log with `traceback.print_exc()` for full stacks
- Never return raw `str(e)` to HTTP clients — use `type(e).__name__`
- Keep-alive tasks: `except Exception` silently — must never crash the asyncio event loop
- Gemini calls: use `_generate_with_retry()` — handles 429/RESOURCE_EXHAUSTED with 30s backoff

### Frontend (React/TypeScript)
- `api.ts request()`: separate try/catch for `fetch()` (→ `ApiError(0, ...)`) and `res.json()` (→ `ApiError(status, ...)`)
- Smart retry: **never retry 4xx** (won't self-heal), retry ≤2× for 0/5xx
- Map status codes to friendly messages:
  - 429 → "Daily limit reached — upgrade to Premium"
  - 401 → "Session expired — please log in again"
  - 5xx → "AI service is starting up — try again in 30s"
- `useRecommendations`: `enabled: !!preferences && Object.keys(preferences).length > 0`
- `reader.cancel()` in `finally` for all SSE streams

## Architecture

### Response Envelope
```json
{ "success": true, "data": {...}, "pagination": {...} }
{ "success": false, "error": "message" }
```
Never return naked data — always use the envelope.

### Auth
- OTP: 6-digit, Redis 10-min TTL, `console.log` in dev
- JWT: 7-day expiry, payload: `{ userId, email, subscriptionTier }`
- Free limits (Redis daily counters): 5 searches, 3 saves, 5 chats/day

### Search
- V1: PostgreSQL full-text with tsvector GIN trigger
- V2 (not yet): Elasticsearch — do NOT add it now

### AI Flows
- Chat: RAG injects top-20 properties as JSON into Claude system prompt → SSE streaming
- Analysis: Gemini analyzes each property (cron every 6h) — rate limit: 10s delay, abort on 429
- Compare: POST /api/properties/compare → Gemini → side-by-side page
- Recommendations: scoring weights: locality 30%, budget 25%, type 20%, ROI 15%, risk 10%

### Key Files
```
backend/src/
  utils/response.ts      # ok(), paginated(), fail(), asyncHandler()
  utils/currency.ts      # serializeMoney(), paiseToCr()
  middleware/auth.ts     # JWT verify
  middleware/freemium.ts # daily Redis counters
  config/db.ts           # pg Pool
  config/redis.ts        # ioredis client
  jobs/analyzeProperties.ts  # Gemini cron
  modules/property/      # search, CRUD, compare
  modules/auth/          # OTP, JWT
  modules/recommendations/  # scoring engine
  modules/chat/          # SSE proxy to AI service

ai-service/
  routers/chat.py        # Claude streaming via RAG
  routers/analysis.py    # Gemini property analysis + compare
  routers/recommendations.py
  services/rag_service.py     # fetch top-20 properties from Neon
  services/claude_service.py  # Anthropic SDK streaming
  services/scoring_service.py

frontend/src/
  services/api.ts        # fetch wrapper, ApiError
  store/authStore.ts     # Zustand, persisted
  store/filterStore.ts   # search filters
  hooks/useChat.ts       # SSE stream consumer
  hooks/useProperties.ts
  hooks/useRecommendations.ts
  lib/utils.ts           # formatRupeesCr, formatRupees
```

## Seed Data
50 properties across 8 Hyderabad localities: Jubilee Hills, Banjara Hills, Gachibowli, Kondapur, Kokapet, Hitech City, Madhapur, Nanakramguda.

## Specialized Agents (`.claude/agents/`)
Spawn these via the Agent tool for focused, expert work:

| Agent | When to use |
|-------|-------------|
| `typescript-specialist` | Backend routes/services or frontend hooks/components |
| `python-specialist` | ai-service/ FastAPI endpoints, RAG, Claude/Gemini calls |
| `security-auditor` | Auth flows, JWT/OTP, freemium enforcement, any new endpoint |
| `database-specialist` | Schema changes, migrations, query optimization, indexing |

## Slash Commands
- `/plan` — draft a phased plan before coding, waits for your approval
- `/tdd` — RED → GREEN → REFACTOR with 100% coverage on monetary/auth code
- `/code-review` — 3-tier severity review (Critical/High/Medium)
- `/build-fix` — iteratively fix TypeScript/Python build errors one at a time
- `/e2e` — Playwright E2E tests for all 7 critical Propellex flows
- `/security-audit` — deep OWASP audit across all 3 layers
- `/swarm` — multi-agent parallel implementation for cross-layer features
