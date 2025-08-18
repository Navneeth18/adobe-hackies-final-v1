# backend/api/v1/endpoints/mindmap.py
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response
from typing import Optional
import os
import tempfile
from services.mindmap_service import mindmap_service
from db.database import mongo_db
from bson import ObjectId

router = APIRouter()

def convert_objectid_to_str(obj):
    """Convert ObjectId to string in MongoDB documents"""
    if isinstance(obj, dict):
        return {k: convert_objectid_to_str(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid_to_str(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.post("/mindmap/generate")
async def generate_mindmap_from_upload(
    file: UploadFile = File(...),
    max_sections: Optional[int] = 12,
    phrases_per_section: Optional[int] = 6
):
    """Generate mindmap from uploaded PDF file"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Generate mindmap
            mindmap_data = mindmap_service.generate_mindmap_from_pdf(
                temp_file_path,
                max_sections=max_sections,
                phrases_per_section=phrases_per_section
            )
            
            return {
                "success": True,
                "filename": file.filename,
                "mindmap": mindmap_data
            }
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate mindmap: {str(e)}")

@router.post("/mindmap/generate/{document_id}")
async def generate_mindmap_from_document(
    document_id: str,
    max_sections: Optional[int] = 12,
    phrases_per_section: Optional[int] = 6
):
    """Generate mindmap from existing document in database"""
    try:
        # Convert document_id to ObjectId if it's a valid ObjectId string
        try:
            doc_object_id = ObjectId(document_id)
        except Exception:
            # If it's not a valid ObjectId, try using it as string
            doc_object_id = document_id
        
        # Get document from database
        document = await mongo_db.db["documents"].find_one({"_id": doc_object_id})
        if not document:
            # Try with string ID if ObjectId didn't work
            document = await mongo_db.db["documents"].find_one({"_id": document_id})
        
        if not document:
            raise HTTPException(status_code=404, detail=f"Document not found with ID: {document_id}")
        
        # Get document sections - try both ObjectId and string formats
        sections = await mongo_db.db["sections"].find({"document_id": document_id}).to_list(length=None)
        if not sections:
            # Try with ObjectId format
            sections = await mongo_db.db["sections"].find({"document_id": str(doc_object_id)}).to_list(length=None)
        
        if not sections:
            raise HTTPException(status_code=404, detail=f"No sections found for document ID: {document_id}")
        
        # Combine all section content
        combined_text = ""
        for section in sections:
            title = section.get('title', '')
            content = section.get('content', '')
            if title or content:
                combined_text += f"{title}\n{content}\n\n"
        
        if not combined_text.strip():
            raise HTTPException(status_code=400, detail="No text content found in document sections")
        
        # Generate mindmap from combined text
        mindmap_data = mindmap_service.generate_mindmap_from_text(
            combined_text,
            title=document.get('filename', 'Document'),
            max_sections=max_sections,
            phrases_per_section=phrases_per_section
        )
        
        return {
            "success": True,
            "document_id": document_id,
            "filename": document.get('filename', 'Unknown'),
            "mindmap": mindmap_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate mindmap: {str(e)}")

@router.get("/mindmap/download/{document_id}")
async def download_mindmap(
    document_id: str,
    format: str = "mermaid",  # "mermaid" or "freemind"
    max_sections: Optional[int] = 12,
    phrases_per_section: Optional[int] = 6
):
    """Download mindmap file for existing document"""
    if format not in ["mermaid", "freemind"]:
        raise HTTPException(status_code=400, detail="Format must be 'mermaid' or 'freemind'")
    
    try:
        # Generate mindmap data
        mindmap_response = await generate_mindmap_from_document(
            document_id, max_sections, phrases_per_section
        )
        mindmap_data = mindmap_response["mindmap"]
        filename = mindmap_response["filename"]
        
        # Get content based on format
        if format == "mermaid":
            content = mindmap_data["mermaid"]
            media_type = "text/plain"
            file_extension = "mmd"
        else:  # freemind
            content = mindmap_data["freemind"]
            media_type = "application/xml"
            file_extension = "mm"
        
        # Generate download filename
        base_name = os.path.splitext(filename)[0]
        download_filename = f"{base_name}_mindmap.{file_extension}"
        
        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={download_filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download mindmap: {str(e)}")

@router.post("/mindmap/text")
async def generate_mindmap_from_text(
    text: str,
    title: Optional[str] = "Document",
    max_sections: Optional[int] = 12,
    phrases_per_section: Optional[int] = 6
):
    """Generate mindmap from raw text input"""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text content is required")
    
    try:
        mindmap_data = mindmap_service.generate_mindmap_from_text(
            text,
            title=title or "Document",
            max_sections=max_sections,
            phrases_per_section=phrases_per_section
        )
        
        return {
            "success": True,
            "mindmap": mindmap_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate mindmap: {str(e)}")
