import asyncio
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
_MAX_RETRIES = 2


def _gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not configured")
    return genai.Client(api_key=api_key)


def _classify_error(err_str: str) -> str:
    """Return 'rate_limit' | 'transient' | 'auth' | 'unknown'."""
    if (
        "429" in err_str
        or "Too Many Requests" in err_str
        or "RESOURCE_EXHAUSTED" in err_str
        or "ResourceExhausted" in err_str
        or "quota" in err_str.lower()
    ):
        return "rate_limit"
    if "503" in err_str or "UNAVAILABLE" in err_str or "high demand" in err_str.lower():
        return "transient"
    if "API_KEY" in err_str or "not configured" in err_str:
        return "auth"
    return "unknown"


async def stream_chat(
    message: str,
    conversation_history: List[Dict[str, str]],
    property_context: List[Dict[str, Any]],
) -> AsyncGenerator[str, None]:
    """Stream Gemini response as SSE data chunks with transient-error retry."""
    try:
        context_str = json.dumps(property_context, indent=2, default=str)
    except Exception as e:
        print(f"[Chat] Failed to serialize property context: {e}")
        context_str = "[]"

    system = SYSTEM_PROMPT.replace("{property_context}", context_str)

    # Build Gemini contents list (Gemini uses "model" not "assistant")
    contents = []
    for m in conversation_history[-10:]:
        role = m.get("role", "")
        content = m.get("content", "")
        if role in ("user", "assistant") and isinstance(content, str) and content.strip():
            gemini_role = "model" if role == "assistant" else "user"
            contents.append({"role": gemini_role, "parts": [{"text": content}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    last_error: Exception | None = None

    for attempt in range(_MAX_RETRIES + 1):
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
            yield "data: [DONE]\n\n"
            return  # success — exit generator

        except Exception as e:
            last_error = e
            err_str = str(e)
            kind = _classify_error(err_str)

            if kind == "transient" and attempt < _MAX_RETRIES:
                wait_s = 8 * (attempt + 1)
                print(f"[Chat] Gemini 503 (attempt {attempt + 1}) — retrying in {wait_s}s")
                await asyncio.sleep(wait_s)
                continue  # retry

            # Non-retriable or retries exhausted
            if kind == "rate_limit":
                print("[Chat] Gemini rate limit reached")
                yield f"data: {json.dumps({'error': 'AI rate limit reached — please try again in a moment'})}\n\n"
            elif kind == "transient":
                print(f"[Chat] Gemini unavailable after {_MAX_RETRIES} retries")
                yield f"data: {json.dumps({'error': 'AI is busy right now — please try again in a few seconds'})}\n\n"
            elif kind == "auth":
                print("[Chat] Gemini auth error — check GEMINI_API_KEY")
                yield f"data: {json.dumps({'error': 'AI authentication failed — contact support'})}\n\n"
            else:
                print(f"[Chat] Unexpected error: {type(e).__name__}: {e}")
                traceback.print_exc()
                yield f"data: {json.dumps({'error': 'Unexpected AI error — please try again'})}\n\n"
            break

    yield "data: [DONE]\n\n"
