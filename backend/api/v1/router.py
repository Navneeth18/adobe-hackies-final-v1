# backend/api/v1/router.py
from fastapi import APIRouter
from .endpoints import documents, recommendations, insights, podcast, graph, audio, chat, tts

api_router = APIRouter(prefix="/v1")

api_router.include_router(documents.router)
api_router.include_router(recommendations.router)
api_router.include_router(insights.router)
api_router.include_router(podcast.router)
api_router.include_router(graph.router)
api_router.include_router(audio.router)
api_router.include_router(chat.router)
api_router.include_router(tts.router)