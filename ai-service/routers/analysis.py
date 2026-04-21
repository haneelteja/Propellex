from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError
from typing import Optional
from google import genai
import os
import json
import traceback
import asyncio

router = APIRouter(prefix="/analyze", tags=["analysis"])

_GEMINI_MODEL = "gemini-2.5-flash"

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
            is_transient = "503" in err_str or "UNAVAILABLE" in err_str
            if (is_rate_limit or is_transient) and attempt < max_retries - 1:
                wait_s = 30 * (attempt + 1) if is_rate_limit else 10 * (attempt + 1)
                print(f"[Analysis] {'Rate limited' if is_rate_limit else 'Transient error'} — waiting {wait_s}s before retry {attempt + 2}/{max_retries}")
                await asyncio.sleep(wait_s)
                continue
            raise
    raise RuntimeError("Max retries exceeded")


def _gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not configured")
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
    # Market benchmark for this locality (from live DB query)
    locality_avg_price_per_sqft: float = 0
    locality_min_price_per_sqft: float = 0
    locality_max_price_per_sqft: float = 0
    locality_property_count: int = 0


class PropertyAnalysis(BaseModel):
    advantages: list[str]
    disadvantages: list[str]
    future_projects: list[str]
    government_interest: str
    private_interest: str
    tech_employment_impact: str
    investment_recommendation: str
    market_insights: str
    risk_factors: list[str]
    best_suited_for: str
    builder_grade: str        # 'premium' | 'verified' | 'good' | 'standard' | 'unverified' | 'flagged'
    builder_grade_reason: str
    overall_score: int        # 0–10 (0 = flagged/suspicious)
    analysis_priority: str    # 'high' | 'medium' | 'low'


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

    has_benchmark = req.locality_property_count > 1
    if has_benchmark:
        benchmark_str = f"""
LOCALITY MARKET BENCHMARK ({req.locality} — {req.locality_property_count} comparable properties in DB):
  - Avg price/sqft: ₹{req.locality_avg_price_per_sqft:,.0f}
  - Min price/sqft: ₹{req.locality_min_price_per_sqft:,.0f}
  - Max price/sqft: ₹{req.locality_max_price_per_sqft:,.0f}
  - This property: ₹{req.price_per_sqft:,.0f}/sqft ({req.price_per_sqft / req.locality_avg_price_per_sqft:.2f}× locality avg)"""
        price_ratio = req.price_per_sqft / req.locality_avg_price_per_sqft if req.locality_avg_price_per_sqft > 0 else 1.0
    else:
        benchmark_str = f"\nLOCALITY BENCHMARK: Insufficient data ({req.locality_property_count} properties) — use your Hyderabad market knowledge."
        price_ratio = 1.0

    prompt = f"""You are a senior real estate investment analyst specializing in Hyderabad, India with 20+ years of experience.
Provide a deep, expert-level investment analysis for this property. Be specific, factual, and brutally honest.

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
{benchmark_str}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORING RUBRIC — follow this exactly to compute overall_score:

Base score: 5

[A] Price vs locality benchmark (apply ONE):
  • price_per_sqft > 3× locality avg  → overall_score = 0 immediately (FLAGGED: suspiciously overpriced / likely fake listing)
  • price_per_sqft < 0.35× locality avg → overall_score = 0 immediately (FLAGGED: suspiciously cheap / likely fake listing)
  • price_per_sqft 2–3× avg           → −2
  • price_per_sqft 1.5–2× avg         → −1
  • price_per_sqft 0.85–1.15× avg     → ±0 (fairly priced)
  • price_per_sqft 0.5–0.85× avg      → +1 (value opportunity)
  • price_per_sqft 0.35–0.5× avg      → ±0 (check for red flags)
  (If no benchmark: use your expert knowledge of {req.locality} pricing)

[B] RERA modifier:
  • verified      → +1
  • pending       → ±0
  • flagged       → −3, cap score at 4
  • not_registered → −2, cap score at 5
  • unknown       → −1

[C] ROI modifier:
  • >15%   → +2
  • 10–15% → +1
  • 5–10%  → ±0
  • <5%    → −1

[D] Risk score modifier (lower = safer):
  • <20  → +1
  • 20–50 → ±0
  • >70  → −1

[E] Location fundamentals (your expert judgment of {req.locality} micro-market, max ±1):
  Apply based on connectivity, demand, future growth, infrastructure.

[F] Builder modifier (after determining builder_grade below):
  • premium   → +1
  • verified  → ±0
  • good      → ±0
  • standard  → ±0
  • unverified → −1
  • flagged   → −2

Final score = Base(5) + A + B + C + D + E + F, clamped to [0, 10].
Score 0 = FLAGGED. Score 9–10 = genuinely exceptional (rare — justify explicitly).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BUILDER GRADE RULES — assign builder_grade for "{req.builder_name or 'Unknown'}":
  "premium"   — Major national brand: Sobha, Prestige, Godrej Properties, Brigade, Mahindra Lifespaces, DLF, Shapoorji Pallonji, Tata Housing, Lodha, Oberoi, Puravankara
  "verified"  — Established Hyderabad builder, 5+ delivered projects, clean RERA: Aparna, My Home, Vasavi, Aliens Group, Lansum, Vertex, SMR, NCC Urban, Ramky Estates, Sattva, Incor, Jayabheri
  "good"      — Reputable mid-tier builder, decent track record, mostly positive reviews, some delivered projects
  "standard"  — Smaller or newer builder, limited but clean track record, no red flags
  "unverified" — Unknown/new builder, no significant track record found
  "flagged"   — Builder with known complaints, stalled projects, court cases, or fraud allegations
  If builder name is null/unknown → "unverified"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT GUIDELINES:
- advantages: 3 specific positives of THIS property (not generic — location-specific, builder-specific, or feature-specific). Avoid repeating what is already visible in the listing.
- disadvantages: 2–3 honest negatives specific to this property or its locality. Be brutally honest.
- future_projects: 4–6 upcoming government or private infrastructure projects that will impact this locality or adjacent areas within 5 years. Include project name, expected completion, and impact on property value or liveability. Use your knowledge of Hyderabad's pipeline: Metro Phase II, ORR corridors, Regional Ring Road, Pharma City, ITIR, Aerospace SEZ, HMDA layouts, IT corridor expansions, data center clusters, etc.
- government_interest: 2–3 sentences on state/central government policy focus on this area — zoning, HMDA/GHMC masterplan, special economic zones, infrastructure budget allocations, political focus areas.
- private_interest: 2–3 sentences on private sector investment signals — major developers acquiring land, corporate campuses, retail/hospitality projects, FDI in the locality or adjacent areas.
- tech_employment_impact: 2–3 sentences on the tech/data center ecosystem proximity — which IT parks, SEZs, or data center hubs are within 15 km, which companies have campuses there, and how this drives residential demand and price appreciation.
- investment_recommendation: 3–4 sentence expert investment verdict including holding period, expected appreciation, and who should buy or avoid this property.
- market_insights: 2 sentences on the {req.locality} micro-market trend — current demand-supply, price trajectory, and any macro factors.
- risk_factors: 2–4 specific risk tags (short phrases, not sentences).
- best_suited_for: One sentence on the ideal buyer profile.
- builder_grade: One of: premium / verified / good / standard / unverified / flagged
- builder_grade_reason: 1 sentence justifying the grade.
- overall_score: Integer 0–10, computed using the rubric above.
- analysis_priority: "high" if score ≥ 8 or rapidly-changing locality, "medium" if score 5–7, "low" if score ≤ 4 or stable asset.

Respond ONLY with a valid JSON object — no markdown, no code fences, no extra text:
{{
  "advantages": ["<specific advantage 1>", "<specific advantage 2>", "<specific advantage 3>"],
  "disadvantages": ["<specific disadvantage 1>", "<specific disadvantage 2>"],
  "future_projects": ["<project name: description, expected year, impact>", "<project 2>", "<project 3>", "<project 4>"],
  "government_interest": "<2–3 sentences>",
  "private_interest": "<2–3 sentences>",
  "tech_employment_impact": "<2–3 sentences>",
  "investment_recommendation": "<3–4 sentence verdict>",
  "market_insights": "<2 sentences>",
  "risk_factors": ["<risk tag 1>", "<risk tag 2>"],
  "best_suited_for": "<buyer profile>",
  "builder_grade": "<premium|verified|good|standard|unverified|flagged>",
  "builder_grade_reason": "<1 sentence>",
  "overall_score": <integer 0–10>,
  "analysis_priority": "<high|medium|low>"
}}"""

    try:
        client = _gemini_client()
        text = await _generate_with_retry(client, _GEMINI_MODEL, prompt)

        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        # Clamp score to valid range
        data["overall_score"] = max(0, min(10, int(data.get("overall_score", 5))))
        # Defensively coerce list fields — Gemini occasionally returns a string instead of a list
        for list_field in ("advantages", "disadvantages", "future_projects", "risk_factors"):
            if isinstance(data.get(list_field), str):
                data[list_field] = [data[list_field]]
            elif not isinstance(data.get(list_field), list):
                data[list_field] = []
        return PropertyAnalysis(**data)
    except json.JSONDecodeError as e:
        print(f"[Analysis] Gemini returned invalid JSON for property {req.id}: {e}\nRaw: {text[:300]}")
        raise HTTPException(status_code=502, detail="AI returned malformed response — will retry on next analysis cycle")
    except ValidationError as e:
        print(f"[Analysis] Pydantic validation failed for property {req.id}: {e.errors()}")
        raise HTTPException(status_code=502, detail="AI returned schema-invalid response — will retry on next analysis cycle")
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
    overall_score: int           # 0–10
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
        benchmark = f"Locality avg: ₹{p.locality_avg_price_per_sqft:,.0f}/sqft ({p.locality_property_count} props)" if p.locality_property_count > 1 else "No benchmark"
        props_text += f"""
Property {i} (ID: {p.id}):
  - Title: {p.title}
  - Type: {p.property_type} | Status: {p.status}
  - Price: ₹{price_cr:.2f} Cr (₹{p.price_per_sqft:,.0f}/sqft) | {benchmark}
  - Area: {p.area_sqft:,.0f} sqft | Beds: {p.bedrooms or "N/A"} | Baths: {p.bathrooms or "N/A"}
  - Locality: {p.locality}, {p.city}
  - Builder: {p.builder_name or "N/A"} | RERA: {p.rera_status}
  - 3yr ROI: {p.roi_estimate_3yr}% | Risk: {p.risk_score}/100
  - Amenities: {", ".join(p.amenities) if p.amenities else "None"}
"""

    prompt = f"""You are a senior real estate investment analyst specializing in Hyderabad, India.
Compare the following {len(req.properties)} properties and provide a structured side-by-side analysis.
Use relative scoring — properties in the same comparison should be ranked against each other, not all given 8/10.
The best property in the group might score 7, and the worst might score 3 — spread the scores meaningfully.

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
