from fastapi import APIRouter, HTTPException
from models.schemas import ScoreRequest
from services.rag_service import get_all_active_properties
from services.scoring_service import score_and_rank
import traceback

router = APIRouter()

@router.post("/score")
async def score_properties(req: ScoreRequest):
    try:
        properties = await get_all_active_properties(200)
    except Exception as e:
        print(f"[Recommendations] DB fetch failed: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=503, detail=f"Could not load properties for scoring ({type(e).__name__})")

    try:
        scored = score_and_rank(properties, req.user_preferences, req.limit)
    except Exception as e:
        print(f"[Recommendations] Scoring failed: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Scoring engine error ({type(e).__name__})")

    return {"success": True, "data": scored}
