# AI Nexus Frontend - React Application

Modern React frontend providing an intuitive interface for AI-powered document intelligence with rich PDF viewing, chat interactions, and multimedia generation.

## ✨ Key Features

### 📚 Document Management
- **Drag & Drop Upload**: Intuitive file upload with real-time progress tracking
- **Document Library**: Centralized PDF collection with search and filtering
- **Adobe PDF Viewer**: Rich PDF viewing with text selection, highlights, and annotations
- **File Management**: Upload, view, delete, and organize document collections

### 🤖 AI-Powered Interactions
- **Talk to PDF**: Conversational interface with RAG-powered document Q&A
- **Smart Insights**: Generate AI insights from selected text or document sections
- **Semantic Search**: Vector-based search across entire document collections
- **Content Recommendations**: AI-suggested related sections and documents

### 🎨 Visual Content Generation
- **Interactive Mindmaps**: Create and edit mindmaps from documents in Mermaid format
- **Knowledge Visualization**: Visual representation of document relationships
- **Diagram Rendering**: Real-time Mermaid diagram visualization with editing capabilities
- **Export Options**: Download mindmaps in multiple formats (Mermaid, FreeMind)

### 🎧 Audio & Multimedia
- **Podcast Generation**: Convert documents into engaging AI-generated discussions
- **Text-to-Speech**: Multi-voice TTS with Azure neural voices
- **Audio Controls**: Play, pause, download, and manage generated audio content
- **Voice Selection**: Choose from multiple languages and voice personalities

### 🎯 User Experience
- **Responsive Design**: Mobile-first design that works on all devices
- **Dark/Light Themes**: Toggle between theme modes for comfortable viewing
- **Real-time Updates**: Live feedback for all operations and processing
- **Intuitive Navigation**: Tab-based interface for easy feature access

## 🔧 Tech Stack & Libraries

### Core Framework
- **React 19.1.1**: Latest React with concurrent features and improved performance
- **Vite 7.1.2**: Lightning-fast build tool and development server
- **JavaScript ES6+**: Modern JavaScript with async/await and modules

### UI & Styling
- **TailwindCSS 4.1.12**: Utility-first CSS framework for rapid UI development
- **Lucide React 0.539.0**: Modern, customizable icon library with 1000+ icons
- **Custom CSS**: Component-specific styling for complex interactions

### State Management & Data
- **React Query (TanStack) 5.85.3**: Powerful data fetching and caching library
- **React Hooks**: Built-in state management with useState, useEffect, useContext
- **Local Storage**: Client-side persistence for user preferences

### PDF & Document Handling
- **Adobe Document Cloud View SDK**: Official Adobe PDF viewer with rich features
- **React PDF Viewer 3.12.0**: Alternative PDF viewing with custom controls
- **File API**: Modern browser file handling for uploads and downloads

### Visualization & Graphics
- **Mermaid 10.9.3**: Diagram and flowchart generation from text
- **Custom Canvas**: Interactive diagram editing and manipulation
- **SVG Rendering**: Scalable vector graphics for icons and illustrations

### Notifications & Feedback
- **React Hot Toast 2.6.0**: Elegant toast notifications with animations
- **Loading States**: Custom loading spinners and progress indicators
- **Error Boundaries**: Graceful error handling and user feedback

### Development Tools
- **ESLint 9.33.0**: Code linting and quality enforcement
- **Vite Plugins**: React plugin for optimal development experience
- **TypeScript Support**: Type definitions for better development experience

## 🚀 Development Setup

### Prerequisites
- Node.js 18+ and npm
- Adobe Embed API key
- Backend API running on port 8000

### Installation & Running
```bash
cd frontend
npm install
cp .env.example .env
# Configure your Adobe API key in .env
npm run dev
```

### Environment Configuration
```env
# Required
ADOBE_EMBED_API_KEY=your_adobe_api_key_here

# Optional (defaults to localhost:8000)
VITE_API_BASE_URL=http://localhost:8000
```

### Available Scripts
```bash
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🏗️ Component Architecture

### Core Components
- **`App.jsx`**: Main application with tab navigation and state management
- **`PdfViewer.jsx`**: Adobe PDF SDK integration with text selection events
- **`DragDropUpload.jsx`**: File upload interface with progress tracking
- **`TalkToPdfModal.jsx`**: Chat interface for document Q&A
- **`MindmapPanel.jsx`**: Mindmap generation and visualization
- **`SelectedTextPodcast.jsx`**: Podcast creation from selected content

### UI Components
- **`LoadingSpinner.jsx`**: Loading state indicators
- **`ConfirmationModal.jsx`**: User confirmation dialogs
- **`ThemeToggle.jsx`**: Dark/light theme switching
- **`MermaidRenderer.jsx`**: Mermaid diagram visualization
- **`Snippets.jsx`**: Document section display

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

### Features
- Mobile-first approach
- Touch-friendly interactions
- Adaptive layouts
- Optimized for all screen sizes
