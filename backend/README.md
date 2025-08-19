# AI Nexus Backend - FastAPI API Documentation

Comprehensive FastAPI backend powering the AI Nexus document intelligence platform with advanced PDF processing, AI integrations, and multimedia generation capabilities.

## 🚀 Quick Start

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env  # Configure environment variables
uvicorn main:app --reload --port 8000
```

**API Documentation**: http://localhost:8000/docs

## 📊 AI Models & Technologies

### Language Models
- **Google Gemini 2.5 Flash**: Primary LLM for insights, chat, and content generation
- **Sentence Transformers**: `all-MiniLM-L6-v2` for text embeddings and semantic search
- **TF-IDF Vectorizer**: Key phrase extraction for mindmap generation

### Speech & Audio
- **Azure Cognitive Services TTS**: Multi-language speech synthesis with SSML
- **Voice Options**: Multiple Azure neural voices (en-US-JennyNeural, en-US-GuyNeural, etc.)
- **Audio Processing**: PyDub for audio manipulation and export

### Document Processing
- **PDFMiner.six**: Advanced PDF text extraction and structure analysis
- **PyMuPDF (fitz)**: PDF rendering and metadata extraction
- **NLTK**: Natural language processing for text analysis
- **Scikit-learn**: Machine learning utilities for recommendations

## 🗄️ Database Models

### Document Model
```python
{
    "_id": ObjectId,
    "filename": str,
    "cluster_id": str,
    "upload_timestamp": datetime,
    "file_size": int,
    "content_type": str,
    "sections": [
        {
            "section_id": str,
            "title": str,
            "content": str,
            "page_number": int,
            "embedding": List[float],  # 384-dim vector
            "word_count": int
        }
    ],
    "metadata": {
        "total_pages": int,
        "total_sections": int,
        "language": str
    }
}
```

### Chat History Model
```python
{
    "_id": ObjectId,
    "session_id": str,
    "document_id": str,
    "messages": [
        {
            "role": "user" | "assistant",
            "content": str,
            "timestamp": datetime,
            "relevant_sections": List[str]  # section_ids
        }
    ],
    "created_at": datetime
}
```

### Audio Generation Model
```python
{
    "_id": ObjectId,
    "filename": str,
    "content_type": "podcast" | "tts",
    "source_text": str,
    "voice_settings": {
        "voice_name": str,
        "language": str,
        "rate": float,
        "pitch": float
    },
    "duration_seconds": float,
    "file_size": int,
    "created_at": datetime
}
```

## 📡 Detailed API Documentation

### Document Management APIs

#### Upload Documents
```http
POST /api/v1/documents/upload_cluster
Content-Type: multipart/form-data

Request Body:
- files: List[UploadFile] (PDF files)
- cluster_name: str (optional)

Response:
{
    "cluster_id": "string",
    "documents": [
        {
            "document_id": "string",
            "filename": "string",
            "sections_count": int,
            "processing_status": "completed"
        }
    ]
}
```

#### List Documents
```http
GET /api/v1/documents

Response:
{
    "documents": [
        {
            "_id": "string",
            "filename": "string",
            "cluster_id": "string",
            "upload_timestamp": "datetime",
            "sections_count": int
        }
    ]
}
```

#### Search Documents
```http
POST /api/v1/documents/search
Content-Type: application/json

Request Body:
{
    "query": "string",
    "limit": int (default: 10),
    "similarity_threshold": float (default: 0.5)
}

Response:
{
    "results": [
        {
            "section_id": "string",
            "document_id": "string",
            "title": "string",
            "content": "string",
            "similarity_score": float,
            "page_number": int
        }
    ]
}
```

### AI Chat APIs

#### Chat with Documents
```http
POST /api/v1/chat/
Content-Type: application/json

Request Body:
{
    "message": "string",
    "document_ids": ["string"] (optional),
    "session_id": "string" (optional)
}

Response:
{
    "response": "string",
    "relevant_sections": [
        {
            "section_id": "string",
            "title": "string",
            "relevance_score": float
        }
    ],
    "session_id": "string"
}
```

### Content Generation APIs

#### Generate Mindmap
```http
POST /api/v1/mindmap/generate
Content-Type: application/json

Request Body:
{
    "source_type": "pdf" | "text" | "document",
    "content": "string" (for text) | null,
    "document_id": "string" (for document) | null,
    "pdf_file": "base64" (for pdf) | null,
    "format": "mermaid" | "freemind",
    "max_sections": int (default: 10),
    "phrases_per_section": int (default: 5)
}

Response:
{
    "mindmap_content": "string",
    "format": "string",
    "sections_processed": int,
    "total_phrases": int
}
```

#### Text-to-Speech
```http
POST /api/v1/tts/synthesize
Content-Type: application/json

Request Body:
{
    "text": "string",
    "voice_name": "string" (default: "en-US-JennyNeural"),
    "language": "string" (default: "en-US"),
    "rate": float (default: 1.0),
    "pitch": float (default: 1.0),
    "use_ssml": bool (default: false)
}

Response:
{
    "audio_filename": "string",
    "duration_seconds": float,
    "download_url": "/api/v1/tts/serve/{filename}"
}
```

#### Generate Podcast
```http
POST /api/v1/audio/selected-text-podcast
Content-Type: application/json

