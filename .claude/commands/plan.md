Draft a complete implementation plan for the requested feature or change. Follow these steps:

1. **Restate** the requirement in your own words to confirm understanding
2. **Identify affected files** across backend, AI service, and frontend
3. **Surface risks**: DB migrations needed? Rate limit implications? Freemium gating? Auth changes?
4. **Phase the work** into ordered steps with specific actions per file
5. **Map dependencies** — which steps must complete before others can start
6. **Rate complexity**: Low (< 2h) / Medium (half-day) / High (multi-day)

**CRITICAL**: Do NOT write any code until the user explicitly approves this plan. Present the plan, then stop and wait.

After approval, suggest: `/tdd` for implementation, `/build-fix` for any TypeScript errors, `/code-review` before committing.

## Propellex-specific checks
- Does this touch monetary values? → Confirm BIGINT paise storage, serializeMoney() in response layer
- Does this add a new route? → Confirm asyncHandler() + AppError pattern + response envelope
- Does this add AI calls? → Confirm Gemini uses _generate_with_retry(), Claude uses streaming SSE
- Does this change freemium limits? → Update both Redis counter keys and middleware
- Does this need a DB migration? → Draft the SQL and note it must go in db/migrations/
