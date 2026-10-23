# Adobe Hackies Final v1 - Architecture & User Flow Diagrams

This document describes the architecture of the Adobe Hackies Final v1 project based on the actual repository structure and implementation.

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TB
    User[User / Browser] --> Frontend[Frontend\nReact 19 + Vite + Tailwind CSS]
    Frontend --> Adobe[Adobe PDF Viewer SDK]
    Frontend --> API[FastAPI Backend\n/api/v1 routes]

    subgraph Backend[Backend Layer]
        Router[API Router\nDocuments / Chat / Insights / TTS / Podcast / Mindmap / Graph]
        Services[AI & Processing Services\nPDF Processor\nLLM Service\nRecommendation Engine\nTTS Service\nMindmap Service\nPodcast Service]
        DB[(MongoDB\nDocuments + Metadata + Embeddings)]
    end

    API --> Router
    Router --> Services
    Services --> DB

    subgraph External[External Integrations]
        Gemini[Google Gemini LLM]
        Azure[TTS Service\nAzure Speech]
        AdobeEmbed[Adobe Embed API]
    end

    Services --> Gemini
    Services --> Azure
    Frontend --> AdobeEmbed

    subgraph Storage[Local / Generated Assets]
        Files[Uploaded PDFs\nAudio Files\nGenerated Content]
    end

    Services --> Files
    DB --> Files
```

### High-Level Summary
- The project is a document intelligence platform built around a React frontend and a FastAPI backend.
- The frontend handles PDF viewing, document upload, search, chat, and generated media UI.
- The backend exposes multiple API modules for documents, recommendations, insights, podcast, audio, chat, TTS, mindmap, and annotations.
- AI services process PDFs, generate embeddings, answer questions, build summaries, create podcasts, and synthesize speech.
- MongoDB stores document metadata and embedded sections; generated files are stored as assets.
- External integrations include Google Gemini, Azure TTS, and Adobe PDF Embed API.

---

## 2. Low-Level Architecture Diagram

```mermaid
flowchart LR
    subgraph Frontend[Frontend Layer]
        App[frontend/src/App.jsx\nMain App Shell]
        Components[Components\nDragDropUpload\nPdfViewer\nTalkToPdfModal\nMindmapPanel\nSelectedTextPodcast\nSnippets\nInsightPanel]
        ServicesUI[Frontend Services\nAPI calls / fetch logic / state handling]
        State[React State + Hooks + Query]
    end

    subgraph Backend[FastAPI Backend]
        Main[backend/main.py\nApp startup + CORS + router registration]
        Router[backend/api/v1/router.py\nRoute Bundling]
        Docs[documents router\nUpload / list / search / parse]
        Chat[chat router\nDocument Q&A]
        Insights[insights router\nSmart analysis]
        Rec[recommendations router\nRelated docs / suggestions]
        Pod[podcast router\nPodcast generation]
        Graph[graph router\nKnowledge graph]
        Audio[audio router\nAudio workflows]
        TTS[tts router\nText-to-speech]
        Mind[mindmap router\nMindmap generation]
        Ann[annotations router\nDocument annotation handling]
    end

    subgraph Services[AI / Processing Services]
        Pdf[pdf_processor.py\nPDF extraction and text segmentation]
        LLM[llm_service.py\nGemini integration]
        RecEngine[recommendation_engine.py\nVector similarity + recommendations]
        TTSService[tts_service.py\nAzure speech synthesis]
        Mindmap[mindmap_service.py\nKey phrase and mindmap generation]
        Podcast[enhanced_podcast_service.py\nPodcast generation]
        GraphSvc[graph_service.py\nGraph generation]
    end

    subgraph Data[Data & Storage Layer]
        DB[(MongoDB\nMotor async driver)]
        Files[File Storage\nPDFs, audio, generated output]
    end

    App --> Components
    Components --> ServicesUI
    ServicesUI --> Main

    Main --> Router
    Router --> Docs
    Router --> Chat
    Router --> Insights
    Router --> Rec
    Router --> Pod
    Router --> Graph
    Router --> Audio
    Router --> TTS
    Router --> Mind
    Router --> Ann

    Docs --> Pdf
    Chat --> LLM
    Insights --> LLM
    Rec --> RecEngine
    TTS --> TTSService
    Mind --> Mindmap
    Pod --> Podcast
    Graph --> GraphSvc

    Pdf --> DB
    LLM --> DB
    RecEngine --> DB
    Podcast --> Files
    TTSService --> Files
    Mindmap --> Files
    GraphSvc --> DB

    DB --> Files
