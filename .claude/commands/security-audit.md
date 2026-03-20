Run a deep security audit across the entire Propellex codebase. Delegate to the security-auditor agent.

## Scope

Audit ALL of the following in sequence:

### 1. Authentication & Authorization (`backend/src/middleware/`, `backend/src/modules/auth/`)
- Every route file: confirm `authenticateToken` is present on all protected routes
- OTP flow: single-use, Redis-only, TTL set, never logged in prod
- JWT: secret length ≥ 32 chars at startup, `exp` claim verified, no token in logs
- `userId` sourced from JWT payload only, never request body

### 2. Freemium Enforcement (`backend/src/middleware/freemium.ts`)
- All AI endpoints (`/chat`, `/recommendations`, `/analyze`) have `checkFreemiumLimit`
- Redis failure: fails open (allows) — verify this is intentional and logged
- Counter keys namespaced: `limit:search:${userId}`, `limit:chat:${userId}`, etc.

### 3. SQL Injection (`backend/src/modules/`)
- Every query: parameterized `$1, $2` only — grep for string template literals in query strings
- Full-text search: `plainto_tsquery` not `to_tsquery` for user-supplied input
- No raw `req.body` values concatenated into SQL

### 4. Secrets & Config
- Grep entire codebase for hardcoded: `sk-ant-`, `AIza`, `postgres://`, any 32+ char hex strings
- Confirm `.env` is in `.gitignore`
- Confirm `JWT_SECRET`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` only from `process.env` / `os.getenv`

### 5. AI Prompt Injection (`ai-service/`)
- User chat messages injected into Claude prompts: check for sanitization
- RAG context: property data from DB should be trusted, but verify no user-controlled fields bleed into system prompt structure

### 6. Frontend (`frontend/src/`)
- No API keys or secrets in frontend code or `VITE_` env vars (VITE vars are public)
- `VITE_API_URL` is the only sensitive env var — confirm it's just a URL, not a key
- No `dangerouslySetInnerHTML` with user content

### 7. Error Responses
- Grep for `err.stack`, `err.message` in `res.json()` / `raise HTTPException(detail=str(e))`
- Production errors must only return generic messages, not stack traces

## Output Format
```
## CRITICAL (must fix before deploy)
- [file:line] Issue → Risk → Fix

## HIGH (fix before next release)
- [file:line] Issue → Risk → Fix

## MEDIUM (fix soon)
- [file:line] Issue → Risk → Fix

## PASSED ✓
- List of areas with no issues found

## Verdict: SECURE / NEEDS FIXES
```
