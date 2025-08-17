# backend/api/v1/endpoints/insights.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.llm_service import llm_service

router = APIRouter()

class InsightRequest(BaseModel):
    text: str

@router.post("/insights")
async def get_insights(request: InsightRequest):
    if not request.text or len(request.text) < 20:
        raise HTTPException(status_code=400, detail="Text must be at least 20 characters.")
    insights = await llm_service.generate_insights(request.text)
    if not insights:
        raise HTTPException(status_code=503, detail="Could not generate insights.")
    return insights