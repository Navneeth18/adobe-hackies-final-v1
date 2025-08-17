# backend/api/v1/endpoints/recommendations.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.recommendation_engine import recommendation_service

router = APIRouter()

class RecoRequest(BaseModel):
    query_text: str
    cluster_id: str

@router.post("/recommendations")
async def get_recommendations(request: RecoRequest):
    if not request.query_text or not request.cluster_id:
        raise HTTPException(status_code=400, detail="query_text and cluster_id are required.")
    try:
        return await recommendation_service.find_related_sections(request.query_text, request.cluster_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {e}")