```

### Low-Level Structure Breakdown
- Frontend application is a single-page React app with modular components for PDF viewer, upload, chat, recommendations, mindmap, and podcast features.
- App logic is centralized in `frontend/src/App.jsx` and uses component-level UI orchestration for document workflows.
- Backend entry point is `backend/main.py`, which connects MongoDB and configures FastAPI CORS and startup dependencies.
- API endpoints are grouped under `backend/api/v1/router.py` and split across feature-specific modules.
- AI and workflow services live in `backend/services/` and include PDF parsing, LLM orchestration, recommendation engine, audio synthesis, graph generation, and mindmap creation.
- MongoDB is the main persistence layer for document records, metadata, embeddings, session data, and generated analysis content.

---

## 3. User Flow Diagram

```mermaid
flowchart TD
    Start[Open App\nUpload / View PDFs] --> Upload[Upload PDF Documents]
    Upload --> Process[Backend parses PDF\nExtract text + sections]
    Process --> Store[Store document metadata + sections in MongoDB]
    Store --> Index[Generate embeddings and searchable structure]

    Index --> Search[User searches or browses documents]
    Search --> Viewer[Adobe PDF viewer renders document]
    Viewer --> Select[Select text or document section]

    Select --> Chat[Talk to PDF / Chat with document]
    Select --> Insight[Generate Smart Insights]
    Select --> Mindmap[Create Mindmap]
    Select --> Podcast[Generate Podcast from selected text]
    Select --> TTS[Generate Text-to-Speech audio]

    Chat --> LLM[LLM + Retrieval Pipeline]
    Insight --> LLM
    Mindmap --> MindSvc[Mindmap Service]
    Podcast --> PodSvc[Podcast Service]
    TTS --> TTSsvc[TTS Service]

    LLM --> Response[Return answer + relevant sections]
    MindSvc --> Diagram[Show mindmap output]
    PodSvc --> AudioOut[Play/download generated audio]
    TTSsvc --> AudioOut

    Search --> Rec[Recommendation Engine\nSuggest related content]
    Rec --> Results[Show recommended docs/sections]

    Response --> UI[Display results in frontend UI]
    Diagram --> UI
    Results --> UI
    AudioOut --> UI
```

### Common User Journey
1. User uploads one or more PDFs.
2. Backend extracts documents, sections, and metadata.
3. Text is embedded for semantic search and similarity matching.
4. User can view PDFs, chat with the document, read insights, generate mindmaps, and create podcasts.
5. The frontend presents results and generated media in a single interactive workspace.

---

## 4. End-to-End Document Intelligence Flow

```mermaid
flowchart LR
    User[User] --> UI[React Frontend]
    UI --> Upload[Upload PDF]
    Upload --> API[FastAPI /api/v1/documents]
    API --> PdfProc[PDF Processor]
    PdfProc --> Extract[Text extraction + section detection]
    Extract --> Embeddings[Vector embeddings]
    Embeddings --> Mongo[(MongoDB)]

    UI --> Query[Search / Ask question]
    Query --> SearchAPI[Semantic Search / Chat API]
    SearchAPI --> Retrieve[Retrieve relevant sections]
    Retrieve --> LLM[Gemini LLM]
    LLM --> Answer[AI answer with citations / section references]
    Answer --> UI

    UI --> Generate[Generate mindmap / podcast / TTS]
    Generate --> Services[Mindmap / Podcast / TTS Services]
    Services --> Audio[(Generated files / audio assets)]
    Services --> UI
```

---

## 5. Repository-Based Architectural Mapping

```mermaid
flowchart TB
    Repo[adobe-hackies-final-v1 repo]
    Repo --> FrontendDir[frontend/]
    Repo --> BackendDir[backend/]

    FrontendDir --> AppFile[frontend/src/App.jsx]
    FrontendDir --> ComponentsDir[frontend/src/components/]
    FrontendDir --> ServicesDir[frontend/src/services/]

    BackendDir --> MainFile[backend/main.py]
    BackendDir --> RouterFile[backend/api/v1/router.py]
    BackendDir --> EndpointsDir[backend/api/v1/endpoints/]
    BackendDir --> ServicesDir2[backend/services/]
    BackendDir --> DBDir[backend/db/]
    BackendDir --> CoreDir[backend/core/]

    ServicesDir2 --> LLM[llm_service.py]
    ServicesDir2 --> PDF[pdf_processor.py]
    ServicesDir2 --> Mind[mindmap_service.py]
    ServicesDir2 --> TTS[tts_service.py]
    ServicesDir2 --> Rec[recommendation_engine.py]
    ServicesDir2 --> Graph[graph_service.py]
    ServicesDir2 --> Pod[enhanced_podcast_service.py]
```

---

## 6. Architecture Summary

- Frontend: React 19 + Vite + Tailwind CSS + Adobe PDF viewer integration
- Backend: FastAPI with modular API router and feature-specific endpoints
- AI stack: Google Gemini, vector search, recommendation logic, document analysis
- Processing stack: PDF parsing, section extraction, mindmap generation, audio synthesis
- Storage: MongoDB for metadata and embeddings; file storage for documents and generated outputs
- External services: Adobe Embed API, Azure Speech, Google Gemini

This architecture reflects the actual implementation of the repository and maps directly to the project structure in `frontend/`, `backend/`, `backend/services/`, and `backend/api/v1/`.
