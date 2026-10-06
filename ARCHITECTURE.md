# Architecture & User Flows — AI Nexus

This document contains high-level and low-level architecture diagrams and user flows for the AI Nexus project (adobe-hackies-final-v1). Each diagram is provided as an importable draw.io (diagrams.net) XML blob so you can import and edit them directly in diagrams.net.

## What this is
AI Nexus is an AI-powered document intelligence platform that converts PDF libraries into an interactive knowledge workspace — users upload PDFs, run semantic search, chat with documents (RAG), generate mindmaps and podcasts, and create TTS audio.

### Stack
- **Languages:** Python (FastAPI backend), JavaScript (React + Vite frontend)
- **Key libraries/services:** Google Gemini (LLM), sentence-transformers (embeddings), Motor (async MongoDB), Azure Cognitive Services (TTS), PDFMiner / PyMuPDF

## Project layout (top-level)
```
adobe-hackies-final-v1/
├── backend/                    # FastAPI Python backend
│   ├── api/v1/                 # API router & endpoints (documents, chat, tts, mindmap, audio, etc.)
│   ├── services/               # Business logic: pdf_processor, llm_service, tts_service, mindmap_service, podcast services
│   ├── core/                   # config, settings
│   └── db/                     # database connection (Motor)
├── frontend/                   # React + Vite frontend (Adobe Embed SDK)
├── docker-compose.yml          # multi-service compose
├── Dockerfile                  # multi-stage build
```

---

# Diagrams (draw.io XML)

Below are three diagrams as draw.io XML. To open: go to diagrams.net (draw.io) → File → Import From → Device and paste the XML content below, or save each XML into a .drawio or .xml file and import.

