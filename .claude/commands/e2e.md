Generate and run end-to-end tests for the specified user flow using Playwright.

## Setup (first time)

```bash
cd frontend
npm install -D @playwright/test
npx playwright install chromium
```

Create `frontend/playwright.config.ts` if it doesn't exist:
```ts
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  baseURL: 'http://localhost:5173',
  use: { headless: true, screenshot: 'only-on-failure', video: 'retain-on-failure' },
})
```

## Critical Propellex Flows to Cover

| Flow | Steps | Assertions |
|------|-------|------------|
| **OTP Login** | Enter email → receive OTP → enter code → redirect to /search | JWT stored, user name shown in nav |
| **Property Search** | Enter locality filter → apply budget range → view results | Cards render with ₹ Cr prices, map pins appear |
| **Property Detail** | Click property card → view AI analysis | Analysis section rendered, score badge visible |
| **Shortlist** | Save property → navigate to /shortlist → verify saved | Count badge updates, freemium limit enforced |
| **Compare** | Select 2 properties → click Compare → view side-by-side | Both property titles visible, Gemini summary rendered |
| **Chat** | Open chatbot → send message → receive streaming response | Message appears incrementally, no error state |
| **Freemium Limit** | Exhaust free chat limit (5/day) → attempt 6th → see upgrade prompt | 429 message shown, upgrade CTA visible |

## Test Structure

```ts
// e2e/search.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Property Search', () => {
  test.beforeEach(async ({ page }) => {
    // Seed a test user session via localStorage
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('auth-store', JSON.stringify({
      state: { token: 'TEST_JWT', user: { email: 'test@e2e.com', subscriptionTier: 'free' } }
    })))
  })

  test('filters properties by locality', async ({ page }) => {
    await page.goto('/search')
    await page.selectOption('[data-testid="locality-filter"]', 'Gachibowli')
    await page.click('[data-testid="search-btn"]')
    await expect(page.locator('[data-testid="property-card"]')).toHaveCountGreaterThan(0)
  })
})
```

## Run Tests

```bash
cd frontend
npx playwright test              # all e2e tests
npx playwright test search       # specific file
npx playwright test --headed     # with browser UI
npx playwright show-report       # view HTML report
```

## Flaky Test Detection

If a test fails intermittently:
1. Add `test.slow()` to give it 3× the timeout
2. Check for missing `await expect(...).toBeVisible()` before interactions
3. Use `page.waitForResponse()` for API calls instead of fixed `page.waitForTimeout()`

## After Writing Tests
Run `/code-review` on the new spec files to check for hardcoded credentials or test data that might leak.
