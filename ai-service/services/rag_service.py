import asyncpg
import os
from typing import List, Dict, Any

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://propellex:propellex@localhost:5432/propellex")

async def get_relevant_properties(query: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieve top-N properties from DB matching the query for RAG context."""
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch(
            """
            SELECT id, title, property_type, status, price, price_per_sqft,
                   area_sqft, bedrooms, bathrooms, locality, city,
                   rera_status, risk_score, roi_estimate_3yr,
                   builder_name, amenities, description
            FROM properties
            WHERE is_active = true
              AND (
                search_vector @@ plainto_tsquery('english', $1)
                OR locality ILIKE $2
                OR title ILIKE $2
              )
            ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC NULLS LAST
            LIMIT $3
            """,
            query, f"%{query}%", limit
        )
        return [
            {
                "id": str(r["id"]),
                "title": r["title"],
                "type": r["property_type"],
                "status": r["status"],
                "price_cr": round(r["price"] / 10_000_000, 2),  # paise -> crore
                "price_per_sqft": round(r["price_per_sqft"] / 100, 0),
                "area_sqft": r["area_sqft"],
                "bedrooms": r["bedrooms"],
                "locality": r["locality"],
                "rera_status": r["rera_status"],
                "risk_score": r["risk_score"],
                "roi_3yr_pct": float(r["roi_estimate_3yr"]) if r["roi_estimate_3yr"] else None,
                "builder": r["builder_name"],
            }
            for r in rows
        ]
    finally:
        await conn.close()


async def get_all_active_properties(limit: int = 200) -> List[Dict[str, Any]]:
    """Fetch properties for the scoring service."""
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch(
            """
            SELECT id, title, property_type, status, price, area_sqft,
                   bedrooms, locality, risk_score, roi_estimate_3yr,
                   rera_status, photos, price_per_sqft
            FROM properties WHERE is_active = true
            ORDER BY published_at DESC NULLS LAST
            LIMIT $1
            """,
            limit
        )
        return [dict(r) for r in rows]
    finally:
        await conn.close()
