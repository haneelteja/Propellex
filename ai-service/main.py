import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, recommendations, analysis

app = FastAPI(title="Propellex AI Service", version="1.0.0")

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

@app.get("/health")
async def health():
    return {"status": "ok", "service": "propellex-ai"}
