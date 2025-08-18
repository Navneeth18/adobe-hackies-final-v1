# backend/api/v1/endpoints/chat.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.recommendation_engine import recommendation_service
from services.llm_service import llm_service
from db.database import mongo_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    cluster_id: Optional[str] = None
    document_ids: Optional[List[str]] = None

class ChatResponse(BaseModel):
    answer: str
    relevant_sections: List[dict]
    success: bool
    error: Optional[str] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_with_documents(request: ChatRequest):
    """
    Chat endpoint for the "Talk to PDF" voice assistant.
    Performs RAG (Retrieval-Augmented Generation) using vector search and LLM.
    """
    try:
        if not request.query or len(request.query.strip()) < 3:
            raise HTTPException(status_code=400, detail="Query must be at least 3 characters long")

        # Determine which documents to search
        if request.document_ids:
            # Search specific documents
            doc_ids = request.document_ids
        elif request.cluster_id:
            # Search all documents in cluster
            doc_cursor = mongo_db.db["documents"].find({"cluster_id": request.cluster_id}, {"_id": 1})
            doc_ids = [str(doc["_id"]) async for doc in doc_cursor]
        else:
            # Search all documents if no specific scope provided
            doc_cursor = mongo_db.db["documents"].find({}, {"_id": 1})
            doc_ids = [str(doc["_id"]) async for doc in doc_cursor]

        if not doc_ids:
            return ChatResponse(
                answer="I don't have any documents to search through. Please upload some documents first.",
                relevant_sections=[],
                success=True
            )

        # Perform vector search to find relevant sections
        logger.info(f"Searching for relevant sections for query: {request.query[:50]}...")
        
        # Get all sections from the specified documents
        sections_cursor = mongo_db.db["sections"].find({"document_id": {"$in": doc_ids}})
        all_sections = await sections_cursor.to_list(length=None)
        
        if not all_sections:
            return ChatResponse(
                answer="I couldn't find any content in the specified documents to search through.",
                relevant_sections=[],
                success=True
            )

        # Use recommendation service to find most relevant sections
        if not recommendation_service.model:
            recommendation_service.load_model()

        # Create embeddings for the query
        query_embedding = recommendation_service.create_embeddings([request.query])[0]
        
        # Calculate similarity scores for all sections
        scored_sections = []
        for section in all_sections:
            if 'embedding' in section and section['embedding']:
                similarity = recommendation_service.cosine_similarity(query_embedding, section['embedding'])
                scored_sections.append({
                    'section': section,
                    'similarity': similarity
                })

        # Sort by similarity and get top 5 most relevant sections
        scored_sections.sort(key=lambda x: x['similarity'], reverse=True)
        top_sections = scored_sections[:5]

        # Prepare context for LLM
        context_sections = []
        for item in top_sections:
            section = item['section']
            context_sections.append({
                'document_id': str(section.get('document_id', '')),
                'title': section.get('title', 'Untitled Section'),
                'content': section.get('content', ''),
                'page_number': section.get('page', 0),
                'source': section.get('source', 'Unknown Document'),
                'similarity_score': round(item['similarity'], 4)
            })

        # Build context string for LLM
        context_text = ""
        for i, section in enumerate(context_sections, 1):
            context_text += f"\n[Section {i} from {section['source']} - Page {section['page_number']}]\n"
            context_text += f"Title: {section['title']}\n"
            context_text += f"Content: {section['content']}\n"

        # Create conversational prompt for LLM
        conversational_prompt = f"""You are a helpful AI assistant that answers questions about documents in a conversational, friendly tone. 

User's question: "{request.query}"

Based on the following relevant sections from the user's documents, provide a brief, conversational answer (2-3 sentences maximum). Be direct and helpful, as if you're speaking to them:

{context_text}

Important guidelines:
- Keep your response conversational and brief (like you're speaking out loud)
- Base your answer ONLY on the provided document content
- If the documents don't contain enough information to answer the question, say so politely
- Don't mention "according to the documents" - just answer naturally
- Focus on being helpful and direct

Answer:"""

        # Generate response using LLM
        if not llm_service.model:
            llm_service.configure()

        try:
            response = await llm_service.model.generate_content_async(conversational_prompt)
            answer = response.text.strip()
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            answer = "I'm having trouble generating a response right now. Please try again."

        return ChatResponse(
            answer=answer,
            relevant_sections=context_sections,
            success=True
        )

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return ChatResponse(
            answer="I encountered an error while processing your question. Please try again.",
            relevant_sections=[],
            success=False,
            error=str(e)
        )
