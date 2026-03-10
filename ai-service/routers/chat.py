from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest
from services.rag_service import get_relevant_properties
from services.claude_service import stream_chat
import traceback

router = APIRouter()

@router.post("/chat")
async def chat(req: ChatRequest):
    try:
        properties = await get_relevant_properties(req.message)
    except Exception as e:
        print(f"[Chat] RAG fetch failed: {type(e).__name__}: {e}")
        properties = []  # Degrade gracefully — chat still works without property context

    try:
        return StreamingResponse(
            stream_chat(req.message, [m.model_dump() for m in req.conversation_history], properties),
            media_type="text/event-stream",
            headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
        )
    except Exception as e:
        print(f"[Chat] Stream setup failed: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"Chat stream error: {type(e).__name__}")
