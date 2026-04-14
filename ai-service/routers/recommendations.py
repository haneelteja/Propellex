from fastapi import APIRouter

router = APIRouter()

# Property scoring has been consolidated into the Node.js backend
# (backend/src/modules/recommendations/recommendations.service.ts).
# This endpoint is intentionally removed to avoid dual-maintenance of the
# same 30/25/20/15/10 weighting algorithm in two languages.
