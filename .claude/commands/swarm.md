Coordinate a multi-agent swarm to implement a complex feature that spans multiple files or layers. Use this for tasks that touch backend + AI service + frontend simultaneously.

## When to use
- New feature spanning all 3 layers (e.g., "add property alerts system")
- Large refactor affecting many files (e.g., "migrate currency storage to BIGINT")
- Performance investigation across the full stack

## How to run a swarm

Spawn the following agents in parallel (use the Agent tool with independent subtasks):

### Agent 1 — Architect
Reads the relevant files, maps dependencies, and produces:
- List of files to create/modify per layer
- Data flow diagram (DB → backend → AI service → frontend)
- Any migration SQL needed
- Risks and non-obvious dependencies

### Agent 2 — typescript-specialist
Implements backend (Express routes, services, middleware) and frontend (hooks, components, API calls) changes based on the architect's plan.

### Agent 3 — python-specialist
Implements AI service (FastAPI endpoints, Pydantic models, Claude/Gemini integrations) changes.

### Agent 4 — database-specialist
Writes migration SQL, updates seed data if needed, adds indexes.

### Agent 5 — security-auditor
Reviews all changes from Agents 2-4 before they're finalized. Blocks on Critical/High issues.

## Coordination rules (from ruflo)
- **1 message = all parallel spawns** — launch independent agents simultaneously
- Agents 2, 3, 4 can work in parallel once Agent 1 (Architect) finishes
- Agent 5 (Security) runs after 2, 3, 4 complete
- Each agent receives: the architect's plan + only the files relevant to their layer

## Template

```
Task: [describe the feature]

Architect agent: map all files to change across backend/ai-service/frontend, identify DB migrations needed, surface risks

typescript-specialist agent: implement [specific backend files] and [specific frontend files] per the architect plan

python-specialist agent: implement [specific ai-service files] per the architect plan

database-specialist agent: write migration SQL for [describe schema changes]

security-auditor agent: review all changes for OWASP issues, auth bypass, injection risks
```

## After swarm completes
Run `/build-fix` → `/code-review` → `/e2e` on the combined changes before committing.
