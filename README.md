# AI Nexus – Document Insight Engine

A full-stack project built for the Adobe Hackathon Finale to help users upload, explore, and understand large PDF libraries using semantic search, LLM insights, knowledge visualization, podcasts, TTS, and an interactive Adobe PDF viewer.

- Backend: FastAPI (Python), MongoDB (Motor), embeddings + vector search, Azure TTS
- Frontend: React + Vite, Adobe Document Cloud View SDK, TailwindCSS, React Query

## Features
- Document library with PDF upload and storage
- Semantic search across extracted sections
- “Talk to PDF” chat powered by retrieval-augmented generation (RAG)
- LLM-generated insights from selected text or sections
- Podcast/audio generation from summaries or discussions
- Text-to-speech (Azure) with SSML and multiple voices
- Mindmap generation (Mermaid / FreeMind) from PDFs or selected text
- Recommendations for related content/sections
- Rich PDF viewing via Adobe SDK with selection, navigation, and highlights

## Project Structure
- `backend/`
  - `main.py`: FastAPI entrypoint, CORS, lifespan init, router mounting at `/api`
  - `api/v1/router.py`: Groups v1 API under `/api/v1` and includes sub-routers
  - `api/v1/endpoints/`: Feature endpoints (documents, recommendations, insights, podcast, graph, audio, chat, mindmap, tts)
  - `core/config.py`: Environment settings (MongoDB, LLM, Azure TTS)
  - `services/`: LLM/TTS/recommendation utilities
  - `db/`: MongoDB connection
- `frontend/`
  - `src/App.jsx`: Main app, feature orchestration
  - `src/components/PdfViewer.jsx`: Adobe PDF viewer integration
  - `src/components/MindmapPanel.jsx`: Mindmap UI and logic
  - `index.html`: Loads Adobe View SDK script

## Environment Variables
Create `.env` files in each app (examples below).

Backend (`backend/.env`): see `backend/core/config.py`
- `MONGO_CONNECTION_STRING` (required)
- `MONGO_DATABASE_NAME` (required)
- `LLM_PROVIDER` (default: `gemini`)
- `GEMINI_MODEL` (default: `gemini-2.5-flash`)
- `GOOGLE_API_KEY` (required if using Gemini)
- `TTS_PROVIDER` (default: `azure`)
- `AZURE_TTS_KEY` (required for Azure TTS)
- `AZURE_TTS_REGION` (required for Azure TTS)

Frontend (`frontend/.env`):
- `ADOBE_EMBED_API_KEY` (required for Adobe PDF viewer)

Example templates: `backend/.env.example` and `frontend/.env.example`.

## Local Setup
Prereqs: Recent Python 3.x, Node.js (LTS), MongoDB instance, and required API keys.

1) Backend
- Open a terminal at `backend/`
- Create/activate venv and install deps
  - Windows PowerShell:
    - `python -m venv venv`
    - `venv\Scripts\Activate.ps1`
  - Install: `pip install -r requirements.txt`
- Configure `backend/.env` (see example)
- Run API: `uvicorn main:app --reload --port 8000`
- API base URL: `http://localhost:8000`

2) Frontend
- Open a terminal at `frontend/`
- Install deps: `npm install`
- Configure `frontend/.env` with `ADOBE_EMBED_API_KEY`
- Run dev server: `npm run dev` (default Vite port 5173)
- Frontend URL: `http://localhost:5173`

CORS is preconfigured in `backend/main.py` for `http://localhost:5173` and `http://localhost:8080`.

## API Overview
Base path: `http://localhost:8000/api/v1`
Routers included in `backend/api/v1/router.py`:
- `documents` – upload, list, retrieve, delete, serve original PDFs, and semantic search
- `chat` – RAG-style Q&A over documents/sections
- `insights` – LLM insights for provided text and context
- `podcast` – generate podcast audio and serve files
- `tts` – Azure TTS synthesis and audio serving
- `graph` – knowledge graph for a document cluster
- `mindmap` – generate mindmaps (Mermaid/FreeMind) from PDFs, existing docs, or text
- `recommendations` – related section recommendations
- `audio` – advanced podcast/audio endpoints

For exact request/response schemas, see the corresponding files under `backend/api/v1/endpoints/`.

## Frontend Highlights
- Adobe PDF viewer (`frontend/src/components/PdfViewer.jsx`) with selection/highlight events
- Mindmap UI (`frontend/src/components/MindmapPanel.jsx`) with visual/code view, download, copy
- Main orchestration in `frontend/src/App.jsx` for uploads, library, search, insights, podcast, chat, and mindmaps

## Troubleshooting
- Adobe viewer not rendering:
  - Ensure `<script src="https://documentcloud.adobe.com/view-sdk/main.js"></script>` exists in `frontend/index.html`
  - Verify `ADOBE_EMBED_API_KEY` is set and the container has non-zero size
- CORS issues: confirm frontend URL is allowed in `backend/main.py`
- TTS errors: check `AZURE_TTS_KEY` and `AZURE_TTS_REGION`
- LLM errors: ensure `LLM_PROVIDER`, `GEMINI_MODEL`, and `GOOGLE_API_KEY` (if Gemini) are set

## Scripts & Commands
- Frontend: `npm run dev`
- Backend: run with `uvicorn main:app --reload --port 8000` from `backend/`

## License
Internal hackathon project. Add a license if you plan to open source.
