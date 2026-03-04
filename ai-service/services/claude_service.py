import anthropic
import json
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
    context_str = json.dumps(property_context, indent=2, default=str)
    system = SYSTEM_PROMPT.replace("{property_context}", context_str)

    messages = [
        {"role": m["role"], "content": m["content"]}
        for m in conversation_history[-10:]  # last 10 turns
    ] + [{"role": "user", "content": message}]

    async with client.messages.stream(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield f"data: {json.dumps({'text': text})}\n\n"

    yield "data: [DONE]\n\n"