## 1) High-level architecture
```xml name=diagrams/high_level.drawio.xml
<mxfile host="app.diagrams.net">
  <diagram name="High-Level Architecture">
    <mxGraphModel dx="1073" dy="663" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <!-- User -->
        <mxCell id="u" value="User (Browser)" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000" vertex="1" parent="1">
          <mxGeometry x="50" y="70" width="120" height="40" as="geometry"/>
        </mxCell>

        <!-- Frontend -->
        <mxCell id="fe" value="Frontend\nReact + Vite\n(Adobe Embed SDK)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E6F4FF;strokeColor=#1976D2" vertex="1" parent="1">
          <mxGeometry x="220" y="40" width="220" height="80" as="geometry"/>
        </mxCell>

        <!-- Backend -->
        <mxCell id="be" value="Backend\nFastAPI (api/v1)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E8F5E9;strokeColor=#2E7D32" vertex="1" parent="1">
          <mxGeometry x="520" y="30" width="260" height="120" as="geometry"/>
        </mxCell>

        <!-- Services cluster -->
        <mxCell id="services" value="Services (pdf_processor, llm_service,\nmindmap_service, tts_service,\nrecommendation_engine, podcast)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF3E0;strokeColor=#FB8C00" vertex="1" parent="1">
          <mxGeometry x="520" y="160" width="260" height="180" as="geometry"/>
        </mxCell>

        <!-- DB -->
        <mxCell id="db" value="MongoDB\n(documents, audio_files, sessions)" style="cylinder;whiteSpace=wrap;html=1;fillColor=#F3E5F5;strokeColor=#8E24AA" vertex="1" parent="1">
          <mxGeometry x="820" y="80" width="160" height="100" as="geometry"/>
        </mxCell>

        <!-- Storage -->
        <mxCell id="store" value="File Storage\n(audio files, uploads)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ECEFF1;strokeColor=#546E7A" vertex="1" parent="1">
          <mxGeometry x="820" y="200" width="160" height="60" as="geometry"/>
        </mxCell>

        <!-- External APIs -->
        <mxCell id="ext" value="External Services\n- Google Gemini (LLM)\n- Azure TTS\n- Adobe Embed API" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFDE7;strokeColor=#FBC02D" vertex="1" parent="1">
          <mxGeometry x="220" y="260" width="300" height="120" as="geometry"/>
        </mxCell>

        <!-- Docker Compose -->
        <mxCell id="docker" value="Docker Compose\n(frontend, backend, mongo)" style="shape=folder;whiteSpace=wrap;html=1;fillColor=#F1F8E9;strokeColor=#7CB342" vertex="1" parent="1">
          <mxGeometry x="50" y="260" width="140" height="80" as="geometry"/>
        </mxCell>

        <!-- Edges -->
        <mxCell id="e1" edge="1" parent="1" source="u" target="fe">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e2" edge="1" parent="1" source="fe" target="be">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e3" edge="1" parent="1" source="be" target="services">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e4" edge="1" parent="1" source="services" target="db">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e5" edge="1" parent="1" source="services" target="store">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e6" edge="1" parent="1" source="services" target="ext">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e7" edge="1" parent="1" source="docker" target="fe">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e8" edge="1" parent="1" source="docker" target="be">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

Notes: high-level layout showing user → frontend → backend → services → MongoDB/file storage and external AI providers.

## 2) Low-level architecture
```xml name=diagrams/low_level.drawio.xml
<mxfile host="app.diagrams.net">
  <diagram name="Low-Level Architecture">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1200" pageHeight="800">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <!-- Frontend -->
        <mxCell id="fe" value="Frontend\nReact (App.jsx)\n- PdfViewer\n- DragDropUpload\n- TalkToPdfModal" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E6F4FF;strokeColor=#1976D2" vertex="1" parent="1">
          <mxGeometry x="40" y="40" width="260" height="160" as="geometry"/>
        </mxCell>

        <!-- API Router -->
        <mxCell id="router" value="API Router\n/api/v1/router.py" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF3E0;strokeColor=#FB8C00" vertex="1" parent="1">
          <mxGeometry x="360" y="80" width="220" height="80" as="geometry"/>
        </mxCell>

        <!-- Endpoint group -->
        <mxCell id="endpoints" value="Endpoints\n- documents.py\n- chat.py\n- tts.py\n- mindmap.py\n- audio.py\n- podcast.py" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFDE7;strokeColor=#FBC02D" vertex="1" parent="1">
          <mxGeometry x="360" y="180" width="220" height="240" as="geometry"/>
        </mxCell>

        <!-- Services -->
        <mxCell id="svc_cluster" value="Services\n- pdf_processor.py\n- llm_service.py\n- tts_service.py\n- mindmap_service.py\n- recommendation_engine.py\n- selected_text_podcast_service.py" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E8F5E9;strokeColor=#2E7D32" vertex="1" parent="1">
          <mxGeometry x="620" y="80" width="340" height="340" as="geometry"/>
        </mxCell>

        <!-- PDF Processor -->
        <mxCell id="pdfp" value="pdf_processor.py\n- PDFMiner/PyMuPDF\n- Section detection\n- Clean text" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#9E9E9E" vertex="1" parent="svc_cluster">
          <mxGeometry x="20" y="20" width="280" height="60" as="geometry"/>
        </mxCell>

        <!-- Embeddings -->
        <mxCell id="embed" value="Embeddings\n- sentence-transformers\n- 384-d vectors" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF3E0;strokeColor=#FB8C00" vertex="1" parent="svc_cluster">
          <mxGeometry x="20" y="90" width="280" height="50" as="geometry"/>
        </mxCell>

        <!-- LLM -->
        <mxCell id="llm" value="llm_service.py\n- Gemini calls\n- Prompt & RAG orchestration" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E3F2FD;strokeColor=#1976D2" vertex="1" parent="svc_cluster">
          <mxGeometry x="20" y="150" width="280" height="60" as="geometry"/>
        </mxCell>

        <!-- TTS -->
        <mxCell id="tts" value="tts_service.py\n- Azure TTS calls\n- SSML\n- PyDub processing" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF3E0;strokeColor=#F57C00" vertex="1" parent="svc_cluster">
          <mxGeometry x="20" y="220" width="280" height="60" as="geometry"/>
        </mxCell>

        <!-- DB -->
        <mxCell id="db" value="MongoDB\n- documents collection\n- audio_files\n- sessions\nIndexes: embeddings, TTL" style="cylinder;whiteSpace=wrap;html=1;fillColor=#F3E5F5;strokeColor=#8E24AA" vertex="1" parent="1">
          <mxGeometry x="980" y="80" width="240" height="160" as="geometry"/>
        </mxCell>

        <!-- File Storage -->
        <mxCell id="file" value="File Storage\n/static/uploads & /audio" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ECEFF1;strokeColor=#546E7A" vertex="1" parent="1">
          <mxGeometry x="980" y="260" width="240" height="80" as="geometry"/>
        </mxCell>

        <!-- External LLM -->
        <mxCell id="gemini" value="Google Gemini (LLM)\n(google-generativeai)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFDE7;strokeColor=#FBC02D" vertex="1" parent="1">
          <mxGeometry x="360" y="460" width="220" height="70" as="geometry"/>
        </mxCell>

        <!-- External Azure--> 
        <mxCell id="azure" value="Azure Cognitive Services (TTS)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E8EAF6;strokeColor=#3949AB" vertex="1" parent="1">
          <mxGeometry x="620" y="460" width="220" height="70" as="geometry"/>
        </mxCell>

        <!-- Edges -->
        <mxCell id="e1" edge="1" parent="1" source="fe" target="router">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e2" edge="1" parent="1" source="router" target="endpoints">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e3" edge="1" parent="1" source="endpoints" target="svc_cluster">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e4" edge="1" parent="1" source="svc_cluster" target="db">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e5" edge="1" parent="1" source="svc_cluster" target="file">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e6" edge="1" parent="1" source="svc_cluster" target="gemini">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="e7" edge="1" parent="1" source="svc_cluster" target="azure">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <!-- small notes -->
        <mxCell id="note1" value="Vector Search: query embedding -> cosine similarity on stored section embeddings" style="text;html=1;align=left;verticalAlign=top;fontSize=11" vertex="1" parent="1">
          <mxGeometry x="360" y="360" width="600" height="60" as="geometry"/>
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

