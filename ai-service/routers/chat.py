from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest
from services.rag_service import get_relevant_properties
from services.claude_service import stream_chat

router = APIRouter()

@router.post("/chat")
async def chat(req: ChatRequest):
    properties = await get_relevant_properties(req.message)
    return StreamingResponse(
        stream_chat(req.message, [m.model_dump() for m in req.conversation_history], properties),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )
