import asyncpg
import asyncio
import os
import traceback
from typing import List, Dict, Any, Optional

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://propellex:propellex@localhost:5432/propellex")

# Neon.tech requires SSL in production
_ssl = "require" if os.getenv("NODE_ENV") == "production" or "neon.tech" in DATABASE_URL else None

# ── Connection pool ───────────────────────────────────────────────────────────
# Single pool shared across all requests — avoids the ~50-100ms connect overhead
# per chat message / scoring call.
_pool: Optional[asyncpg.Pool] = None
_pool_lock = asyncio.Lock()


async def _get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is not None:
        return _pool
    async with _pool_lock:
        if _pool is None:
            try:
                _pool = await asyncpg.create_pool(
                    DATABASE_URL,
                    ssl=_ssl,
                    min_size=2,
                    max_size=8,
                    command_timeout=30,
                )
                print("[RAG] Connection pool created (min=2, max=8)")
            except Exception as e:
                print(f"[RAG] Failed to create connection pool: {type(e).__name__}: {e}")
                raise
    return _pool


async def close_pool() -> None:
    """Gracefully close the pool on shutdown. Call from app lifespan."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        print("[RAG] Connection pool closed")


async def get_relevant_properties(query: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieve top-N properties from DB matching the query for RAG context."""
    pool = await _get_pool()
    try:
        rows = await pool.fetch(
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
    except Exception as e:
        print(f"[RAG] get_relevant_properties query failed: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise


async def get_all_active_properties(limit: int = 200) -> List[Dict[str, Any]]:
    """Fetch properties for the scoring service."""
    pool = await _get_pool()
    try:
        rows = await pool.fetch(
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
    except Exception as e:
        print(f"[RAG] get_all_active_properties query failed: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise
