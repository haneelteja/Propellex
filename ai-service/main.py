from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, recommendations
import os

app = FastAPI(title="Propellex AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(recommendations.router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "propellex-ai"}
