import json
import traceback
import os
from typing import List, Dict, Any, AsyncGenerator
from google import genai
from google.genai import types

SYSTEM_PROMPT = """You are Propellex AI, a concise real estate advisor for HNIs in Hyderabad, India.

You specialise in: market intelligence, ROI estimation, RERA guidance, property comparison, and portfolio strategy.
Currency: Indian format (₹1.2 Cr). Area in sqft.

PROPERTY CONTEXT:
{property_context}

RULES:
1. Answer directly — never start with "Intent:" or any classification label.
2. Be brief: 2–4 sentences for simple questions. Use bullet points only when listing 3+ items for comparison.
3. Cite specific properties from the context when relevant; always mention their RERA status.
4. If the context does not contain the answer, say so in one sentence and suggest contacting an agent.
"""

_GEMINI_MODEL = "gemini-2.5-flash"


def _gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not configured")
    return genai.Client(api_key=api_key)


async def stream_chat(
    message: str,
    conversation_history: List[Dict[str, str]],
    property_context: List[Dict[str, Any]],
) -> AsyncGenerator[str, None]:
    """Stream Gemini response as SSE data chunks."""
    try:
        context_str = json.dumps(property_context, indent=2, default=str)
    except Exception as e:
        print(f"[Chat] Failed to serialize property context: {e}")
        context_str = "[]"

    system = SYSTEM_PROMPT.replace("{property_context}", context_str)

    # Build Gemini contents list from history
    # Gemini roles: "user" | "model" (not "assistant")
    contents = []
    for m in conversation_history[-10:]:
        role = m.get("role", "")
        content = m.get("content", "")
        if role in ("user", "assistant") and isinstance(content, str) and content.strip():
            gemini_role = "model" if role == "assistant" else "user"
            contents.append({"role": gemini_role, "parts": [{"text": content}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    try:
        client = _gemini_client()
        async for chunk in await client.aio.models.generate_content_stream(
            model=_GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=2048,
            ),
        ):
            if chunk.text:
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"

    except Exception as e:
        err_str = str(e)
        is_rate_limit = (
            "429" in err_str
            or "Too Many Requests" in err_str
            or "RESOURCE_EXHAUSTED" in err_str
            or "ResourceExhausted" in err_str
            or "quota" in err_str.lower()
        )
        is_auth = "API_KEY" in err_str or "invalid" in err_str.lower() or "not configured" in err_str
        if is_rate_limit:
            print("[Chat] Gemini rate limit reached")
            yield f"data: {json.dumps({'error': 'AI rate limit reached — please try again in a moment'})}\n\n"
        elif is_auth:
            print("[Chat] Gemini auth error — check GEMINI_API_KEY")
            yield f"data: {json.dumps({'error': 'AI authentication failed — contact support'})}\n\n"
        else:
            print(f"[Chat] Unexpected stream error: {type(e).__name__}: {e}")
            traceback.print_exc()
            yield f"data: {json.dumps({'error': 'Unexpected AI error — please try again'})}\n\n"

    yield "data: [DONE]\n\n"
