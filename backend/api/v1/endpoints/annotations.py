# backend/api/v1/endpoints/annotations.py
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel
import uuid
from datetime import datetime
from bson import ObjectId
from db.database import mongo_db

router = APIRouter()

# Pydantic models for annotation management
class AnnotationCreateRequest(BaseModel):
    document_id: str
    adobe_annotation_id: str
    annotation_data: Dict[str, Any]

class AnnotationResponse(BaseModel):
    id: str
    document_id: str
    adobe_annotation_id: str
    annotation_data: Dict[str, Any]
    created_at: str

def convert_objectid_to_str(obj):
    """Convert ObjectId to string in MongoDB documents"""
    if isinstance(obj, dict):
        return {k: convert_objectid_to_str(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid_to_str(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.post("/annotations")
async def create_annotation(request: AnnotationCreateRequest):
    """Save a new highlight/annotation to the database"""
    try:
        # Validate that the document exists
        document = await mongo_db.db["documents"].find_one({"_id": request.document_id})
        if not document and ObjectId.is_valid(request.document_id):
            document = await mongo_db.db["documents"].find_one({"_id": ObjectId(request.document_id)})
        
        if not document:
            raise HTTPException(status_code=404, detail=f"Document with ID {request.document_id} not found")
        
        # Check if annotation with this adobe_annotation_id already exists
        existing_annotation = await mongo_db.db["annotations"].find_one({
            "adobe_annotation_id": request.adobe_annotation_id
        })
        
        if existing_annotation:
            raise HTTPException(status_code=409, detail="Annotation with this ID already exists")
        
        # Create the annotation document
        annotation_doc = {
            "_id": str(uuid.uuid4()),
            "document_id": request.document_id,
            "adobe_annotation_id": request.adobe_annotation_id,
            "annotation_data": request.annotation_data,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Insert into database
        result = await mongo_db.db["annotations"].insert_one(annotation_doc)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to save annotation")
        
        # Return the created annotation
        annotation_doc = convert_objectid_to_str(annotation_doc)
        return {
            "message": "Annotation saved successfully",
            "annotation": annotation_doc
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to create annotation: {str(e)}")

@router.get("/annotations/{document_id}")
async def get_document_annotations(document_id: str):
    """Retrieve all saved highlights/annotations for a specific document"""
    try:
        # Validate that the document exists
        document = await mongo_db.db["documents"].find_one({"_id": document_id})
        if not document and ObjectId.is_valid(document_id):
            document = await mongo_db.db["documents"].find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
        
        # Fetch all annotations for this document
        annotations = await mongo_db.db["annotations"].find({
            "document_id": document_id
        }).to_list(length=None)
        
        # Convert ObjectIds to strings
        annotations = convert_objectid_to_str(annotations)
        
        return {
            "document_id": document_id,
            "annotations": annotations,
            "count": len(annotations)
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to retrieve annotations: {str(e)}")

@router.delete("/annotations/{adobe_annotation_id}")
async def delete_annotation(adobe_annotation_id: str):
    """Delete a specific highlight/annotation from the database"""
    try:
        # Find the annotation by adobe_annotation_id
        annotation = await mongo_db.db["annotations"].find_one({
            "adobe_annotation_id": adobe_annotation_id
        })
        
        if not annotation:
            raise HTTPException(status_code=404, detail=f"Annotation with ID {adobe_annotation_id} not found")
        
        # Delete the annotation
        delete_result = await mongo_db.db["annotations"].delete_one({
            "adobe_annotation_id": adobe_annotation_id
        })
        
        if delete_result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Annotation not found or already deleted")
        
        return {
            "message": "Annotation deleted successfully",
            "adobe_annotation_id": adobe_annotation_id,
            "document_id": annotation.get("document_id")
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to delete annotation: {str(e)}")

@router.get("/annotations/document/{document_id}/count")
async def get_annotation_count(document_id: str):
    """Get the count of annotations for a specific document"""
    try:
        # Validate that the document exists
        document = await mongo_db.db["documents"].find_one({"_id": document_id})
        if not document and ObjectId.is_valid(document_id):
            document = await mongo_db.db["documents"].find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
        
        # Count annotations for this document
        count = await mongo_db.db["annotations"].count_documents({
            "document_id": document_id
        })
        
        return {
            "document_id": document_id,
            "annotation_count": count
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to count annotations: {str(e)}")
