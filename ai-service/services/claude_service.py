import json
import traceback
import os
from typing import List, Dict, Any, AsyncGenerator
from google import genai
from google.genai import types

SYSTEM_PROMPT = """You are Propellex AI, an expert real estate investment advisor for High Net-Worth Individuals (HNIs) in India.

You specialize in:
- Hyderabad real estate market intelligence
- Investment analysis and ROI estimation
- RERA compliance and legal due diligence guidance
- Comparing properties across localities
- Portfolio strategy for real estate investors

Currency: Always use Indian format (₹1,20,00,000 = 1.2 crore). Area always in sqft.

PROPERTY CONTEXT (use this to answer queries):
{property_context}

INSTRUCTIONS:
1. Classify the intent: Search | Compare | Market Info | Compliance | Portfolio
2. For Search intent: after your response, output a JSON block:
   ```json
   {{"action": "apply_filters", "filters": {{"locality": "...", "min_price": ..., "max_price": ..., "bedrooms": ..., "property_type": "..."}}}}
   ```
3. For Compare intent: provide side-by-side comparison using the context properties
4. Be concise but data-rich. Cite specific properties from context when relevant.
5. Always mention RERA verification status when discussing specific properties.
6. If you cannot answer from context, say so and suggest contacting an agent.
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
