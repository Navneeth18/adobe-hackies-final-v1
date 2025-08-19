# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
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
    "http://localhost:5173",   # your React/Vite frontend (dev)
    "http://localhost:8080",   # frontend container port
    "http://frontend:8080",    # frontend service name in Docker
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

# Static files configuration removed - frontend runs as separate service
# The frontend will be served from a separate container on port 8080

@app.get("/")
def read_root():
    return {"status": "Backend API is running", "docs": "/docs"}