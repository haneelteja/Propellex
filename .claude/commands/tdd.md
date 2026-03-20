Follow the RED → GREEN → REFACTOR cycle for the requested feature or fix.

## Cycle

### 1. RED — Write failing tests first
- Define the interface/types before any implementation
- Write tests that describe the expected behaviour
- Run tests and confirm they fail (if they pass, the test is wrong)
- Cover: happy path, edge cases, error conditions

### 2. GREEN — Minimal implementation
- Write the smallest amount of code that makes the tests pass
- Do not over-engineer — no extra abstractions yet
- Re-run tests after every change

### 3. REFACTOR — Clean up
- Improve readability and remove duplication
- Tests must still pass after every refactor step
- Only refactor what was touched — don't clean up unrelated code

## Coverage Standards
- Minimum **80%** coverage overall
- **100%** coverage required for:
  - Monetary calculations (paise/rupees conversions)
  - Auth flows (OTP, JWT validation)
  - Freemium limit enforcement
  - Scoring/recommendation logic

## Propellex Conventions

**Backend (TypeScript)**
```ts
// Test file: src/modules/foo/__tests__/foo.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
// Real pg pool for integration tests — never mock the database
// Mock only: external HTTP calls (AI service), Redis (use ioredis-mock)
```

**AI Service (Python)**
```python
# Test file: tests/test_foo.py
import pytest, httpx
from httpx import AsyncClient
# Use real FastAPI test client; mock only external Gemini/Anthropic HTTP calls
```

**Frontend (TypeScript)**
```ts
// Test file: src/hooks/__tests__/useFoo.test.ts
import { renderHook, waitFor } from '@testing-library/react'
// Wrap with QueryClientProvider + AuthStore reset in beforeEach
```

## Run Tests
```bash
# Backend
cd backend && npx vitest run

# AI service
cd ai-service && pytest

# Frontend
cd frontend && npx vitest run
```
