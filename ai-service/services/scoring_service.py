from typing import List, Dict, Any, Optional
import math

WEIGHTS = {
    "locality": 0.30,
    "budget": 0.25,
    "property_type": 0.20,
    "roi": 0.15,
    "risk": 0.10,
}

RISK_RANGES = {
    "low": (0, 33),
    "medium": (33, 66),
    "high": (66, 100),
}

REASON_LABELS = {
    "locality": "Matches your preferred localities",
    "budget": "Within your budget range",
    "property_type": "Matches your property type preference",
    "roi": "Close to your ROI target",
    "risk": "Aligned with your risk appetite",
}


def _score_property(prop: Dict[str, Any], prefs: Dict[str, Any]) -> Dict[str, Any]:
    scores: Dict[str, float] = {}

    # Locality (30%)
    localities = prefs.get("localities", [])
    if localities:
        locality = (prop.get("locality") or "").lower()
        scores["locality"] = 100 if any(l.lower() in locality for l in localities) else 0
    else:
        scores["locality"] = 70

    # Budget (25%) — prefs in rupees, prop price in paise
    budget_min = prefs.get("budget_min")
    budget_max = prefs.get("budget_max")
    price_rupees = (prop.get("price") or 0) / 100  # paise -> rupees

    if budget_min is not None and budget_max is not None and budget_max > budget_min:
        midpoint = (budget_min + budget_max) / 2
        half_range = (budget_max - budget_min) / 2
        deviation = abs(price_rupees - midpoint) / half_range if half_range else 1
        scores["budget"] = max(0, 100 - deviation * 100)
    else:
        scores["budget"] = 70

    # Property type (20%)
    types = prefs.get("property_types", [])
    if types:
        scores["property_type"] = 100 if prop.get("property_type") in types else 0
    else:
        scores["property_type"] = 70

    # ROI (15%)
    roi_target = prefs.get("roi_target")
    roi_actual = prop.get("roi_estimate_3yr")
    if roi_target is not None and roi_actual is not None:
        diff = abs(float(roi_actual) - float(roi_target))
        scores["roi"] = max(0, 100 - diff * 10)
    else:
        scores["roi"] = 70

    # Risk appetite (10%)
    risk_appetite = prefs.get("risk_appetite")
    if risk_appetite and risk_appetite in RISK_RANGES:
        min_r, max_r = RISK_RANGES[risk_appetite]
        risk_score = prop.get("risk_score") or 50
        scores["risk"] = 100 if min_r <= risk_score <= max_r else 30
    else:
        scores["risk"] = 70

    total = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
    top_factor = max(scores, key=scores.__getitem__)

    return {
        "match_score": round(total),
        "why_recommended": REASON_LABELS.get(top_factor, "Good overall match"),
        "score_breakdown": {k: round(v) for k, v in scores.items()},
    }


def score_and_rank(properties: List[Dict[str, Any]], prefs: Dict[str, Any], limit: int = 20) -> List[Dict[str, Any]]:
    scored = []
    for prop in properties:
        scoring = _score_property(prop, prefs)
        # Convert price to rupees for response
        price_rupees = (prop.get("price") or 0) / 100
        ppsf_rupees = (prop.get("price_per_sqft") or 0) / 100
        scored.append({
            **prop,
            "id": str(prop["id"]),
            "price": price_rupees,
            "price_per_sqft": ppsf_rupees,
            **scoring,
        })
    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored[:limit]
