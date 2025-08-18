# Mindmap Feature Documentation

## Overview
The mindmap feature has been integrated into your Adobe Hackathon document analysis application. It generates visual mindmaps from PDF documents using TF-IDF analysis to extract key phrases and organize content hierarchically.

## Features Added

### Backend Components
1. **Mindmap Service** (`backend/services/mindmap_service.py`)
   - PDF text extraction using `pdfminer.six`
   - Intelligent section detection based on headings
   - TF-IDF-based keyphrase extraction
   - Support for both Mermaid and FreeMind formats

2. **API Endpoints** (`backend/api/v1/endpoints/mindmap.py`)
   - `POST /api/v1/mindmap/generate` - Generate mindmap from uploaded PDF
   - `POST /api/v1/mindmap/generate/{document_id}` - Generate from existing document
   - `POST /api/v1/mindmap/text` - Generate from raw text input
   - `GET /api/v1/mindmap/download/{document_id}` - Download mindmap files

### Frontend Components
1. **MindmapPanel Component** (`frontend/src/components/MindmapPanel.jsx`)
   - Interactive mindmap generation interface
   - Support for multiple input sources (documents, text, file upload)
   - Configurable parameters (max sections, phrases per section)
   - Real-time preview of generated mindmaps
   - Download functionality for both formats

2. **Integration with Main App** (`frontend/src/App.jsx`)
   - New "🧠 Mindmap" tab in the main interface
   - Seamless integration with existing document library
   - Works with selected text and documents

## Usage Instructions

### 1. Generate Mindmap from Existing Document
- Select a document from your library
- Click on the "🧠 Mindmap" tab
- Click "Generate from [document name]" button
- View the generated mindmap in Mermaid or FreeMind format

### 2. Generate Mindmap from Selected Text
- Select text in any PDF viewer
- Navigate to the "🧠 Mindmap" tab
- Click "Generate from Selected Text" button
- The mindmap will be created from the highlighted content

### 3. Upload New PDF for Mindmap
- Go to the "🧠 Mindmap" tab
- Click "Upload PDF & Generate" button
- Select a PDF file from your computer
- The mindmap will be generated automatically

### 4. Customize Generation Settings
- Click the settings (⚙️) icon in the mindmap panel
- Adjust "Max Sections" (5-20) to control detail level
- Adjust "Phrases per Section" (3-10) to control keyphrase density
- Settings apply to all generation methods

### 5. Export Mindmaps
- **Copy to Clipboard**: Click "Copy" to copy mindmap code
- **Download Files**: Click "Download" to save as .mmd (Mermaid) or .mm (FreeMind) files
- **Switch Formats**: Toggle between Mermaid and FreeMind views

## Technical Details

### Supported Formats
1. **Mermaid (.mmd)**: Modern web-based mindmap format, great for documentation
2. **FreeMind (.mm)**: XML-based format compatible with FreeMind software

### Processing Pipeline
1. **Text Extraction**: Uses pdfminer.six for robust PDF text extraction
2. **Section Detection**: Identifies headings using layout analysis and regex patterns
3. **Content Chunking**: Intelligently splits content into manageable sections
4. **Keyphrase Extraction**: TF-IDF analysis to identify most relevant terms
5. **Mindmap Generation**: Hierarchical structure creation in both formats

### API Parameters
- `max_sections`: Maximum number of sections to include (default: 12)
- `phrases_per_section`: Number of key phrases per section (default: 6)
- `format`: Output format for downloads ("mermaid" or "freemind")

## Dependencies Added
- `pdfminer.six>=20221105` - PDF text extraction (added to requirements.txt)

## Integration Points
The mindmap feature integrates seamlessly with existing functionality:
- Uses the same document library and selection system
- Works with the text selection mechanism from PDF viewer
- Follows the same UI/UX patterns as other tabs
- Maintains theme consistency (dark/light mode support)

## Usage Tips
1. **For Best Results**: Use documents with clear section headings
2. **Adjust Settings**: Increase max sections for detailed documents, decrease for summaries
3. **Format Choice**: Use Mermaid for web integration, FreeMind for desktop mindmapping tools
4. **Text Selection**: Select meaningful paragraphs or sections for focused mindmaps

The mindmap feature is now fully integrated and ready to use with your existing document analysis workflow!
