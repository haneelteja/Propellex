from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
import os
import json

router = APIRouter(prefix="/analyze", tags=["analysis"])

# Configure Gemini with API key from environment
_api_key = os.getenv("GEMINI_API_KEY")
if _api_key:
    genai.configure(api_key=_api_key)


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
  "overall_score": <integer 1 to 10>
}}"""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = await model.generate_content_async(prompt)
        text = response.text.strip()

        # Strip accidental markdown fences
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        return PropertyAnalysis(**data)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")


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
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = await model.generate_content_async(prompt)
        text = response.text.strip()

        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        return CompareResult(**data)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")
