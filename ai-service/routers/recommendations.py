from fastapi import APIRouter
from models.schemas import ScoreRequest
from services.rag_service import get_all_active_properties
from services.scoring_service import score_and_rank

router = APIRouter()

@router.post("/score")
async def score_properties(req: ScoreRequest):
    properties = await get_all_active_properties(200)
    scored = score_and_rank(properties, req.user_preferences, req.limit)
    return {"success": True, "data": scored}
