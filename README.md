# AI Nexus – Document Insight Engine

> **Demo Video**: [🎥 Watch Demo](https://your-demo-video-link-here.com)

A comprehensive AI-powered document intelligence platform that transforms PDF libraries into interactive knowledge hubs. Built for the Adobe Hackathon Finale with cutting-edge AI capabilities.

## ✨ Features Overview

### 📚 Document Management
- **PDF Upload & Processing**: Drag-and-drop upload with intelligent text extraction
- **Document Library**: Centralized storage and management of PDF collections
- **Adobe PDF Viewer**: Rich viewing experience with text selection and highlights
- **Semantic Search**: AI-powered search across document content using vector embeddings

### 🤖 AI-Powered Intelligence
- **Talk to PDF**: RAG-based conversational interface for document Q&A
- **Smart Insights**: LLM-generated insights from selected text or document sections
- **Content Recommendations**: AI-suggested related sections and documents
- **Knowledge Graphs**: Visual representation of document relationships

### 🎨 Content Generation
- **Mindmap Creation**: Generate interactive mindmaps in Mermaid and FreeMind formats
- **Podcast Generation**: Convert documents into engaging AI-generated audio discussions
- **Text-to-Speech**: Azure TTS with SSML support and multiple voice options
- **Audio Export**: Download generated podcasts and TTS audio

### 🔍 Advanced Search & Analysis
- **Vector Search**: Semantic similarity search across document collections
- **Section Analysis**: Automatic document structure detection and extraction
- **Multi-document Insights**: Cross-document analysis and recommendations

## 🚀 Docker Setup

### Prerequisites
- Docker and Docker Compose installed
- API keys for Google Gemini and Azure TTS
- Adobe Embed API key

### Quick Start
```bash
# 1. Clone the repository
git clone <repository-url>
cd adobe-hackies-final-v1

# 2. Configure environment variables (see below)
# Create backend/.env and frontend/.env files

# 3. Start the application
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Docker Commands
```bash
# Production deployment
docker-compose up -d

# Development with live reload
docker-compose -f docker-compose.dev.yml up -d

# Local development
docker-compose -f docker-compose.local.yml up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose build --no-cache
```

## 🔧 Environment Variables

### Backend Configuration (`backend/.env`)
```env
# Database Configuration
MONGO_CONNECTION_STRING=mongodb://mongo:27017
MONGO_DATABASE_NAME=adobe-hackies

# LLM Provider Settings
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_API_KEY=your_google_api_key_here

# Text-to-Speech Configuration
TTS_PROVIDER=azure
AZURE_TTS_KEY=your_azure_tts_key_here
AZURE_TTS_REGION=your_azure_region_here

# Optional Settings
PYTHONPATH=/app
```

### Frontend Configuration (`frontend/.env`)
```env
# Adobe PDF Viewer
ADOBE_EMBED_API_KEY=2a66854b8d8344dd9823037c42db2295

# API Base URL (optional, defaults to localhost:8000)
VITE_API_BASE_URL=http://localhost:8000
```

### Required API Keys

#### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `GOOGLE_API_KEY` in backend/.env

#### Azure Text-to-Speech
1. Create Azure Cognitive Services resource
2. Get subscription key and region
3. Add to `AZURE_TTS_KEY` and `AZURE_TTS_ENDPOINT`

#### Adobe Embed API Key
1. Visit [Adobe Developer Console](https://developer.adobe.com/console)
2. Create new project and add PDF Embed API
3. Add to `ADOBE_EMBED_API_KEY` in frontend/.env

## 🏗️ Tech Stack

- **Backend**: FastAPI (Python), MongoDB, Google Gemini LLM, Azure TTS
- **Frontend**: React 19 + Vite, Adobe Document Cloud SDK, TailwindCSS
- **Infrastructure**: Docker, Docker Compose, Multi-stage builds
- **AI/ML**: Sentence Transformers, Vector Search, RAG Pipeline
- **Database**: MongoDB with Motor async driver

## 📁 Project Structure

```
adobe-hackies-final-v1/
├── backend/                    # FastAPI Python Backend
│   ├── api/v1/endpoints/      # API endpoints for all features
│   ├── services/              # AI services and business logic
│   ├── core/                  # Configuration and settings
│   └── db/                    # Database connections
├── frontend/                  # React + Vite Frontend
│   ├── src/components/        # React components
│   └── src/services/          # API client services
├── docker-compose.yml         # Production deployment
├── docker-compose.dev.yml     # Development environment
└── Dockerfile                # Multi-stage build configuration
```

## 🚨 Troubleshooting

### Common Issues
- **MongoDB Connection**: Ensure MongoDB is running and connection string is correct
- **API Keys**: Verify all required API keys are set in environment files
- **Docker Issues**: Try `docker-compose down && docker-compose build --no-cache && docker-compose up -d`
- **Port Conflicts**: Ensure ports 8000 and 8080/5173 are available

### Support
For detailed implementation guides:
- Backend API documentation: See `backend/README.md`
- Frontend development guide: See `frontend/README.md`
