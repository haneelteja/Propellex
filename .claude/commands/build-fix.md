Iteratively fix build and type errors with minimal, safe changes. Fix one error at a time.

## Step 1: Run the build

```bash
# Backend TypeScript
cd backend && npm run build          # tsc

# Frontend TypeScript
cd frontend && npm run build         # vite build (includes tsc)

# AI service
cd ai-service && python -m mypy .    # or: python -m py_compile routers/*.py
```

## Step 2: Parse and group errors

1. Capture stderr output
2. Group errors by file path
3. Sort by dependency order — fix imports/types before logic errors
4. Count total errors for progress tracking

## Step 3: Fix loop

For each error:
1. **Read the file** — 10 lines around the error line for context
2. **Diagnose** — missing import? wrong type? signature mismatch?
3. **Fix minimally** — smallest edit that resolves the error
4. **Re-run build** — confirm error gone, no new errors introduced
5. **Continue** to next error

## Step 4: Stop and ask if…
- A fix introduces **more errors than it resolves**
- The **same error persists after 3 attempts** (likely a deeper issue)
- The fix requires **architectural changes**
- Errors stem from **missing packages** → suggest `npm install` / `pip install`

## Common Propellex Errors

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `Property 'X' does not exist on type 'Y'` | Type mismatch in response envelope | Check `ok()` return type in `utils/response.ts` |
| `Argument of type 'number' is not assignable to 'bigint'` | Paise/rupees confusion | Store paise as `bigint`, use `BigInt(value)` |
| `Cannot find module '../config/db'` | Missing import path | Check `tsconfig.json` paths alias |
| `Type 'undefined' is not assignable` | Missing null check on optional query result | Add `if (!row) throw new AppError('Not found', 404)` |
| FastAPI `422 Unprocessable Entity` | Pydantic model mismatch | Check request body matches the Pydantic model exactly |

## Summary Format

```
Fixed: 5 errors
  - backend/src/modules/auth/auth.service.ts:42 — missing await
  - backend/src/utils/currency.ts:18 — bigint conversion
  ...
Remaining: 0
```