Notes: shows modules and where to focus for scaling and reliability (embedding store, prompt construction, audio generation backgrounding).

## 3) User flow (Upload → Index, Chat → TTS)
```xml name=diagrams/user_flow.drawio.xml
<mxfile host="app.diagrams.net">
  <diagram name="User Flow">
    <mxGraphModel dx="1100" dy="700" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="700">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <!-- Swimlanes -->
        <mxCell id="lane_user" value="User" style="swimlane;whiteSpace=wrap;html=1;fillColor=#FFFFFF" vertex="1" parent="1">
          <mxGeometry x="10" y="10" width="1080" height="100" as="geometry"/>
        </mxCell>

        <mxCell id="lane_frontend" value="Frontend" style="swimlane;whiteSpace=wrap;html=1;fillColor=#E6F4FF" vertex="1" parent="1">
          <mxGeometry x="10" y="110" width="1080" height="160" as="geometry"/>
        </mxCell>

        <mxCell id="lane_backend" value="Backend (API + Services)" style="swimlane;whiteSpace=wrap;html=1;fillColor=#E8F5E9" vertex="1" parent="1">
          <mxGeometry x="10" y="270" width="1080" height="260" as="geometry"/>
        </mxCell>

        <mxCell id="lane_ext" value="External / Storage" style="swimlane;whiteSpace=wrap;html=1;fillColor=#FFFDE7" vertex="1" parent="1">
          <mxGeometry x="10" y="530" width="1080" height="140" as="geometry"/>
        </mxCell>

        <!-- Steps (Upload & Index) -->
        <mxCell id="s1" value="1. User uploads PDF (drag & drop)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000" vertex="1" parent="lane_frontend">
          <mxGeometry x="40" y="130" width="220" height="40" as="geometry"/>
        </mxCell>

        <mxCell id="s2" value="2. Frontend POST /api/v1/documents/upload_cluster" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#BBDEFB;strokeColor=#1976D2" vertex="1" parent="lane_frontend">
          <mxGeometry x="300" y="130" width="300" height="40" as="geometry"/>
        </mxCell>

        <mxCell id="s3" value="3. Backend -> pdf_processor: extract text, detect sections" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#C8E6C9;strokeColor=#2E7D32" vertex="1" parent="lane_backend">
          <mxGeometry x="40" y="300" width="380" height="50" as="geometry"/>
        </mxCell>

        <mxCell id="s4" value="4. embeddings = sentence-transformers.encode(sections)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF3E0;strokeColor=#FB8C00" vertex="1" parent="lane_backend">
          <mxGeometry x="460" y="300" width="300" height="50" as="geometry"/>
        </mxCell>

        <mxCell id="s5" value="5. Store document + sections + embeddings in MongoDB" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F3E5F5;strokeColor=#8E24AA" vertex="1" parent="lane_ext">
          <mxGeometry x="800" y="300" width="240" height="50" as="geometry"/>
        </mxCell>

        <!-- Steps (Chat & TTS) -->
        <mxCell id="c1" value="A. User asks a question (Talk to PDF)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000" vertex="1" parent="lane_frontend">
          <mxGeometry x="40" y="190" width="220" height="40" as="geometry"/>
        </mxCell>

        <mxCell id="c2" value="B. Frontend POST /api/v1/chat {message, document_ids}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#BBDEFB;strokeColor=#1976D2" vertex="1" parent="lane_frontend">
          <mxGeometry x="300" y="190" width="300" height="40" as="geometry"/>
        </mxCell>

        <mxCell id="c3" value="C. Backend: vector_search -> select top N sections" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#C8E6C9;strokeColor=#2E7D32" vertex="1" parent="lane_backend">
          <mxGeometry x="40" y="370" width="380" height="50" as="geometry"/>
        </mxCell>

        <mxCell id="c4" value="D. Build prompt (context + question) & call Gemini" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E3F2FD;strokeColor=#1976D2" vertex="1" parent="lane_backend">
          <mxGeometry x="460" y="370" width="300" height="50" as="geometry"/>
        </mxCell>

        <mxCell id="c5" value="E. Gemini returns answer -> backend returns to frontend" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000" vertex="1" parent="lane_backend">
          <mxGeometry x="800" y="370" width="240" height="50" as="geometry"/>
        </mxCell>

        <mxCell id="t1" value="F. (Optional) User selects 'Generate Audio' -> POST /api/v1/tts/synthesize" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFF0;strokeColor=#000000" vertex="1" parent="lane_frontend">
          <mxGeometry x="40" y="250" width="400" height="40" as="geometry"/>
        </mxCell>

        <mxCell id="t2" value="G. tts_service: call Azure TTS, get audio segments" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF3E0;strokeColor=#F57C00" vertex="1" parent="lane_backend">
          <mxGeometry x="460" y="440" width="300" height="40" as="geometry"/>
        </mxCell>

        <mxCell id="t3" value="H. PyDub merges segments -> file saved -> metadata stored in MongoDB" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F3E5F5;strokeColor=#8E24AA" vertex="1" parent="lane_ext">
          <mxGeometry x="800" y="440" width="240" height="50" as="geometry"/>
        </mxCell>

        <!-- Edges (visual only) -->
        <mxCell id="e1" edge="1" parent="1" source="s1" target="s2"><mxGeometry relative="1" as="geometry"/></mxCell>
        <mxCell id="e2" edge="1" parent="1" source="s2" target="s3"><mxGeometry relative="1" as="geometry"/></mxCell>
        <mxCell id="e3" edge="1" parent="1" source="s3" target="s4"><mxGeometry relative="1" as="geometry"/></mxCell>
        <mxCell id="e4" edge="1" parent="1" source="s4" target="s5"><mxGeometry relative="1" as="geometry"/></mxCell>

        <mxCell id="e5" edge="1" parent="1" source="c1" target="c2"><mxGeometry relative="1" as="geometry"/></mxCell>
        <mxCell id="e6" edge="1" parent="1" source="c2" target="c3"><mxGeometry relative="1" as="geometry"/></mxCell>
        <mxCell id="e7" edge="1" parent="1" source="c3" target="c4"><mxGeometry relative="1" as="geometry"/></mxCell>
        <mxCell id="e8" edge="1" parent="1" source="c4" target="c5"><mxGeometry relative="1" as="geometry"/></mxCell>

        <mxCell id="e9" edge="1" parent="1" source="t1" target="t2"><mxGeometry relative="1" as="geometry"/></mxCell>
        <mxCell id="e10" edge="1" parent="1" source="t2" target="t3"><mxGeometry relative="1" as="geometry"/></mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

Notes: sequence-style swimlane flow for main user journeys.

---

## Implementation notes & recommendations
- Consider moving embeddings to a dedicated vector DB (e.g., Milvus, Pinecone, or open-source alternatives) for large-scale vector search instead of storing raw vectors in MongoDB.
- Run audio generation in background workers to avoid blocking FastAPI workers (Celery, RQ, or FastAPI background tasks + task queue).
- Add monitoring/metrics around LLM call latencies and audio processing durations; ensure disk cleanup matches the TTL index.

---

*File created and committed to the repository by an automated assistant.*
