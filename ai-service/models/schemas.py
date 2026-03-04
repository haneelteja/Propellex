from pydantic import BaseModel
from typing import Optional, List

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    conversation_history: List[ChatMessage] = []

class ScoreRequest(BaseModel):
    user_preferences: dict
    property_ids: Optional[List[str]] = None  # None = score all active
    limit: int = 20
