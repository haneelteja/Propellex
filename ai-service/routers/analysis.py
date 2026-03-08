from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import anthropic
import json

router = APIRouter(prefix="/analyze", tags=["analysis"])

client = anthropic.AsyncAnthropic()


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
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()

        # Strip accidental markdown fences
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        return PropertyAnalysis(**data)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")
