# backend/api/v1/endpoints/graph.py
from fastapi import APIRouter, HTTPException
from services.graph_service import graph_service

router = APIRouter()

@router.get("/graph/{cluster_id}")
async def get_knowledge_graph(cluster_id: str):
    """Generates and returns a knowledge graph for the given document cluster."""
    if not cluster_id:
        raise HTTPException(status_code=400, detail="cluster_id is required.")
    try:
        graph_data = await graph_service.build_knowledge_graph(cluster_id)
        return graph_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to build graph: {e}")