Request Body:
{
    "selected_text": "string",
    "context": "string" (optional),
    "voice_1": "string" (default: "en-US-JennyNeural"),
    "voice_2": "string" (default: "en-US-GuyNeural"),
    "discussion_style": "casual" | "formal" | "educational"
}

Response:
{
    "audio_filename": "string",
    "transcript": "string",
    "duration_seconds": float,
    "download_url": "/api/v1/tts/serve/{filename}"
}
```

## 🔧 Implementation Details

### PDF Processing Pipeline
1. **Upload**: Files received via multipart/form-data
2. **Text Extraction**: PDFMiner.six extracts text and structure
3. **Section Detection**: NLTK-based sentence segmentation
4. **Embedding Generation**: Sentence transformers create 384-dim vectors
5. **Storage**: MongoDB stores documents with embedded vectors
6. **Indexing**: Vector similarity search preparation

### RAG (Retrieval-Augmented Generation) Implementation
```python
# Semantic search for relevant sections
query_embedding = model.encode(user_query)
similar_sections = vector_search(query_embedding, threshold=0.5)

# Context preparation
context = "\n\n".join([section.content for section in similar_sections])

# LLM prompt construction
prompt = f"""
Context: {context}
Question: {user_query}
Answer based on the provided context:
"""

# Gemini API call
response = gemini_client.generate_content(prompt)
```

### Mindmap Generation Algorithm
1. **Text Processing**: Extract key sections from PDF
2. **TF-IDF Analysis**: Identify important phrases per section
3. **Hierarchical Structure**: Create parent-child relationships
4. **Format Generation**: Convert to Mermaid or FreeMind syntax
5. **Optimization**: Limit nodes for readability

### Audio Generation Pipeline
1. **Script Generation**: LLM creates conversational dialogue
2. **SSML Preparation**: Add speech markup for natural flow
3. **Voice Synthesis**: Azure TTS generates audio segments
4. **Audio Merging**: PyDub combines segments with transitions
5. **File Storage**: Save to filesystem with metadata

### Key Dependencies
```python
# Core Framework
fastapi==0.116.1
uvicorn==0.35.0

# Database
motor==3.7.1          # Async MongoDB
pymongo==4.14.0

# AI/ML
google-generativeai==0.8.5
sentence-transformers==2.7.0
scikit-learn==1.7.1
nltk==3.8.1

# Document Processing
pdfminer.six==20250506
PyMuPDF==1.23.26

# Audio Processing
azure-cognitiveservices-speech==1.45.0
pydub==0.25.1

# Utilities
pydantic==2.11.7
python-multipart==0.0.20
```

## 🔍 Service Architecture

### Core Services

#### LLM Service (`services/llm_service.py`)
- **Purpose**: Google Gemini integration for text generation
- **Features**: Chat responses, insights generation, content summarization
- **Models**: Gemini 2.5 Flash with configurable parameters

#### TTS Service (`services/tts_service.py`)
- **Purpose**: Azure Cognitive Services text-to-speech
- **Features**: SSML support, multiple voices, audio file management
- **Formats**: WAV, MP3 output with configurable quality

#### PDF Processor (`services/pdf_processor.py`)
- **Purpose**: Document parsing and text extraction
- **Features**: Section detection, metadata extraction, content cleaning
- **Libraries**: PDFMiner.six, PyMuPDF for robust processing

#### Mindmap Service (`services/mindmap_service.py`)
- **Purpose**: Visual knowledge representation generation
- **Features**: TF-IDF analysis, hierarchical structure creation
- **Formats**: Mermaid diagrams, FreeMind XML

#### Recommendation Engine (`services/recommendation_engine.py`)
- **Purpose**: Content similarity and suggestions
- **Features**: Vector similarity, collaborative filtering
- **Algorithms**: Cosine similarity, TF-IDF matching

### Database Collections

#### Documents Collection
```javascript
// Indexes
db.documents.createIndex({ "cluster_id": 1 })
db.documents.createIndex({ "filename": "text" })
db.documents.createIndex({ "sections.embedding": "2dsphere" })
```

#### Audio Files Collection
```javascript
// TTL Index for cleanup
db.audio_files.createIndex(
    { "created_at": 1 }, 
    { expireAfterSeconds: 604800 }  // 7 days
)
```

## 🚀 Performance Optimizations

### Async Operations
- All I/O operations use async/await
- MongoDB operations with Motor async driver
- Concurrent processing for batch operations

### Caching Strategy
- Embedding vectors cached in memory
- Frequently accessed documents cached
- Audio files cached with TTL

### Vector Search Optimization
- Pre-computed embeddings stored in database
- Efficient similarity calculations
- Configurable similarity thresholds

## 🛠️ Development & Testing

### API Testing
```bash
# Test document upload
curl -X POST "http://localhost:8000/api/v1/documents/upload_cluster" \
     -H "Content-Type: multipart/form-data" \
     -F "files=@document.pdf"

# Test semantic search
curl -X POST "http://localhost:8000/api/v1/documents/search" \
     -H "Content-Type: application/json" \
     -d '{"query": "artificial intelligence", "limit": 5}'
```

### Error Handling
- Pydantic models for request validation
- Custom exception handlers
- Structured error responses
- Comprehensive logging

### Monitoring
- Health check endpoints
- Request/response logging
- Performance metrics
- Error tracking
