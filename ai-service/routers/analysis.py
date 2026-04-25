from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError
from typing import Optional
from google import genai
from google.oauth2 import service_account
import os
import json
import traceback
import asyncio

router = APIRouter(prefix="/analyze", tags=["analysis"])

_GEMINI_MODEL = "gemini-2.5-flash"
_VERTEX_LOCATION = "us-central1"

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
    """Build a Gemini client backed by Vertex AI (uses GCP credits, no AI Studio billing)."""
    sa_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not sa_json:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON not configured")
    sa_info = json.loads(sa_json)
    credentials = service_account.Credentials.from_service_account_info(
        sa_info,
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )
    return genai.Client(
        vertexai=True,
        project=sa_info["project_id"],
        location=_VERTEX_LOCATION,
        credentials=credentials,
    )


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
    overall_score: float      # 0.00–10.00 (0.00 = flagged/suspicious), 2 decimal places
    analysis_priority: str    # 'high' | 'medium' | 'low'


@router.post("/property", response_model=PropertyAnalysis)
async def analyze_property(req: PropertyAnalysisRequest) -> PropertyAnalysis:
    if not os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON"):
        raise HTTPException(status_code=503, detail="GOOGLE_SERVICE_ACCOUNT_JSON not configured")

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
SCORING RUBRIC — compute overall_score as a float with exactly 2 decimal places.
The score is the SUM of 7 sub-scores. Each sub-score is continuous (not discrete jumps)
so that scores across 184 properties form a meaningful distribution from ~1.5 to ~9.8.

FLAGGED check — evaluate FIRST. If either condition is true → overall_score = 0.00, stop:
  • price_per_sqft > 3.0× locality avg  (suspiciously overpriced / likely fake)
  • price_per_sqft < 0.35× locality avg (suspiciously cheap / likely fake)

Otherwise compute each sub-score and sum them:

[A] Price-to-value competitiveness (0.00–2.00)
  Ratio = price_per_sqft ÷ locality_avg_price_per_sqft (use your Hyderabad expertise if no benchmark):
  • ratio > 2.5×:        0.00–0.20 (severely overpriced)
  • ratio 2.0–2.5×:      0.20–0.55 (significantly overpriced)
  • ratio 1.5–2.0×:      0.55–0.95 (above market)
  • ratio 1.2–1.5×:      0.95–1.25 (moderately priced)
  • ratio 0.85–1.2×:     1.25–1.65 (fairly priced — interpolate within band)
  • ratio 0.60–0.85×:    1.65–1.90 (good value)
  • ratio 0.35–0.60×:    1.90–2.00 (exceptional value — verify no red flags first)
  Interpolate continuously within each band rather than snapping to band boundaries.

[B] Legal & RERA compliance (0.00–2.00)
  • verified:        2.00
  • pending:         1.20
  • unknown:         0.75
  • not_registered:  0.35 → ALSO cap total final score at 5.50
  • flagged:         0.00 → ALSO cap total final score at 3.50

[C] Return on investment strength (0.00–1.50)
  Use roi_estimate_3yr = {req.roi_estimate_3yr}%:
  • >20%:      1.50
  • 17–20%:    1.38–1.50 (interpolate)
  • 14–17%:    1.20–1.38
  • 11–14%:    0.98–1.20
  • 8–11%:     0.72–0.98
  • 5–8%:      0.42–0.72
  • 3–5%:      0.18–0.42
  • <3%:       0.00–0.18

[D] Risk profile (0.00–1.00) — lower risk_score = safer = higher sub-score
  Use risk_score = {req.risk_score}/100:
  • 0–15:   1.00
  • 16–25:  0.82–1.00 (interpolate)
  • 26–35:  0.64–0.82
  • 36–45:  0.46–0.64
  • 46–55:  0.30–0.46
  • 56–65:  0.15–0.30
  • 66–80:  0.04–0.15
  • >80:    0.00–0.04

[E] Location fundamentals (0.00–1.50) — your expert judgment of {req.locality} micro-market
  Consider: connectivity, demand depth, appreciation history, supply pipeline, infrastructure quality.
  Use these Hyderabad-specific benchmarks as anchor points; interpolate based on specifics:
  • Jubilee Hills, Banjara Hills:           1.30–1.50 (established luxury, constrained supply, deep demand)
  • Gachibowli, Hitech City, Madhapur:      1.10–1.40 (IT corridor, strong appreciation, infrastructure)
  • Kokapet, Nanakramguda:                  0.80–1.20 (emerging premium, high-growth, some infra gaps)
  • Kondapur:                               0.70–1.05 (good but congested, maturing market)
  • Other Hyderabad localities:             0.30–0.80 (based on your knowledge of the specific area)

[F] Builder / developer credibility (0.00–1.50) — assign after determining builder_grade
  • premium:    1.40–1.50
  • verified:   1.05–1.25
  • good:       0.70–0.92
  • standard:   0.35–0.58
  • unverified: 0.08–0.28
  • flagged:    0.00 → ALSO subtract 0.50 from the final total

[G] Amenities & livability (0.00–0.50) — based on count of amenities listed
  • 15+:   0.50
  • 12–14: 0.44
  • 9–11:  0.36
  • 6–8:   0.26
  • 3–5:   0.14
  • 1–2:   0.05
  • 0:     0.00

FINAL CALCULATION:
  raw = A + B + C + D + E + F + G
  Apply RERA/builder caps if triggered (not_registered → cap 5.50; flagged RERA → cap 3.50; flagged builder → subtract 0.50)
  overall_score = round(clamp(raw, 0.00, 10.00), 2)

  Score 0.00 = FLAGGED. Scores 9.50–10.00 = genuinely exceptional (rare — all dimensions must be near-perfect).
  Scores should vary meaningfully: a weak property should score 2–4, an average one 5–6.5, a strong one 7–8.5.
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
- overall_score: Float 0.00–10.00 with exactly 2 decimal places, computed using the rubric above (e.g. 7.43, 5.18, 9.02).
- analysis_priority: "high" if score ≥ 8.00 or rapidly-changing locality, "medium" if 5.00–7.99, "low" if < 5.00 or stable low-growth asset.

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
  "overall_score": <float 0.00–10.00 with 2 decimal places, e.g. 7.43>,
  "analysis_priority": "<high|medium|low>"
}}"""

    try:
        client = _gemini_client()
        text = await _generate_with_retry(client, _GEMINI_MODEL, prompt)

        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        # Clamp score to valid range
        data["overall_score"] = round(max(0.0, min(10.0, float(data.get("overall_score", 5.0)))), 2)
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
    overall_score: float         # 0.00–10.00, 2 decimal places
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
    if not os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON"):
        raise HTTPException(status_code=503, detail="GOOGLE_SERVICE_ACCOUNT_JSON not configured")

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
Use relative scoring with float values (2 decimal places) — rank properties against each other, not all at 8.00.
The best in a group might score 7.85 and the worst 3.42 — spread scores meaningfully to reflect real differences.

{props_text}

Respond ONLY with a valid JSON object — no markdown, no code fences, no extra text:
{{
  "ratings": [
    {{
      "id": "<property ID>",
      "overall_score": <float 0.00–10.00 with 2 decimal places>,
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
