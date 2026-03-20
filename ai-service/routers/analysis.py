from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from google import genai
import os
import json
import traceback
import asyncio

router = APIRouter(prefix="/analyze", tags=["analysis"])

# v1beta is the SDK default and supports gemini-1.5-flash + gemini-2.0-flash on free API keys.
# v1 stable requires billing-enabled projects for gemini-2.0-flash — causes immediate 429.
_GEMINI_MODEL = "gemini-2.0-flash"

async def _generate_with_retry(client: genai.Client, model: str, prompt: str, max_retries: int = 3) -> str:
    """Call Gemini with exponential backoff on 429 / RESOURCE_EXHAUSTED errors."""
    for attempt in range(max_retries):
        try:
            response = await client.aio.models.generate_content(model=model, contents=prompt)
            return response.text.strip()
        except Exception as e:
            err_str = str(e)
            print(f"[Analysis] Gemini error (attempt {attempt + 1}): {type(e).__name__}: {err_str[:200]}")
            is_rate_limit = (
                "429" in err_str
                or "Too Many Requests" in err_str
                or "RESOURCE_EXHAUSTED" in err_str
                or "ResourceExhausted" in err_str
                or "quota" in err_str.lower()
            )
            if is_rate_limit and attempt < max_retries - 1:
                wait_s = 30 * (attempt + 1)  # 30s, 60s
                print(f"[Analysis] Rate limited — waiting {wait_s}s before retry {attempt + 2}/{max_retries}")
                await asyncio.sleep(wait_s)
                continue
            raise
    raise RuntimeError("Max retries exceeded")


def _gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not configured")
    # Use SDK default (v1beta) — works with free-tier API keys for gemini-2.0-flash.
    # Do NOT force v1 stable: it requires billing-enabled projects and returns 429 on free keys.
    return genai.Client(api_key=api_key)


class PropertyAnalysisRequest(BaseModel):
    id: str
    title: str
    property_type: str
    status: str
    price: float          # rupees
    price_per_sqft: float
    area_sqft: float
    bedrooms: int | None = None
    bathrooms: int | None = None
    locality: str
    city: str
    amenities: list[str] = []
    builder_name: str | None = None
    rera_status: str
    roi_estimate_3yr: float
    risk_score: int
    lat: float | None = None
    lng: float | None = None
    description: str = ""


class PropertyAnalysis(BaseModel):
    advantages: list[str]
    disadvantages: list[str]
    investment_recommendation: str
    market_insights: str
    risk_factors: list[str]
    best_suited_for: str
    overall_score: int  # 1–10
    analysis_priority: str  # 'high' | 'medium' | 'low'


