# backend/api/v1/endpoints/documents.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
import shutil, os, uuid
from bson import ObjectId
from services.pdf_processor import pdf_processor_service
from services.recommendation_engine import recommendation_service
from db.database import mongo_db

router = APIRouter()

# Pydantic models for tag management
class TagsUpdateRequest(BaseModel):
    tags: List[str]

def convert_objectid_to_str(obj):
    """Convert ObjectId to string in MongoDB documents"""
    if isinstance(obj, dict):
        return {k: convert_objectid_to_str(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid_to_str(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.get("/documents")
async def get_documents():
    """Retrieve all uploaded documents"""
    try:
        documents = await mongo_db.db["documents"].find({}).to_list(length=None)
        # Convert ObjectIds to strings
        documents = convert_objectid_to_str(documents)
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve documents: {str(e)}")

@router.get("/documents/{cluster_id}")
async def get_documents_by_cluster(cluster_id: str, tags: Optional[str] = Query(None, description="Comma-separated list of tags to filter by")):
    """Retrieve documents by cluster ID, optionally filtered by tags"""
    try:
        # Build the query filter
        query_filter = {"cluster_id": cluster_id}

        # Add tag filtering if tags parameter is provided
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
            if tag_list:
                # Find documents that contain ALL specified tags
                query_filter["tags"] = {"$all": tag_list}

        documents = await mongo_db.db["documents"].find(query_filter).to_list(length=None)
        # Convert ObjectIds to strings
        documents = convert_objectid_to_str(documents)
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve documents: {str(e)}")

@router.get("/documents/sections/{document_id}")
async def get_document_sections(document_id: str):
    """Retrieve sections for a specific document"""
    try:
        sections = await mongo_db.db["sections"].find({"document_id": document_id}).to_list(length=None)
        # Convert ObjectIds to strings
        sections = convert_objectid_to_str(sections)
        return {"sections": sections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve sections: {str(e)}")

@router.post("/documents/semantic-search")
async def semantic_search(request: dict):
    """Find relevant sections and snippets based on selected text"""
    try:
        selected_text = request.get("selected_text", "").strip()
        if not selected_text:
            raise HTTPException(status_code=400, detail="Selected text is required")

        # Generate embedding safely
        query_embeddings = recommendation_service.create_embeddings([selected_text])
        if not query_embeddings or len(query_embeddings) == 0:
            raise HTTPException(status_code=500, detail="Failed to generate embedding for query text")
        query_embedding = query_embeddings[0]

        # Fetch sections from DB
        all_sections = await mongo_db.db["sections"].find({}).to_list(length=None)
        all_sections = convert_objectid_to_str(all_sections)

        similar_sections = []
        for section in all_sections:
            embedding = section.get("embedding")
            if embedding and isinstance(embedding, list):  # ensure valid vector
                try:
                    similarity = recommendation_service.cosine_similarity(
                        query_embedding, embedding
                    )
                    similar_sections.append({
                        "section": section,
                        "similarity": float(similarity)
                    })
                except Exception as e:
                    print(f"⚠️ Similarity calc failed for section {section.get('_id')}: {e}")

        if not similar_sections:
            return {
                "snippets": [],
                "selected_text": selected_text,
                "contradictions": [],
                "alternate_viewpoints": []
            }

        # Sort by similarity and take top matches
        similar_sections.sort(key=lambda x: x["similarity"], reverse=True)
        top_sections = similar_sections[:10]

        # Analyze contradictions + alternate viewpoints
        top_contents = [s["section"].get("content", "") for s in top_sections]
        contradictions = recommendation_service.find_contradictions(selected_text, top_contents)
        alternate_viewpoints = recommendation_service.find_alternate_viewpoints(selected_text, top_contents)

        # Get document info for snippets
        document_info = {}
        for item in top_sections:
            doc_id = item["section"].get("document_id")
            if doc_id and doc_id not in document_info:
                doc = await mongo_db.db["documents"].find_one({"_id": doc_id})
                if doc:
                    document_info[doc_id] = {
                        "filename": doc.get("filename", "Unknown"),
                        "cluster_id": doc.get("cluster_id")
                    }

        # Extract snippets
        snippets = []
        for item in top_sections:
            section = item["section"]
            content = section.get("content", "")
            if not content:
                continue

            sentences = content.split(". ")
            relevant_sentences = []

            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) > 20:
                    try:
                        sent_embed = recommendation_service.create_embeddings([sentence])[0]
                        sent_sim = recommendation_service.cosine_similarity(query_embedding, sent_embed)
                        if sent_sim > 0.3:  # relevance threshold
                            relevant_sentences.append({
                                "text": sentence,
                                "similarity": float(sent_sim)
                            })
                    except Exception as e:
                        print(f"⚠️ Sentence embedding failed: {e}")

            relevant_sentences.sort(key=lambda x: x["similarity"], reverse=True)
            doc_id = section.get("document_id")
            doc_info = document_info.get(doc_id, {})
            
            for sentence in relevant_sentences[:2]:
                snippets.append({
                    "text": sentence["text"],
                    "section_title": section.get("title", "Untitled"),
                    "document_id": doc_id,
                    "document_filename": doc_info.get("filename", "Unknown"),
                    "document_cluster_id": doc_info.get("cluster_id"),
                    "page_number": section.get("page"),
                    "similarity": sentence["similarity"]
                })

        snippets.sort(key=lambda x: x["similarity"], reverse=True)

        return {
            "snippets": snippets[:10],
            "selected_text": selected_text,
            "contradictions": contradictions,
            "alternate_viewpoints": alternate_viewpoints
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Semantic search error: {e}")
        raise HTTPException(status_code=500, detail=f"Semantic search failed: {str(e)}")

@router.get("/documents/{document_id}/pdf")
async def get_document_pdf(document_id: str):
    """Retrieve the original PDF file for a document"""
    try:
        # Get document info from database
        # Try to find document by string ID first
        document = await mongo_db.db["documents"].find_one({"_id": document_id})
        
        # If not found, try to convert to ObjectId (if it's a valid ObjectId)
        if not document and ObjectId.is_valid(document_id):
            document = await mongo_db.db["documents"].find_one({"_id": ObjectId(document_id)})
            
        if not document:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
        
        # Get the document ID from the document
        doc_id = document["_id"]
        
        # Check if PDF file exists with the document ID
        pdf_path = os.path.join("pdf_storage", f"{doc_id}.pdf")
        if not os.path.exists(pdf_path):
            # Log the error for debugging
            print(f"PDF file not found at {pdf_path}")
            # List all files in the pdf_storage directory
            if os.path.exists("pdf_storage"):
                print(f"Files in pdf_storage: {os.listdir('pdf_storage')}")
            raise HTTPException(status_code=404, detail=f"PDF file for document {doc_id} not found")
        
        # Return the PDF file
        return FileResponse(pdf_path, media_type="application/pdf", filename=document["filename"])
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to retrieve PDF: {str(e)}")

@router.post("/documents/upload_cluster", status_code=201)
async def upload_document_cluster(files: List[UploadFile] = File(...)):
    if not files: raise HTTPException(status_code=400, detail="No files uploaded.")
    cluster_id, temp_dir = str(uuid.uuid4()), f"temp_cluster_{str(uuid.uuid4())}"
    os.makedirs(temp_dir, exist_ok=True)
    os.makedirs("pdf_storage", exist_ok=True)  # Create PDF storage directory if it doesn't exist

    saved_paths = []
    try:
        for file in files:
            path = os.path.join(temp_dir, file.filename)
            saved_paths.append(path)
            with open(path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
            file.file.close()

        extraction_results = pdf_processor_service.extract_parallel(saved_paths)
        all_sections, texts_to_embed, doc_records = [], [], []

        for path, result in extraction_results.items():
            sections = result.get("sections", [])
            bookmarks = result.get("bookmarks", [])

            if not sections: continue
            doc_id = str(uuid.uuid4())
            filename = os.path.basename(path)
            doc_records.append({
                "_id": doc_id,
                "filename": filename,
                "cluster_id": cluster_id,
                "total_sections": len(sections),
                "tags": [],  # Initialize with empty tags array
                "bookmarks": bookmarks  # Store extracted bookmarks
            })

            # Save the PDF file permanently
            pdf_storage_path = os.path.join("pdf_storage", f"{doc_id}.pdf")
            shutil.copy(path, pdf_storage_path)

            for s in sections:
                s["document_id"] = doc_id
                all_sections.append(s)
                texts_to_embed.append(f"{s['title']}. {s['content']}")

        if not all_sections: raise HTTPException(status_code=400, detail="No processable sections found.")

        embeddings = recommendation_service.create_embeddings_batch(texts_to_embed)
        for i, section in enumerate(all_sections): section["embedding"] = embeddings[i]

        await mongo_db.db["documents"].insert_many(doc_records)
        await mongo_db.db["sections"].insert_many(all_sections)
    finally:
        if os.path.exists(temp_dir): shutil.rmtree(temp_dir)

    return {"cluster_id": cluster_id, "processed_files_count": len(doc_records)}

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and all its sections"""
    try:
        # Try to find document by string ID first
        document = await mongo_db.db["documents"].find_one({"_id": document_id})
        
        # If not found, try to convert to ObjectId (if it's a valid ObjectId)
        if not document and ObjectId.is_valid(document_id):
            document = await mongo_db.db["documents"].find_one({"_id": ObjectId(document_id)})
            
        if not document:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
        
        doc_id = document["_id"]
        
        # Delete the document from database
        delete_result = await mongo_db.db["documents"].delete_one({"_id": doc_id})
        
        # Delete all sections for this document
        await mongo_db.db["sections"].delete_many({"document_id": str(doc_id)})
        
        # Delete the PDF file if it exists
        pdf_path = os.path.join("pdf_storage", f"{doc_id}.pdf")
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        
        if delete_result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": f"Document {doc_id} deleted successfully", "deleted_document_id": str(doc_id)}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

@router.post("/documents/{document_id}/tags")
async def update_document_tags(document_id: str, request: TagsUpdateRequest):
    """Update tags for a specific document"""
    try:
        # Validate tags (remove empty strings and duplicates)
        tags = list(set([tag.strip() for tag in request.tags if tag.strip()]))

        # Try to find document by string ID first
        document = await mongo_db.db["documents"].find_one({"_id": document_id})

        # If not found, try to convert to ObjectId (if it's a valid ObjectId)
        if not document and ObjectId.is_valid(document_id):
            document = await mongo_db.db["documents"].find_one({"_id": ObjectId(document_id)})

        if not document:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")

        doc_id = document["_id"]

        # Update the document with new tags
        update_result = await mongo_db.db["documents"].update_one(
            {"_id": doc_id},
            {"$set": {"tags": tags}}
        )

        if update_result.modified_count == 0:
            # Check if document exists but tags are the same
            updated_doc = await mongo_db.db["documents"].find_one({"_id": doc_id})
            if updated_doc and updated_doc.get("tags") == tags:
                return {"message": "Tags updated successfully", "tags": tags}
            raise HTTPException(status_code=404, detail="Document not found or no changes made")

        return {"message": "Tags updated successfully", "tags": tags}

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to update tags: {str(e)}")

@router.get("/tags/{cluster_id}")
async def get_cluster_tags(cluster_id: str):
    """Get all unique tags for documents in a specific cluster"""
    try:
        # Find all documents in the cluster
        documents = await mongo_db.db["documents"].find({"cluster_id": cluster_id}).to_list(length=None)

        if not documents:
            return {"tags": []}

        # Collect all unique tags from all documents in the cluster
        all_tags = set()
        for document in documents:
            tags = document.get("tags", [])
            if isinstance(tags, list):
                all_tags.update(tags)

        # Return sorted list of unique tags
        return {"tags": sorted(list(all_tags))}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve cluster tags: {str(e)}")

@router.get("/documents/{document_id}/bookmarks")
async def get_document_bookmarks(document_id: str):
    """Get bookmarks/table of contents for a specific document"""
    try:
        # Try to find document by string ID first
        document = await mongo_db.db["documents"].find_one({"_id": document_id})

        # If not found, try to convert to ObjectId (if it's a valid ObjectId)
        if not document and ObjectId.is_valid(document_id):
            document = await mongo_db.db["documents"].find_one({"_id": ObjectId(document_id)})

        if not document:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")

        # Get bookmarks from the document
        bookmarks = document.get("bookmarks", [])

        return {"bookmarks": bookmarks}

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to retrieve bookmarks: {str(e)}")