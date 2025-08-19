import { useState, useEffect } from "react";
import { apiService } from "./services/api.js";
import PdfViewer from "./components/PdfViewer";
import Snippets from "./components/Snippets";
import InsightPanel from "./components/InsightPanel";
import MindmapPanel from "./components/MindmapPanel";
import ThemeToggle from "./components/ThemeToggle";
import TalkToPdfModal from "./components/TalkToPdfModal";
import MindmapModal from "./components/MindmapModal";
import LoadingSpinner from "./components/LoadingSpinner";
import ConfirmationModal from "./components/ConfirmationModal";
import SelectedTextPodcast from "./components/SelectedTextPodcast";
import DragDropUpload from "./components/DragDropUpload";
import { useTheme } from "./context/ThemeContext";
import toast, { Toaster } from "react-hot-toast";
import logo from "./assets/adobe1.svg";
import { FileText, Menu, X, Mic, RefreshCw, Brain, Trash2 } from "lucide-react";

function App() {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]);
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
  const [documentSearchQuery, setDocumentSearchQuery] = useState(''); // Search query for 
  
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
  const [selectedPodcastSize, setSelectedPodcastSize] = useState('medium');
  const [isGeneratingMultilingualPodcast, setIsGeneratingMultilingualPodcast] = useState(false);
  const [multilingualPodcastUrl, setMultilingualPodcastUrl] = useState(null);
  const [multilingualPodcastId, setMultilingualPodcastId] = useState(null);
  const [isGeneratingFullDocumentPodcast, setIsGeneratingFullDocumentPodcast] = useState(false);
  const [fullDocumentPodcastUrl, setFullDocumentPodcastUrl] = useState(null);
  const [fullDocumentPodcastId, setFullDocumentPodcastId] = useState(null);

  // Talk to PDF modal state
  const [isTalkToPdfOpen, setIsTalkToPdfOpen] = useState(false);

  // Mindmap modal state
  const [isMindmapOpen, setIsMindmapOpen] = useState(false);

  // Mindmap state
  const [generatedMindmapData, setGeneratedMindmapData] = useState(null);

  // Confirmation modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

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
    // For duplicate documents, use the original ID for API calls
    const docId = document.isDuplicate ? document.originalId : document._id;
    
    // Check if we already have this document loaded (use original ID for duplicates)
    if (documentFiles[docId]) {
      setSelectedFile(documentFiles[docId]);
      return;
    }
    
    setIsLoadingSections(true);
    
    try {
      // Fetch PDF directly instead of sections
      toast.loading("Fetching PDF...");
      const pdfBlob = await apiService.getDocumentPdf(docId);
      
      // Create a file object from the blob to display in the PDF viewer
      const file = new File([pdfBlob], `${document.filename}`, { type: 'application/pdf' });
      
      // Store the file in our document files cache (use original ID for duplicates)
      setDocumentFiles(prev => ({
        ...prev,
        [docId]: file
      }));
      
      setSelectedFile(file);
      
      toast.dismiss();
      toast.success("PDF loaded in viewer");
      
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

  // Handle mindmap generation from document library
  const handleGenerateMindmapFromLibrary = async (document, event) => {
    event.stopPropagation(); // Prevent document selection
    
    try {
      toast.loading("Generating mindmap...");
      
      // Open mindmap modal
      setIsMindmapOpen(true);
      
      // Select the document if not already selected
      if (!selectedDocuments.some(doc => doc._id === document._id)) {
        setSelectedDocuments([document]);
      }
      
      // Generate mindmap using the API
      const result = await apiService.generateMindmapFromDocument(document._id);
      
      if (result.success) {
        // Store the generated mindmap data
        setGeneratedMindmapData(result.mindmap);
        toast.dismiss();
        toast.success(`Mindmap generated for ${document.filename}!`);
      } else {
        throw new Error('Failed to generate mindmap');
      }
    } catch (error) {
      console.error('Error generating mindmap:', error);
      toast.dismiss();
      toast.error(`Failed to generate mindmap: ${error.message}`);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = (document, event) => {
    event.stopPropagation(); // Prevent document selection
    setDocumentToDelete(document);
    setIsConfirmModalOpen(true);
  };

  // Confirm and execute deletion
  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      toast.loading("Deleting document...");
      await apiService.deleteDocument(documentToDelete._id);

      // Remove from selected documents if it was selected
      const newSelection = selectedDocuments.filter(doc => doc._id !== documentToDelete._id);
      setSelectedDocuments(newSelection);

      // Remove from document files cache
      setDocumentFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[documentToDelete._id];
        return newFiles;
      });

      // Update active tab if the deleted document was active
      if (activeDocumentTab === documentToDelete._id) {
        setActiveDocumentTab(newSelection.length > 0 ? newSelection[0]._id : null);
        if (newSelection.length > 0) {
          loadDocumentContent(newSelection[0]);
        }
      }

      // Refresh document library
      await fetchUploadedDocuments();

      toast.dismiss();
      toast.success(`"${documentToDelete.filename}" deleted successfully`);
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.dismiss();
      toast.error(`Failed to delete document: ${error.message}`);
    } finally {
      setIsConfirmModalOpen(false);
      setDocumentToDelete(null);
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
    
    // Only remove from cache if no other tabs are using the same original document
    const docId = document.isDuplicate ? document.originalId : document._id;
    const stillInUse = newSelection.some(doc => 
      (doc.isDuplicate ? doc.originalId : doc._id) === docId
    );
    
    if (!stillInUse) {
      setDocumentFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[docId];
        return newFiles;
      });
    }
    
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
      
      // Don't auto-generate insights - only generate when insights tab is clicked
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

  // Handle multilingual podcast generation from selected text
  const handleGenerateMultilingualPodcast = async () => {
    if (!selectedText) {
      toast.error("Please select text from a PDF first");
      return;
    }

    setIsGeneratingMultilingualPodcast(true);
    setMultilingualPodcastUrl(null);

    try {
      const languageName = supportedLanguages[selectedLanguage] || selectedLanguage;
      toast.loading(`Generating ${selectedPodcastSize} podcast in ${languageName}...`);

      // Create a temporary document with selected text for podcast generation
      const result = await apiService.generateMultilingualPodcast(
        activeDocumentTab, // Use the active document ID
        selectedLanguage,
        true, // Always summarize
        selectedPodcastSize
      );

      if (result.success && result.audio_id) {
        setMultilingualPodcastId(result.audio_id);
        setMultilingualPodcastUrl(`http://localhost:8000/api/v1/audio/serve-multilingual/${result.audio_id}`);
        toast.dismiss();
        toast.success(`${selectedPodcastSize.charAt(0).toUpperCase() + selectedPodcastSize.slice(1)} podcast generated successfully in ${result.language_name}!`);
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

  // Handle full document podcast generation
  const handleGenerateFullDocumentPodcast = async () => {
    if (!activeDocumentTab) {
      toast.error("Please select a document first");
      return;
    }

    setIsGeneratingFullDocumentPodcast(true);
    setFullDocumentPodcastUrl(null);

    try {
      const languageName = supportedLanguages[selectedLanguage] || selectedLanguage;
      toast.loading(`Generating ${selectedPodcastSize} full document podcast in ${languageName}...`);

      const result = await apiService.generateMultilingualPodcast(
        activeDocumentTab,
        selectedLanguage,
        true, // Always summarize for full document
        selectedPodcastSize
      );

      if (result.success && result.audio_id) {
        setFullDocumentPodcastId(result.audio_id);
        setFullDocumentPodcastUrl(`http://localhost:8000/api/v1/audio/serve-multilingual/${result.audio_id}`);
        toast.dismiss();
        toast.success(`Full document ${selectedPodcastSize} podcast generated successfully in ${result.language_name}!`);
      } else {
        throw new Error(result.error || "Failed to generate full document podcast");
      }
    } catch (error) {
      console.error("Failed to generate full document podcast:", error);
      toast.dismiss();
      toast.error(`Failed to generate podcast: ${error.message}`);
    } finally {
      setIsGeneratingFullDocumentPodcast(false);
    }
  };

  // Handle snippet click to navigate to specific section with smart tab management
  const handleSnippetClick = async (snippet) => {
    try {
      // Find the document that contains this snippet
      const document = uploadedDocuments.find(doc => doc._id === snippet.document_id);
      if (!document) {
        toast.error("Document not found");
        return;
      }

      const currentActiveDoc = selectedDocuments.find(doc => doc._id === activeDocumentTab);
      const isFromSameDocument = currentActiveDoc && currentActiveDoc._id === snippet.document_id;
      const isAlreadyOpen = selectedDocuments.some(doc => doc._id === snippet.document_id);

      if (isFromSameDocument) {
        // Same document - open duplicate in new tab and scroll to section
        toast.loading("Opening section in new tab...");
        
        // Create a duplicate tab by adding the document again with a unique identifier
        const duplicateDoc = { 
          ...document, 
          _id: `${document._id}_duplicate_${Date.now()}`,
          filename: `${document.filename} (Section: ${snippet.section_title})`,
          isDuplicate: true,
          originalId: document._id,
          targetPage: snippet.page_number,
          highlightText: snippet.text
        };
        
        const newSelection = [...selectedDocuments, duplicateDoc];
        setSelectedDocuments(newSelection);
        setActiveDocumentTab(duplicateDoc._id);
        
        // Load the document content for the duplicate
        await loadDocumentContent(document);
        
        toast.dismiss();
        toast.success(`Opened "${snippet.section_title}" in new tab`);
        
      } else if (isAlreadyOpen) {
        // Document already open - switch to that tab and scroll to section
        toast.loading("Navigating to section...");
        
        // Update the existing document with target page and highlight text
        const updatedSelection = selectedDocuments.map(doc => 
          doc._id === snippet.document_id 
            ? { ...doc, targetPage: snippet.page_number, highlightText: snippet.text }
            : doc
        );
        setSelectedDocuments(updatedSelection);
        setActiveDocumentTab(snippet.document_id);
        await loadDocumentContent(document);
        
        toast.dismiss();
        toast.success(`Navigated to ${document.filename} - ${snippet.section_title}`);
        
      } else {
        // New document - open in new tab without affecting current working PDF
        toast.loading("Opening document in new tab...");
        
        const newDocument = {
          ...document,
          targetPage: snippet.page_number,
          highlightText: snippet.text
        };
        
        const newSelection = [...selectedDocuments, newDocument];
        setSelectedDocuments(newSelection);
        setActiveDocumentTab(document._id);
        
        // Load the document content
        await loadDocumentContent(newDocument);
        
        toast.dismiss();
        toast.success(`Opened ${document.filename} in new tab`);
      }
      
    } catch (error) {
      console.error("Failed to navigate to snippet:", error);
      toast.dismiss();
      toast.error("Failed to navigate to snippet");
    }
  };

  // Handle file upload (works with both drag&drop and file input)
  const handleFileUpload = (filesOrEvent) => {
    let newFiles;
    
    // Check if it's an event (from file input) or files array (from drag&drop)
    if (filesOrEvent.target) {
      newFiles = Array.from(filesOrEvent.target.files);
    } else {
      newFiles = Array.isArray(filesOrEvent) ? filesOrEvent : [filesOrEvent];
    }
    
    // Filter out duplicates
    const uniqueFiles = newFiles.filter(newFile => 
      !stagedFiles.some(existingFile => 
        existingFile.name === newFile.name && existingFile.size === newFile.size
      )
    );
    
    if (uniqueFiles.length < newFiles.length) {
      toast.info(`${newFiles.length - uniqueFiles.length} duplicate file(s) skipped`);
    }
    
    setStagedFiles((prevFiles) => [...prevFiles, ...uniqueFiles]);
    
    // Auto-select first file if none selected
    if (!selectedFile && uniqueFiles.length > 0) {
      setSelectedFile(uniqueFiles[0]);
    }
  };

  // Upload cluster to backend
  const handleUploadCluster = async () => {
    if (stagedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await apiService.uploadCluster(stagedFiles);
      console.log("Upload successful:", result);

      setClusterId(result.cluster_id);
      toast.success(
        `Successfully uploaded ${result.processed_files_count} files! Cluster ID: ${result.cluster_id}`
      );

      // ✅ Reset back to initial stage after successful upload
      setStagedFiles([]);
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


  // Remove file from staged files
  const handleRemoveStagedFile = (fileToRemove) => {
    setStagedFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };

  const { isDarkMode } = useTheme();
  
  return (
    <div className={`flex flex-col h-screen bg-[var(--bg)] font-sans`}>

      {isUploading && <LoadingSpinner message="Cooking your documents..." />}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setDocumentToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
      >
        {documentToDelete && `Are you sure you want to delete "${documentToDelete.filename}"? This action cannot be undone.`}
      </ConfirmationModal>

      {/* Notification */}
      <Toaster />
      {/* Top Bar */}
      <div className="flex items-center justify-between flex-nowrap px-2 sm:px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg)] relative gap-2">

        <div className="flex items-center gap-2">
          <button 
            className="lg:hidden p-2 rounded-md hover:bg-[var(--hover-bg)]"
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
                    <img src="/adobe1.svg" alt="Adobe" className="w-8 h-8 sm:w-12 sm:h-10" />
                                                  <h1 className="text-base sm:text-xl font-bold flex items-center gap-2 text-[var(--text-primary)] truncate">
            AI Document Nexus                          <span className="hidden sm:inline-flex bg-yellow-500 text-white px-3 py-1 rounded text-lg">
              Team Hackies
            </span>
          </h1>
        </div>
                                                <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <button 
            onClick={() => setIsTalkToPdfOpen(true)}
            disabled={uploadedDocuments.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              uploadedDocuments.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 shadow-lg"
            }`}
            title={uploadedDocuments.length === 0 ? "Upload documents first" : "Talk to your PDFs using voice"}
          >
            <span className="inline-flex items-center gap-2"><Mic size={16} /> Talk to PDF</span>
          </button>
          {/* <button
            onClick={() => setIsMindmapOpen(true)}
            disabled={uploadedDocuments.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              uploadedDocuments.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-lg"
            }`}
            title={uploadedDocuments.length === 0 ? "Upload documents first" : "Generate visual mindmaps from your PDFs"}
          >
            🧠 Mindmap
          </button> */}
          

          <ThemeToggle />
          <button 
            className="lg:hidden p-2 rounded-md hover:bg-[var(--hover-bg)]"
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left Sidebar */}
                <div className={`fixed lg:relative top-0 left-0 h-full z-30 w-72 bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] p-4 overflow-y-auto transition-transform transform ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 no-scrollbar`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Upload Documents</h2>
            <button 
              className="lg:hidden p-2 rounded-md hover:bg-[var(--hover-bg)]"
              onClick={() => setIsLeftSidebarOpen(false)}
            >
                <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Drag & Drop File Upload */}
          <div className="mb-4">
            <DragDropUpload
              onFilesSelected={handleFileUpload}
              accept="application/pdf"
              multiple={true}
              disabled={isUploading}
            />
          </div>

          {/* Staged Files List */}
          {stagedFiles.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Selected Files:</h3>
              <ul className="space-y-2 max-h-32 overflow-y-auto pr-2"> {/* Added scroll for long lists */}
                {stagedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between text-sm bg-[var(--card-bg)] p-2 rounded">
                    <span className="text-[var(--text-secondary)] truncate w-48" title={file.name}>{file.name}</span>
                    <button 
                      onClick={() => handleRemoveStagedFile(file)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUploadCluster}
            disabled={isUploading || stagedFiles.length === 0}
            className={`w-full p-3 rounded-lg mb-4 font-medium ${
              isUploading || stagedFiles.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isUploading
              ? "Uploading..."
              : `Upload Cluster (${stagedFiles.length} files)`}
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
              {isLoadingDocuments ? (
                <RefreshCw className="w-4 h-4 animate-spin inline" />
              ) : (
                <RefreshCw className="w-4 h-4 inline" />
              )}
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Search documents..."
            value={documentSearchQuery}
            onChange={(e) => setDocumentSearchQuery(e.target.value)}
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
              {uploadedDocuments
                .filter(document => 
                  documentSearchQuery.trim() === '' || 
                  document.filename.toLowerCase().includes(documentSearchQuery.toLowerCase()) ||
                  document.cluster_id.toLowerCase().includes(documentSearchQuery.toLowerCase())
                )
                .map((document, index) => {
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
                      <div className="">
                        <div className="text-sm text-[var(--text-primary)] truncate">
                          {document.filename}
                        </div>
                        {/* <div className="text-xs text-[var(--text-secondary)]">
                          {document.total_sections} sections
                        </div> */}

                      </div>
                      {/* <div className="text-sm text-[var(--text-primary)] truncate">
                        {document.filename}
                      </div> */}
                      {/* <div className="text-xs text-[var(--text-secondary)]">
                        Cluster: {document.cluster_id?.slice(0, 8)}...
                      </div> */}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* <div className="text-xs text-[var(--text-secondary)]">
                        {document.total_sections} sections
                      </div> */}
                      <button
                        onClick={(e) => handleGenerateMindmapFromLibrary(document, e)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-1 transition-colors"
                        title={`Generate mindmap for ${document.filename}`}
                      >
                        <Brain className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteDocument(document, e)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded p-1 transition-colors"
                        title={`Delete ${document.filename}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Sidebar Buttons */}
          {/* <button className="w-full p-2 bg-white rounded border text-left mb-2">
            ⚡ Generate Insights
          </button>
          <button className="w-full p-2 bg-white rounded border text-left mb-2">
            🎙️ Podcast Mode
          </button>
          <button className="w-full p-2 bg-white rounded border text-left">
            🔍 Concept Explorer
          </button> */}
        </div>

        {/* Center PDF Viewer with Tabs */}
        <div className="flex-1 flex flex-col bg-[var(--bg)] overflow-hidden no-scrollbar">
          {/* Document Tabs */}
          {selectedDocuments.length > 0 && (
            <div className="flex border-b border-[var(--border-color)] bg-[var(--sidebar-bg)] overflow-x-auto">
              {selectedDocuments.map((document) => (
                <div
                  key={document._id}
                  className={`px-4 py-2 flex items-center gap-2 cursor-pointer border-r whitespace-nowrap ${
                    activeDocumentTab === document._id
                      ? "bg-[var(--bg)] border-b-2 border-red-600 font-medium text-[var(--text-primary)]"
                      : "hover:bg-[var(--hover-bg)]"
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
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          

          {/* PDF Area */}
          <div className="flex-1 overflow-auto   flex justify-center items-center">
            {selectedFile ? (
              <PdfViewer 
                file={selectedFile} 
                onTextSelection={handleTextSelection}
                targetPage={(() => {
                  const activeDoc = selectedDocuments.find(doc => doc._id === activeDocumentTab);
                  return activeDoc?.targetPage || null;
                })()}
                highlightText={(() => {
                  const activeDoc = selectedDocuments.find(doc => doc._id === activeDocumentTab);
                  return activeDoc?.highlightText || null;
                })()}
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
                <div className={`fixed lg:relative top-0 right-0 h-full z-30 w-96 bg-[var(--sidebar-bg)] border-l border-[var(--border-color)] p-4 overflow-y-auto transition-transform transform ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 no-scrollbar`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Connecting the Dots</h2>
            <button 
              className="lg:hidden p-2 rounded-md hover:bg-[var(--hover-bg)]"
              onClick={() => setIsRightSidebarOpen(false)}
            >
                <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Selected Documents Info */}
          {selectedDocuments.length > 0 && (
            <div className="bg-[var(--card-bg)] rounded p-4 shadow mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-[var(--text-primary)]">📄 Selected Documents ({selectedDocuments.length})</h3>
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
              <div className="text-sm text-[var(--text-primary)]   max-h-32 overflow-y-auto">
                {selectedDocuments.map((doc, index) => (
                  <div key={doc._id} className={`mb-2 p-2 bg-[var(--card-bg)]   rounded ${activeDocumentTab === doc._id ? ' bg-opacity-800 border-yellow-500' : 'border-blue-300'}`}>
                    <div className=" bg-[var(--card-bg)] p-2 border-2 border-[var(--border-color)] ">
                        <p><strong>{doc.filename}</strong></p>
                    </div>
                    {/* <p className="text-xs text-[var(--text-secondary)]">Sections: {doc.total_sections} | ID: {doc._id.slice(0, 8)}...</p> */}
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
          <div className="bg-[var(--card-bg)] rounded p-4 shadow mb-4">
            <h3 className="font-medium mb-2 text-[var(--text-primary)]">⭐ Selected Text</h3>
            {selectedText ? (
              <>
                <blockquote className="border-l-4 border-[var(--highlight)] pl-3 italic text-[var(--text-primary)] mb-3">
                  {selectedText}
                </blockquote>
                {isSearchingSnippets && (
                  <div className="text-center py-2 mb-3">
                    <div className="text-sm text-[var(--text-secondary)]">🔍 Searching for related content...</div>
                  </div>
                )}
                {/* <button
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
                </button> */}
                {snippets.length === 0 && selectedText && !isSearchingSnippets && (
                  <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">
                    💡 Audio generation will be available after semantic search finds related content
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">Select text from the PDF to automatically search for related content</p>
            )}
          </div>
          
          {/* Podcast Player */}
          {podcastAudioUrl && (
            <div className="bg-[var(--card-bg)] rounded p-4 shadow mb-4">
              <h3 className="font-medium mb-2">🎧 Audio Overview</h3>
              <audio controls className="w-full" src={podcastAudioUrl}></audio>
              <div className="text-xs text-gray-500 mt-2">
                Audio ID: {podcastAudioId}
              </div>
            </div>
          )}

          {/* Analysis Tabs */}
          <div className="bg-[var(--card-bg)] rounded shadow mb-4">
            <div className="flex border-b border-[var(--border-color)]">
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium text-center ${
                  activeTab === 'snippets'
                    ? 'text-[var(--highlight)] border-b-2 border-[var(--highlight)] bg-[var(--highlight-bg-light)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
                onClick={() => setActiveTab('snippets')}
              >
                📄 Snippets
              </button>
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium text-center ${
                  activeTab === 'insights'
                    ? 'text-[var(--highlight)] border-b-2 border-[var(--highlight)] bg-[var(--highlight-bg-light)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
                onClick={() => {
                  setActiveTab('insights');
                  // Generate insights when tab is clicked if we have selected text and snippets
                  if (selectedText && snippets.length > 0 && !llmInsights && !isGeneratingInsights) {
                    generateLLMInsights(selectedText);
                  }
                }}
              >
                💡 Insights
              </button>
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium text-center ${
                  activeTab === 'podcast'
                    ? 'text-[var(--highlight)] border-b-2 border-[var(--highlight)] bg-[var(--highlight-bg-light)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
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
                      <p className="text-sm text-[var(--text-secondary)]">Generating AI insights...</p>
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
                    <div className="text-center py-8 text-[var(--text-secondary)]">
                      <div className="text-4xl mb-2">💡</div>
                      <p className="text-sm">Select text from a PDF to generate AI-powered insights</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'podcast' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center">
                    <div className="text-4xl mb-3">🎙️</div>
                    <h3 className="font-medium mb-3">AI Podcast Generator</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Generate AI-powered audio content from your PDFs in multiple languages and sizes.
                    </p>
                  </div>

                  {/* Selected Text Podcast - Only show if text is selected */}
                  {selectedText && (
                    <SelectedTextPodcast
                      selectedText={selectedText}
                      documentId={activeDocumentTab}
                      sectionTitle={(() => {
                        const activeDoc = selectedDocuments.find(doc => doc._id === activeDocumentTab);
                        return activeDoc?.isDuplicate ? activeDoc.filename.split('(Section: ')[1]?.replace(')', '') : null;
                      })()}
                      pageNumber={(() => {
                        const activeDoc = selectedDocuments.find(doc => doc._id === activeDocumentTab);
                        return activeDoc?.targetPage || null;
                      })()}
                    />
                  )}

                  {/* Language and Size Selection */}
                  <div className="bg-[var(--bg)] p-4 rounded-lg">
                    <h4 className="font-medium mb-3">🌍 Language & Size Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Language</label>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="w-full p-2 border border-[var(--border-color)] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--card-bg)] text-[var(--text-primary)]"
                        >
                          {Object.entries(supportedLanguages).map(([code, name]) => (
                            <option key={code} value={code}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Podcast Size</label>
                        <select
                          value={selectedPodcastSize}
                          onChange={(e) => setSelectedPodcastSize(e.target.value)}
                          className="w-full p-2 border border-[var(--border-color)] rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--card-bg)] text-[var(--text-primary)]"
                        >
                          <option value="small">Small (2-5 min)</option>
                          <option value="medium">Medium (5-10 min)</option>
                          <option value="large">Large (10-20 min)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Full Document Podcast */}
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center">
                      <span className="mr-2">📄</span> Full Document Podcast
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                      Generate a comprehensive podcast from the entire document.
                    </p>

                    {activeDocumentTab ? (
                      <button
                        onClick={handleGenerateFullDocumentPodcast}
                        disabled={isGeneratingFullDocumentPodcast}
                        className={`w-full py-2 px-4 rounded text-white flex items-center justify-center ${
                          isGeneratingFullDocumentPodcast
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {isGeneratingFullDocumentPodcast ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating full {selectedPodcastSize} podcast...
                          </>
                        ) : (
                          <>🎙️ Generate Full Document Podcast ({selectedPodcastSize})</>
                        )}
                      </button>
                    ) : (
                      <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg)] p-4 rounded-lg text-center">
                        Select a document to generate a full document podcast
                      </div>
                    )}

                    {/* Full Document Podcast Player */}
                    {fullDocumentPodcastUrl && (
                      <div className="mt-4 bg-green-50 p-4 rounded-lg">
                        <h5 className="font-medium mb-2">🎙️ Full Document Podcast</h5>
                        <audio controls className="w-full mb-2" src={fullDocumentPodcastUrl}></audio>
                        <div className="text-xs text-gray-500">
                          Audio ID: {fullDocumentPodcastId} | Language: {supportedLanguages[selectedLanguage]} | Size: {selectedPodcastSize}
                        </div>
                      </div>
                    )}
                  </div>

                  

                  {/* Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">💡 Tips</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• <strong>Small:</strong> Quick summaries, perfect for overviews</li>
                      <li>• <strong>Medium:</strong> Balanced content with key details</li>
                      <li>• <strong>Large:</strong> Comprehensive coverage with examples</li>
                      
                    </ul>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Talk to PDF Modal */}
      <TalkToPdfModal
        isOpen={isTalkToPdfOpen}
        onClose={() => setIsTalkToPdfOpen(false)}
        clusterId={clusterId}
        selectedDocuments={selectedDocuments}
        selectedText={selectedText}
      />

      {/* Mindmap Modal */}
      <MindmapModal
        isOpen={isMindmapOpen}
        onClose={() => setIsMindmapOpen(false)}
        selectedDocuments={selectedDocuments}
        selectedText={selectedText}
        generatedMindmapData={generatedMindmapData}
        onMindmapGenerated={setGeneratedMindmapData}
      />
    </div>
  );
}

export default App;
