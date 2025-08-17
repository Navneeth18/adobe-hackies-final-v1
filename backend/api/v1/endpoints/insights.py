# backend/api/v1/endpoints/insights.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.llm_service import llm_service

router = APIRouter()

class SnippetData(BaseModel):
    text: str
    section_title: Optional[str] = None
    document_id: Optional[str] = None
    similarity: Optional[float] = None

class InsightRequest(BaseModel):
    text: str
    related_snippets: Optional[List[SnippetData]] = None

@router.post("/insights")
async def get_insights(request: InsightRequest):
    if not request.text or len(request.text) < 20:
        raise HTTPException(status_code=400, detail="Text must be at least 20 characters.")
    
    # Convert snippets to dict format for LLM service
    snippets_data = None
    if request.related_snippets:
        snippets_data = [snippet.dict() for snippet in request.related_snippets]
    
    insights = await llm_service.generate_insights(request.text, snippets_data)
    if not insights:
        raise HTTPException(status_code=503, detail="Could not generate insights.")
    return insights