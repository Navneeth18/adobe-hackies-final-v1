import { useState, useEffect } from "react";
import { apiService } from "./services/api.js";
import PdfViewer from "./components/PdfViewer";
import Snippets from "./components/Snippets";
import InsightPanel from "./components/InsightPanel";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./context/ThemeContext";
import toast, { Toaster } from "react-hot-toast";

function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedText, setSelectedText] = useState("");
  const [clusterId, setClusterId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [activeTab, setActiveTab] = useState('snippets');
  
  // New state for uploaded documents
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]); // Changed to array for multi-select
  const [activeDocumentTab, setActiveDocumentTab] = useState(null); // Track active tab
  const [documentSections, setDocumentSections] = useState([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [documentFiles, setDocumentFiles] = useState({}); // Store loaded PDF files by document ID
  
  // Snippets and semantic search state
  const [snippets, setSnippets] = useState([]);
  const [isSearchingSnippets, setIsSearchingSnippets] = useState(false);
  const [contradictions, setContradictions] = useState([]);
  const [alternateViewpoints, setAlternateViewpoints] = useState([]);
  
  // LLM-generated insights state
  const [llmInsights, setLlmInsights] = useState(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  
  // Podcast state
  const [podcastAudioId, setPodcastAudioId] = useState(null);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [podcastAudioUrl, setPodcastAudioUrl] = useState(null);

  // Multilingual podcast state
  const [supportedLanguages, setSupportedLanguages] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isGeneratingMultilingualPodcast, setIsGeneratingMultilingualPodcast] = useState(false);
  const [multilingualPodcastUrl, setMultilingualPodcastUrl] = useState(null);
  const [multilingualPodcastId, setMultilingualPodcastId] = useState(null);

  // Fetch uploaded documents and supported languages on component mount
  useEffect(() => {
    fetchUploadedDocuments();
    fetchSupportedLanguages();
  }, []);

  // Fetch supported languages for multilingual podcasts
  const fetchSupportedLanguages = async () => {
    try {
      const result = await apiService.getSupportedLanguages();
      if (result.success) {
        setSupportedLanguages(result.languages);
      }
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
    }
  };

  // Fetch uploaded documents from backend
  const fetchUploadedDocuments = async () => {
    setIsLoadingDocuments(true);
    setDocumentError(null);
    
    try {
      const response = await apiService.getDocuments();
      setUploadedDocuments(response.documents || []);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setDocumentError(error.message);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Handle document selection from library (multi-select)
  const handleDocumentSelect = async (document, isCtrlClick = false) => {
    if (isCtrlClick) {
      // Multi-select mode
      const isAlreadySelected = selectedDocuments.some(doc => doc._id === document._id);
      if (isAlreadySelected) {
        // Remove from selection
        const newSelection = selectedDocuments.filter(doc => doc._id !== document._id);
        setSelectedDocuments(newSelection);
        if (activeDocumentTab === document._id) {
          setActiveDocumentTab(newSelection.length > 0 ? newSelection[0]._id : null);
        }
      } else {
        // Add to selection
        const newSelection = [...selectedDocuments, document];
        setSelectedDocuments(newSelection);
        setActiveDocumentTab(document._id);
      }
    } else {
      // Single select mode - replace selection
      setSelectedDocuments([document]);
      setActiveDocumentTab(document._id);
    }
    
    // Load the document that was clicked
    await loadDocumentContent(document);
  };

  // Load document content (separated for reuse)
  const loadDocumentContent = async (document) => {
    // Check if we already have this document loaded
    if (documentFiles[document._id]) {
      setSelectedFile(documentFiles[document._id]);
      // Skip sections fetch since endpoint doesn't exist
      // if (documentSections.length === 0) {
      //   const response = await apiService.getDocumentSections(document._id);
      //   setDocumentSections(response.sections || []);
      // }
      return;
    }
    
    setIsLoadingSections(true);
    
    try {
      // Fetch PDF directly instead of sections
      toast.loading("Fetching PDF...");
      const pdfBlob = await apiService.getDocumentPdf(document._id);
      
      // Create a file object from the blob to display in the PDF viewer
      const file = new File([pdfBlob], `${document.filename}`, { type: 'application/pdf' });
      
      // Store the file in our document files cache
      setDocumentFiles(prev => ({
        ...prev,
        [document._id]: file
      }));
      
      setSelectedFile(file);
      
      toast.dismiss();
      toast.success("PDF loaded in viewer");
      
      // Skip sections fetch since endpoint doesn't exist
      // const response = await apiService.getDocumentSections(document._id);
      // setDocumentSections(response.sections || []);
      setDocumentSections([]); // Set empty sections
    } catch (error) {
      console.error("Failed to fetch PDF or sections:", error);
      setDocumentSections([]);
      toast.dismiss();
      toast.error(`Failed to load document: ${error.message}`);
    } finally {
      setIsLoadingSections(false);
    }
  };
  
  // Handle viewing original PDF
  const handleViewOriginalPdf = async (documentId) => {
    try {
      toast.loading("Fetching PDF...");
      const pdfBlob = await apiService.getDocumentPdf(documentId);
      
      // Create a URL for the blob
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Create a file object from the blob to display in the PDF viewer
      const file = new File([pdfBlob], `${documentId}.pdf`, { type: 'application/pdf' });
      setSelectedFile(file);
      
      toast.dismiss();
      toast.success("PDF loaded in viewer");
    } catch (error) {
      console.error("Failed to fetch PDF:", error);
      toast.dismiss();
      toast.error(`Failed to load PDF: ${error.message}`);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (document, event) => {
    event.stopPropagation(); // Prevent document selection
    
    if (!confirm(`Are you sure you want to delete "${document.filename}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      toast.loading("Deleting document...");
      await apiService.deleteDocument(document._id);
      
      // Remove from selected documents if it was selected
      const newSelection = selectedDocuments.filter(doc => doc._id !== document._id);
      setSelectedDocuments(newSelection);
      
      // Remove from document files cache
      setDocumentFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[document._id];
        return newFiles;
      });
      
      // Update active tab if the deleted document was active
      if (activeDocumentTab === document._id) {
        setActiveDocumentTab(newSelection.length > 0 ? newSelection[0]._id : null);
        if (newSelection.length > 0) {
          loadDocumentContent(newSelection[0]);
        }
      }
      
      // Refresh document library
      await fetchUploadedDocuments();
      
      toast.dismiss();
      toast.success(`"${document.filename}" deleted successfully`);
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.dismiss();
      toast.error(`Failed to delete document: ${error.message}`);
    }
  };

  // Handle tab switching
  const handleTabSwitch = async (document) => {
    setActiveDocumentTab(document._id);
    await loadDocumentContent(document);
  };

  // Handle tab close
  const handleTabClose = (document, event) => {
    event.stopPropagation();
    const newSelection = selectedDocuments.filter(doc => doc._id !== document._id);
    setSelectedDocuments(newSelection);
    
    // Remove from document files cache
    setDocumentFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[document._id];
      return newFiles;
    });
    
    if (activeDocumentTab === document._id) {
      setActiveDocumentTab(newSelection.length > 0 ? newSelection[0]._id : null);
      if (newSelection.length > 0) {
        loadDocumentContent(newSelection[0]);
      } else {
        setSelectedFile(null);
        setDocumentSections([]);
      }
    }
  };

  // Handle text selection from PDF viewer - automatically triggers semantic search
  const handleTextSelection = async (text) => {
    if (!text || text.trim().length < 3) {
      return;
    }

    // Immediately update sidebar with selected text
    setSelectedText(text);
    setIsSearchingSnippets(true);
    setSnippets([]);
    setContradictions([]);
    setAlternateViewpoints([]);
    setLlmInsights(null);
    setPodcastAudioId(null);
    setPodcastAudioUrl(null);

    // Start semantic search in background
    try {
      const searchResults = await apiService.semanticSearch(text);
      setSnippets(searchResults.snippets || []);
      setContradictions(searchResults.contradictions || []);
      setAlternateViewpoints(searchResults.alternate_viewpoints || []);
      
      if (searchResults.snippets && searchResults.snippets.length > 0) {
        generateLLMInsights(text);
      }
    } catch (error) {
      // Silently handle errors - text is still displayed in sidebar
      setSnippets([]);
      setContradictions([]);
      setAlternateViewpoints([]);
      setLlmInsights(null);
    } finally {
      setIsSearchingSnippets(false);
    }
  };

  // Generate LLM insights from selected text with related snippets
  const generateLLMInsights = async (text) => {
    if (!text || text.trim().length < 20) {
      return;
    }

    setIsGeneratingInsights(true);
    
    try {
      // Pass related snippets to provide context for better insights
      const insights = await apiService.getInsights(text, snippets);
      setLlmInsights(insights);
    } catch (error) {
      console.error("Failed to generate insights:", error);
      toast.error(`Failed to generate insights: ${error.message}`);
      setLlmInsights(null);
    } finally {
      setIsGeneratingInsights(false);
    }
  };
  
  // Handle podcast generation with enhanced insights
  const handleGeneratePodcast = async () => {
    if (!selectedText || snippets.length === 0) {
      toast.error("Please select text and wait for semantic search to complete");
      return;
    }
    
    setIsGeneratingPodcast(true);
    setPodcastAudioUrl(null);
    
    try {
      toast.loading("Generating podcast audio with insights...");
      const result = await apiService.generatePodcast(
        selectedText,
        snippets,
        llmInsights || {} // Use enhanced LLM insights instead of old contradictions/viewpoints
      );
      
      if (result.success && result.audio_id) {
        setPodcastAudioId(result.audio_id);
        
        // Set the audio URL to the serving endpoint
        setPodcastAudioUrl(`http://localhost:8000/api/v1/audio/serve/${result.audio_id}`);
        toast.dismiss();
        toast.success("Podcast generated successfully with enhanced insights!");
      } else {
        throw new Error(result.error || "Failed to generate podcast");
      }
    } catch (error) {
      console.error("Failed to generate podcast:", error);
      toast.dismiss();
      toast.error(`Failed to generate podcast: ${error.message}`);
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  // Handle multilingual podcast generation from PDF
  const handleGenerateMultilingualPodcast = async (documentId) => {
    if (!documentId) {
      toast.error("Please select a document first");
      return;
    }

    setIsGeneratingMultilingualPodcast(true);
    setMultilingualPodcastUrl(null);

    try {
      const languageName = supportedLanguages[selectedLanguage] || selectedLanguage;
      toast.loading(`Generating podcast in ${languageName}...`);

      const result = await apiService.generateMultilingualPodcast(
        documentId,
        selectedLanguage,
        true // Always summarize for better podcast experience
      );

      if (result.success && result.audio_id) {
        setMultilingualPodcastId(result.audio_id);

        // Set the audio URL to the multilingual serving endpoint
        setMultilingualPodcastUrl(`http://localhost:8000/api/v1/audio/serve-multilingual/${result.audio_id}`);
        toast.dismiss();
        toast.success(`Podcast generated successfully in ${result.language_name}!`);
      } else {
        throw new Error(result.error || "Failed to generate multilingual podcast");
      }
    } catch (error) {
      console.error("Failed to generate multilingual podcast:", error);
      toast.dismiss();
      toast.error(`Failed to generate podcast: ${error.message}`);
    } finally {
      setIsGeneratingMultilingualPodcast(false);
    }
  };

  // Handle snippet click to navigate to specific section
  const handleSnippetClick = async (snippet) => {
    try {
      // Find the document that contains this snippet
      const document = uploadedDocuments.find(doc => doc._id === snippet.document_id);
      if (!document) {
        toast.error("Document not found");
        return;
      }

      // Load the document and navigate to the specific section
      await handleDocumentSelect(document);
      
      // TODO: Implement goToLocation to navigate to specific page/section
      toast.success(`Navigated to ${document.filename} - ${snippet.section_title}`);
    } catch (error) {
      console.error("Failed to navigate to snippet:", error);
      toast.error("Failed to navigate to snippet");
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    setFiles((prev) => [...prev, ...uploadedFiles]);

    // Auto-select first file if none selected
    if (!selectedFile && uploadedFiles.length > 0) {
      setSelectedFile(uploadedFiles[0]);
    }
  };

  // Upload cluster to backend
  const handleUploadCluster = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await apiService.uploadCluster(files);
      console.log("Upload successful:", result);

      setClusterId(result.cluster_id);
      toast.success(
        `Successfully uploaded ${result.processed_files_count} files! Cluster ID: ${result.cluster_id}`
      );

      // ✅ Reset back to initial stage after successful upload
      setFiles([]);
      setSelectedFile(null);
      setSelectedText("");
      
      // Refresh the document library to show the newly uploaded documents
      await fetchUploadedDocuments();
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError(error.message);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };


  // Remove file
  const handleRemoveFile = (fileToRemove) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));

    if (selectedFile === fileToRemove) {
      const remaining = files.filter((f) => f !== fileToRemove);
      setSelectedFile(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const { isDarkMode } = useTheme();
  
  return (
    <div className={`flex flex-col h-screen bg-[var(--bg)]`}>
      {/* Notification */}
      <Toaster />
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg)]">
        <h1 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
          <span className="bg-red-600 text-white p-2 rounded">📑</span>
          Document Insight Engine
        </h1>
        <div className="flex gap-4 items-center">
          <button className="bg-yellow-500 text-white px-3 py-1 rounded">
            Adobe India Hackathon
          </button>
          {clusterId && (
            <span className="text-[var(--text-secondary)]">Cluster: {clusterId}</span>
          )}
          <ThemeToggle />
          <button>⚙️</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-72 border-r border-[var(--border-color)] bg-[var(--sidebar-bg)] p-4 overflow-y-auto">
          <h2 className="font-semibold mb-2 text-[var(--text-primary)]">Upload Documents</h2>

          {/* File Input */}
          <div className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-6 text-center mb-4 bg-[var(--card-bg)]">
            <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleFileUpload}
                className="block w-full text-sm text-[var(--text-primary)] cursor-pointer"
              />
              <p className="text-[var(--text-secondary)] text-xs mt-2">
              Upload multiple PDFs to analyze connections
            </p>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUploadCluster}
            disabled={isUploading || files.length === 0}
            className={`w-full p-3 rounded-lg mb-4 font-medium ${
              isUploading || files.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isUploading
              ? "Uploading..."
              : `Upload Cluster (${files.length} files)`}
          </button>

          {uploadError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {uploadError}
            </div>
          )}

          {/* Document Library */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-[var(--text-primary)]">Document Library</h2>
            <button
              onClick={fetchUploadedDocuments}
              disabled={isLoadingDocuments}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              {isLoadingDocuments ? "🔄" : "🔄"}
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full p-2 border border-[var(--border-color)] rounded mb-4 bg-[var(--card-bg)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
          />
          
          {isLoadingDocuments ? (
            <p className="text-sm text-[var(--text-secondary)] mb-4">Loading documents...</p>
          ) : documentError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-xs">
              {documentError}
            </div>
          ) : uploadedDocuments.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] mb-4">No documents uploaded</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {uploadedDocuments.map((document, index) => {
                const isSelected = selectedDocuments.some(doc => doc._id === document._id);
                return (
                  <li
                    key={document._id || index}
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer ${
                      isSelected
                        ? "bg-[var(--highlight)] bg-opacity-10 border-[var(--highlight)]"
                        : "bg-[var(--card-bg)] hover:bg-opacity-80"
                    }`}
                    onClick={(e) => handleDocumentSelect(document, e.ctrlKey || e.metaKey)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--text-primary)] truncate">
                        {document.filename}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        Cluster: {document.cluster_id?.slice(0, 8)}...
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-[var(--text-secondary)]">
                        {document.total_sections} sections
                      </div>
                      <button
                        onClick={(e) => handleDeleteDocument(document, e)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded p-1 transition-colors"
                        title={`Delete ${document.filename}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Sidebar Buttons */}
          <button className="w-full p-2 bg-white rounded border text-left mb-2">
            ⚡ Generate Insights
          </button>
          <button className="w-full p-2 bg-white rounded border text-left mb-2">
            🎙️ Podcast Mode
          </button>
          <button className="w-full p-2 bg-white rounded border text-left">
            🔍 Concept Explorer
          </button>
        </div>

        {/* Center PDF Viewer with Tabs */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Document Tabs */}
          {selectedDocuments.length > 0 && (
            <div className="flex border-b bg-gray-100 overflow-x-auto">
              {selectedDocuments.map((document) => (
                <div
                  key={document._id}
                  className={`px-4 py-2 flex items-center gap-2 cursor-pointer border-r whitespace-nowrap ${
                    activeDocumentTab === document._id
                      ? "bg-white border-b-2 border-red-600 font-medium"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() => handleTabSwitch(document)}
                >
                  <span className="truncate max-w-[150px]" title={document.filename}>
                    {document.filename}
                  </span>
                  <button
                    className="text-red-500 hover:text-red-700 ml-1"
                    onClick={(e) => handleTabClose(document, e)}
                    title="Close tab"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* File Upload Tabs (for uploaded files) */}
          {files.length > 0 && (
            <div className="flex border-b bg-gray-100">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={`px-4 py-2 flex items-center gap-2 cursor-pointer border-r ${
                    selectedFile === file
                      ? "bg-white border-b-2 border-red-600 font-medium"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(file);
                    }}
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* PDF Area */}
          <div className="flex-1 overflow-auto">
            {selectedFile ? (
              <PdfViewer 
                file={selectedFile} 
                onTextSelection={handleTextSelection}
              />
            ) : selectedDocuments.length > 0 && activeDocumentTab ? (
              <div className="p-6">
                {(() => {
                  const activeDocument = selectedDocuments.find(doc => doc._id === activeDocumentTab);
                  return activeDocument ? (
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold mb-2">{activeDocument.filename}</h2>
                      <p className="text-sm text-gray-600">Document from cluster: {activeDocument.cluster_id}</p>
                    </div>
                  ) : null;
                })()}
                
                {isLoadingSections ? (
                  <div className="text-center py-8">
                    <div className="text-2xl mb-2">🔄</div>
                    <p>Loading document sections...</p>
                  </div>
                ) : documentSections.length > 0 ? (
                  <div className="space-y-4">
                    {documentSections.map((section, index) => (
                      <div key={section._id || index} className="bg-white border rounded-lg p-4 shadow-sm">
                        <h3 className="font-medium text-lg mb-2 text-gray-800">
                          {section.title || `Section ${index + 1}`}
                        </h3>
                        <div className="text-gray-700 leading-relaxed">
                          {section.content}
                        </div>
                        {section.page_number && (
                          <div className="text-xs text-gray-500 mt-2">
                            Page: {section.page_number}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-2xl mb-2">📄</div>
                    <p>No sections found for this document</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-600 flex flex-col items-center justify-center h-full">
                <div className="text-5xl mb-4">📄</div>
                <h2 className="text-lg font-semibold">PDF Preview</h2>
                <p className="text-sm text-gray-500">
                  Upload and select a document to view
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Connecting the Dots</h2>

          {/* Selected Documents Info */}
          {selectedDocuments.length > 0 && (
            <div className="bg-white rounded p-4 shadow mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">📄 Selected Documents ({selectedDocuments.length})</h3>
                <button
                  onClick={() => {
                    setSelectedDocuments([]);
                    setActiveDocumentTab(null);
                    setDocumentSections([]);
                    setSelectedFile(null);
                    setDocumentFiles({});
                  }}
                  className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                >
                  Clear All
                </button>
              </div>
              <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
                {selectedDocuments.map((doc, index) => (
                  <div key={doc._id} className={`mb-2 p-2 rounded ${activeDocumentTab === doc._id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                    <p><strong>{doc.filename}</strong></p>
                    <p className="text-xs text-gray-500">Sections: {doc.total_sections} | ID: {doc._id.slice(0, 8)}...</p>
                  </div>
                ))}
              </div>
              {activeDocumentTab && (() => {
                const activeDoc = selectedDocuments.find(doc => doc._id === activeDocumentTab);
                return activeDoc ? (
                  <button
                    onClick={() => handleViewOriginalPdf(activeDoc._id)}
                    className="mt-3 w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
                  >
                    <span className="mr-2">📄</span> View Active PDF
                  </button>
                ) : null;
              })()}
            </div>
          )}

          {/* Selected Text */}
          <div className="bg-white rounded p-4 shadow mb-4">
            <h3 className="font-medium mb-2">⭐ Selected Text</h3>
            {selectedText ? (
              <>
                <blockquote className="border-l-4 border-red-500 pl-3 italic text-gray-700 mb-3">
                  {selectedText}
                </blockquote>
                {isSearchingSnippets && (
                  <div className="text-center py-2 mb-3">
                    <div className="text-sm text-gray-600">🔍 Searching for related content...</div>
                  </div>
                )}
                <button
                  onClick={handleGeneratePodcast}
                  disabled={isGeneratingPodcast || snippets.length === 0}
                  className={`w-full py-2 px-3 rounded text-white flex items-center justify-center ${
                    isGeneratingPodcast || snippets.length === 0
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                  title={snippets.length === 0 ? 'Wait for semantic search to complete' : 'Generate audio overview'}
                >
                  {isGeneratingPodcast ? '🔄 Generating...' : '🔊 Generate Audio Overview'}
                </button>
                {snippets.length === 0 && selectedText && !isSearchingSnippets && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    💡 Audio generation will be available after semantic search finds related content
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Select text from the PDF to automatically search for related content</p>
            )}
          </div>
          
          {/* Podcast Player */}
          {podcastAudioUrl && (
            <div className="bg-white rounded p-4 shadow mb-4">
              <h3 className="font-medium mb-2">🎧 Audio Overview</h3>
              <audio controls className="w-full" src={podcastAudioUrl}></audio>
              <div className="text-xs text-gray-500 mt-2">
                Audio ID: {podcastAudioId}
              </div>
            </div>
          )}

          {/* Multilingual Podcast Player */}
          {multilingualPodcastUrl && (
            <div className="bg-white rounded p-4 shadow mb-4">
              <h3 className="font-medium mb-2">🌍 Multilingual Podcast</h3>
              <div className="text-sm text-gray-600 mb-2">
                Language: {supportedLanguages[selectedLanguage] || selectedLanguage}
              </div>
              <audio controls className="w-full" src={multilingualPodcastUrl}></audio>
              <div className="text-xs text-gray-500 mt-2">
                Audio ID: {multilingualPodcastId}
              </div>
            </div>
          )}

          {/* Analysis Tabs */}
          <div className="bg-white rounded shadow mb-4">
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium text-center ${
                  activeTab === 'snippets'
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('snippets')}
              >
                📄 Snippets
              </button>
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium text-center ${
                  activeTab === 'insights'
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('insights')}
              >
                💡 Insights
              </button>
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium text-center ${
                  activeTab === 'podcast'
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('podcast')}
              >
                🎙️ Audio
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'snippets' && (
                <Snippets 
                  snippets={snippets}
                  selectedText={selectedText}
                  onSnippetClick={handleSnippetClick}
                  isLoading={isSearchingSnippets}
                />
              )}
              
              {activeTab === 'insights' && (
                <div>
                  {isGeneratingInsights && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Generating AI insights...</p>
                    </div>
                  )}
                  
                  {llmInsights && (
                    <div className="space-y-4">
                      {llmInsights.contradictory_viewpoints && llmInsights.contradictory_viewpoints.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-medium text-red-800 mb-2 flex items-center">
                            <span className="mr-2">⚔️</span> Contradictory Viewpoints
                          </h4>
                          <ul className="space-y-2">
                            {llmInsights.contradictory_viewpoints.map((viewpoint, index) => (
                              <li key={index} className="text-sm text-red-700 flex items-start">
                                <span className="mr-2 mt-1">•</span>
                                <span>{viewpoint}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {llmInsights.alternate_applications && llmInsights.alternate_applications.length > 0 && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h4 className="font-medium text-purple-800 mb-2 flex items-center">
                            <span className="mr-2">🔄</span> Alternate Applications
                          </h4>
                          <ul className="space-y-2">
                            {llmInsights.alternate_applications.map((application, index) => (
                              <li key={index} className="text-sm text-purple-700 flex items-start">
                                <span className="mr-2 mt-1">•</span>
                                <span>{application}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {llmInsights.contextual_insights && llmInsights.contextual_insights.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                            <span className="mr-2">🧠</span> Contextual Insights
                          </h4>
                          <ul className="space-y-2">
                            {llmInsights.contextual_insights.map((insight, index) => (
                              <li key={index} className="text-sm text-blue-700 flex items-start">
                                <span className="mr-2 mt-1">•</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {llmInsights.cross_document_connections && llmInsights.cross_document_connections.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-medium text-green-800 mb-2 flex items-center">
                            <span className="mr-2">🔗</span> Cross-Document Connections
                          </h4>
                          <ul className="space-y-2">
                            {llmInsights.cross_document_connections.map((connection, index) => (
                              <li key={index} className="text-sm text-green-700 flex items-start">
                                <span className="mr-2 mt-1">•</span>
                                <span>{connection}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Fallback to old insights if LLM insights not available */}
                  {!llmInsights && !isGeneratingInsights && (
                    <InsightPanel 
                      contradictions={contradictions} 
                      alternateViewpoints={alternateViewpoints} 
                    />
                  )}
                  
                  {!selectedText && !isGeneratingInsights && !llmInsights && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">💡</div>
                      <p className="text-sm">Select text from a PDF to generate AI-powered insights</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'podcast' && (
                <div className="text-center">
                  <div className="text-4xl mb-3">🎙️</div>
                  <h3 className="font-medium mb-3">Audio Overview</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate an AI-powered audio discussion based on your selected text and related insights.
                  </p>
                  
                  {selectedText ? (
                    <button
                      onClick={handleGeneratePodcast}
                      disabled={isGeneratingPodcast || snippets.length === 0}
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center ${
                        isGeneratingPodcast || snippets.length === 0
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {isGeneratingPodcast ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>🔊 Generate Audio Overview</>
                      )}
                    </button>
                  ) : (
                    <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                      Select text from a PDF to generate an audio overview
                    </div>
                  )}
                  
                  {snippets.length === 0 && selectedText && !isSearchingSnippets && (
                    <p className="text-xs text-gray-500 mt-3">
                      💡 Audio generation requires related snippets from semantic search
                    </p>
                  )}
                  
                  {selectedDocuments.length > 1 && (
                    <p className="text-xs text-blue-600 mt-3 bg-blue-50 p-2 rounded">
                      💡 Multiple documents selected - audio will include cross-document insights
                    </p>
                  )}

                  {/* Multilingual Podcast Section */}
                  <div className="border-t mt-6 pt-6">
                    <div className="text-center">
                      <div className="text-3xl mb-3">🌍</div>
                      <h3 className="font-medium mb-3">Multilingual PDF Podcast</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Generate a complete podcast from the entire PDF document in your preferred language.
                      </p>

                      {/* Language Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Language:
                        </label>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Object.entries(supportedLanguages).map(([code, name]) => (
                            <option key={code} value={code}>
                              {name} ({code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Generate Button */}
                      {activeDocumentTab ? (
                        <button
                          onClick={() => handleGenerateMultilingualPodcast(activeDocumentTab)}
                          disabled={isGeneratingMultilingualPodcast}
                          className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center ${
                            isGeneratingMultilingualPodcast
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                        >
                          {isGeneratingMultilingualPodcast ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating Podcast...
                            </>
                          ) : (
                            `🎧 Generate ${supportedLanguages[selectedLanguage] || 'Multilingual'} Podcast`
                          )}
                        </button>
                      ) : (
                        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                          Select a document to generate multilingual podcast
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
