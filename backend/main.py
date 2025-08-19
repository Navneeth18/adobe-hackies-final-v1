# backend/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
from pathlib import Path
from db.database import mongo_db
from api.v1.router import api_router
from services.recommendation_engine import recommendation_service
from services.llm_service import llm_service
from services.tts_service import tts_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # On App Startup: Connect to DB and load all models
    await mongo_db.connect()
    recommendation_service.load_model()
    llm_service.configure()
    tts_service.configure()
    yield
    # On App Shutdown
    await mongo_db.disconnect()

app = FastAPI(
    title="Adobe Hackathon Finale - Document Insight Engine",
    description="API for connecting the dots across a personal document library.",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",   # your React/Vite frontend
    "http://localhost:8080",   # alternative port for frontend
    # you can add more domains here, e.g. "https://yourdomain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # or ["*"] to allow all
    allow_credentials=True,
    allow_methods=["*"],          # allow all HTTP methods
    allow_headers=["*"],          # allow all headers
)

app.include_router(api_router, prefix="/api")

# Static files configuration for serving React frontend
static_dir = Path(__file__).parent.parent / "frontend" / "dist"

# Only mount static files if the dist directory exists (production)
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir / "assets"), name="static")
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")

    # Catch-all route for React Router (SPA)
    @app.get("/{full_path:path}")
    async def serve_react_app(request: Request, full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/"):
            return {"error": "API route not found"}

        # Serve index.html for all non-API routes (React Router)
        return FileResponse(static_dir / "index.html")
else:
    # Development fallback when frontend dist doesn't exist
    @app.get("/")
    def read_root():
        return {"status": "API is running - Frontend not built yet"}