import anthropic
import json
import traceback
from typing import List, Dict, Any, AsyncGenerator

client = anthropic.AsyncAnthropic()

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

async def stream_chat(
    message: str,
    conversation_history: List[Dict[str, str]],
    property_context: List[Dict[str, Any]],
) -> AsyncGenerator[str, None]:
    """Stream Claude response as SSE data chunks."""
    try:
        context_str = json.dumps(property_context, indent=2, default=str)
    except Exception as e:
        print(f"[Claude] Failed to serialize property context: {e}")
        context_str = "[]"

    system = SYSTEM_PROMPT.replace("{property_context}", context_str)

    # Sanitise history — only keep valid role/content pairs
    messages = []
    for m in conversation_history[-10:]:
        role = m.get("role", "")
        content = m.get("content", "")
        if role in ("user", "assistant") and isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    try:
        async with client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
    except anthropic.AuthenticationError:
        print("[Claude] AuthenticationError — check ANTHROPIC_API_KEY")
        yield f"data: {json.dumps({'error': 'AI authentication failed — contact support'})}\n\n"
    except anthropic.RateLimitError:
        print("[Claude] RateLimitError — Anthropic quota exceeded")
        yield f"data: {json.dumps({'error': 'AI rate limit reached — please try again in a moment'})}\n\n"
    except anthropic.APIStatusError as e:
        print(f"[Claude] APIStatusError {e.status_code}: {e.message}")
        yield f"data: {json.dumps({'error': f'AI service error ({e.status_code})'})}\n\n"
    except Exception as e:
        print(f"[Claude] Unexpected stream error: {type(e).__name__}: {e}")
        traceback.print_exc()
        yield f"data: {json.dumps({'error': 'Unexpected AI error — please try again'})}\n\n"

    yield "data: [DONE]\n\n"