@router.post("/property", response_model=PropertyAnalysis)
async def analyze_property(req: PropertyAnalysisRequest) -> PropertyAnalysis:
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured")

    price_cr = req.price / 10_000_000
    location_str = (
        f"Coordinates: {req.lat}, {req.lng} (Hyderabad locality: {req.locality})"
        if req.lat and req.lng
        else f"Locality: {req.locality}, {req.city}"
    )

    prompt = f"""You are a senior real estate investment analyst specializing in Hyderabad, India.
Analyze this property and provide a structured investment assessment.

PROPERTY DETAILS:
- Title: {req.title}
- Type: {req.property_type} | Status: {req.status}
- Price: ₹{price_cr:.2f} Cr (₹{req.price_per_sqft:,.0f}/sqft)
- Area: {req.area_sqft:,.0f} sqft | Bedrooms: {req.bedrooms or "N/A"} | Bathrooms: {req.bathrooms or "N/A"}
- {location_str}
- Builder: {req.builder_name or "Not specified"}
- RERA Status: {req.rera_status}
- 3-Year ROI Estimate: {req.roi_estimate_3yr}%
- Risk Score: {req.risk_score}/100 (lower = safer)
- Amenities: {", ".join(req.amenities) if req.amenities else "None listed"}
- Description: {req.description or "Not provided"}

Respond ONLY with a valid JSON object — no markdown, no code fences, no extra text:
{{
  "advantages": ["<advantage 1>", "<advantage 2>", "<advantage 3>"],
  "disadvantages": ["<disadvantage 1>", "<disadvantage 2>"],
  "investment_recommendation": "<2-3 sentence recommendation>",
  "market_insights": "<1-2 sentences about the Hyderabad micro-market>",
  "risk_factors": ["<risk 1>", "<risk 2>"],
  "best_suited_for": "<type of buyer this property suits best>",
  "overall_score": <integer 1 to 10>,
  "analysis_priority": "<high|medium|low — high for premium/rapidly-changing properties or score≥8, medium for standard investments score 5-7, low for stable/slow-moving assets score≤4>"
}}"""

    try:
        client = _gemini_client()
        text = await _generate_with_retry(client, _GEMINI_MODEL, prompt)

        # Strip accidental markdown fences
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        return PropertyAnalysis(**data)
    except json.JSONDecodeError as e:
        print(f"[Analysis] Gemini returned invalid JSON for property {req.id}: {e}\nRaw: {text[:300]}")
        raise HTTPException(status_code=502, detail="AI returned malformed response — will retry on next analysis cycle")
    except Exception as e:
        err_str = str(e)
        is_rate_limit = "429" in err_str or "Too Many Requests" in err_str or "RESOURCE_EXHAUSTED" in err_str
        if is_rate_limit:
            print(f"[Analysis] Gemini rate limit exhausted for property {req.id} after retries")
            raise HTTPException(status_code=429, detail="Too Many Requests")
        print(f"[Analysis] Unexpected error for property {req.id}: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"AI analysis failed ({type(e).__name__})")


# ── Compare endpoint ──────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    properties: list[PropertyAnalysisRequest]  # 2–4 properties


class PropertyRating(BaseModel):
    id: str
    overall_score: int           # 1–10
    strengths: list[str]
    weaknesses: list[str]


class CompareResult(BaseModel):
    ratings: list[PropertyRating]
    best_pick_id: str
    best_pick_reason: str
    summary: str                 # 2–3 sentence holistic comparison


@router.post("/compare", response_model=CompareResult)
async def compare_properties(req: CompareRequest) -> CompareResult:
    if not (2 <= len(req.properties) <= 4):
        raise HTTPException(status_code=400, detail="Provide 2–4 properties to compare")
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured")

    props_text = ""
    for i, p in enumerate(req.properties, 1):
        price_cr = p.price / 10_000_000
        props_text += f"""
Property {i} (ID: {p.id}):
  - Title: {p.title}
  - Type: {p.property_type} | Status: {p.status}
  - Price: ₹{price_cr:.2f} Cr (₹{p.price_per_sqft:,.0f}/sqft)
  - Area: {p.area_sqft:,.0f} sqft | Beds: {p.bedrooms or "N/A"} | Baths: {p.bathrooms or "N/A"}
  - Locality: {p.locality}, {p.city}
  - Builder: {p.builder_name or "N/A"} | RERA: {p.rera_status}
  - 3yr ROI: {p.roi_estimate_3yr}% | Risk: {p.risk_score}/100
  - Amenities: {", ".join(p.amenities) if p.amenities else "None"}
"""

    prompt = f"""You are a senior real estate investment analyst specializing in Hyderabad, India.
Compare the following {len(req.properties)} properties and provide a structured analysis.

{props_text}

Respond ONLY with a valid JSON object — no markdown, no code fences, no extra text:
{{
  "ratings": [
    {{
      "id": "<property ID>",
      "overall_score": <integer 1–10>,
      "strengths": ["<strength 1>", "<strength 2>"],
      "weaknesses": ["<weakness 1>", "<weakness 2>"]
    }}
    // one entry per property
  ],
  "best_pick_id": "<ID of the best property>",
  "best_pick_reason": "<1–2 sentence reason why this is the best pick>",
  "summary": "<2–3 sentence holistic comparison of all properties>"
}}"""

    try:
        client = _gemini_client()
        text = await _generate_with_retry(client, _GEMINI_MODEL, prompt)

        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        return CompareResult(**data)
    except json.JSONDecodeError as e:
        print(f"[Compare] Gemini returned invalid JSON: {e}\nRaw: {text[:300]}")
        raise HTTPException(status_code=502, detail="AI returned malformed comparison — please try again")
    except Exception as e:
        err_str = str(e)
        is_rate_limit = "429" in err_str or "Too Many Requests" in err_str or "RESOURCE_EXHAUSTED" in err_str
        if is_rate_limit:
            print(f"[Compare] Gemini rate limit exhausted after retries")
            raise HTTPException(status_code=429, detail="Too Many Requests")
        print(f"[Compare] Unexpected error: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"AI comparison failed ({type(e).__name__})")
