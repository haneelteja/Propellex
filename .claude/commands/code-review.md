Review all staged and unstaged changes (`git diff HEAD`). Report issues by severity.

## 🔴 Critical — block commit
- Hardcoded API keys, JWT secrets, DB passwords, or any credential
- SQL injection (raw string interpolation into queries — use parameterized `$1, $2`)
- XSS (unescaped user input rendered as HTML)
- Auth bypass (route missing `authenticateToken` middleware when it should have it)
- Freemium bypass (endpoint that should be gated missing `checkFreemiumLimit`)
- Monetary value stored as float or string (must be BIGINT paise)
- Naked `res.json()` bypassing the response envelope (`ok()` / `fail()`)
- `process.exit()` or uncaught promise rejection swallowed silently

## 🟠 High — fix before merging
- `async` route handler not wrapped in `asyncHandler()`
- DB error thrown without logging `err.code` + `err.message`
- AI service DB connection not closed in `finally` block
- Frontend `fetch()` without error handling for both network errors and non-2xx
- `console.log` left in production paths (warn/error are OK)
- React Query retry not guarded (4xx should never be retried)
- Monetary formatting using raw numbers instead of `formatRupeesCr()` / `formatRupees()`

## 🟡 Medium — flag but don't block
- Missing `asyncHandler` on a non-critical utility route
- Component over 200 lines (should be split)
- Magic numbers not extracted as constants
- Missing loading/error states in a new UI component
- Tailwind inline `style={{}}` usage instead of utility classes
- `any` type in TypeScript where a proper type is feasible

## Output Format

```
## Critical
- [file:line] Description → Fix: ...

## High
- [file:line] Description → Fix: ...

## Medium
- [file:line] Description → Fix: ...

## Verdict
APPROVED / CHANGES REQUIRED
```

Never approve code with Critical issues. High issues require fixes unless the author provides a clear justification.
