import os
import asyncio
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, recommendations, analysis, rera


# ── Keep-alive tasks ──────────────────────────────────────────────────────────

async def _ping_self():
    """Ping own /health every 10 min to prevent Render free-tier sleep."""
    port = os.getenv("PORT", "8001")
    url = f"http://localhost:{port}/health"
    await asyncio.sleep(60)  # wait for startup to finish
    while True:
        try:
            async with httpx.AsyncClient() as client:
                await client.get(url, timeout=10)
            print("[KeepAlive] Self-ping OK")
        except Exception as e:
            print(f"[KeepAlive] Self-ping failed: {e}")
        await asyncio.sleep(600)  # 10 minutes


async def _ping_db():
    """Run a lightweight query every 10 min to keep Neon from suspending."""
    from services.rag_service import _get_pool
    await asyncio.sleep(90)  # stagger slightly after self-ping
    while True:
        try:
            pool = await _get_pool()
            await pool.fetchval("SELECT 1")
            print("[KeepAlive] DB ping OK")
        except Exception as e:
            print(f"[KeepAlive] DB ping failed: {e}")
        await asyncio.sleep(600)  # 10 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    from services.rag_service import _get_pool, close_pool
    # Eagerly warm up the connection pool so the first request is fast
    try:
        await _get_pool()
    except Exception as e:
        print(f"[Startup] DB pool warm-up failed (non-fatal): {e}")

    # Start keep-alive background tasks
    t1 = asyncio.create_task(_ping_self())
    t2 = asyncio.create_task(_ping_db())
    yield
    # Graceful shutdown
    t1.cancel()
    t2.cancel()
    await close_pool()


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="Propellex AI Service", version="1.0.0", lifespan=lifespan)

# Accept any origin (AI service is called server-to-server, never from the browser)
# but lock down to known patterns if ALLOWED_ORIGINS is set.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(recommendations.router)
app.include_router(analysis.router)
app.include_router(rera.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "propellex-ai"}
