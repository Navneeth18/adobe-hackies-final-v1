import React, { useState } from 'react';
import { apiService } from '../services/api';
import { Brain, Download, FileText, Upload, Settings, Loader2, Eye, Code } from 'lucide-react';
import toast from 'react-hot-toast';
import MermaidRenderer from './MermaidRenderer';

const MindmapPanel = ({ selectedDocuments, selectedText, generatedMindmapData, onMindmapGenerated }) => {
  const [mindmapData, setMindmapData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFormat, setActiveFormat] = useState('mermaid');
  const [viewMode, setViewMode] = useState('visual'); // 'visual' or 'code'
  const [settings, setSettings] = useState({
    maxSections: 12,
    phrasesPerSection: 6
  });
  const [showSettings, setShowSettings] = useState(false);

  // Update mindmap data when generated from library
  React.useEffect(() => {
    if (generatedMindmapData) {
      setMindmapData(generatedMindmapData);
    }
  }, [generatedMindmapData]);

  const generateMindmapFromDocument = async (documentId) => {
    setIsGenerating(true);
    try {
      const result = await apiService.generateMindmapFromDocument(
        documentId,
        settings.maxSections,
        settings.phrasesPerSection
      );
      
      if (result.success) {
        setMindmapData(result.mindmap);
        onMindmapGenerated && onMindmapGenerated(result.mindmap);
        toast.success('Mindmap generated successfully!');
      } else {
        throw new Error('Failed to generate mindmap');
      }
    } catch (error) {
      console.error('Error generating mindmap:', error);
      toast.error(`Failed to generate mindmap: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMindmapFromText = async () => {
    if (!selectedText.trim()) {
      toast.error('Please select some text first');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await apiService.generateMindmapFromText(
        selectedText,
        'Selected Text',
        settings.maxSections,
        settings.phrasesPerSection
      );
      
      if (result.success) {
        setMindmapData(result.mindmap);
        onMindmapGenerated && onMindmapGenerated(result.mindmap);
        toast.success('Mindmap generated from selected text!');
      } else {
        throw new Error('Failed to generate mindmap');
      }
    } catch (error) {
      console.error('Error generating mindmap:', error);
      toast.error(`Failed to generate mindmap: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a PDF file');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await apiService.generateMindmapFromUpload(
        file,
        settings.maxSections,
        settings.phrasesPerSection
      );
      
      if (result.success) {
        setMindmapData(result.mindmap);
        onMindmapGenerated && onMindmapGenerated(result.mindmap);
        toast.success(`Mindmap generated from ${file.name}!`);
      } else {
        throw new Error('Failed to generate mindmap');
      }
    } catch (error) {
      console.error('Error generating mindmap:', error);
      toast.error(`Failed to generate mindmap: ${error.message}`);
    } finally {
      setIsGenerating(false);
      event.target.value = ''; // Reset file input
    }
  };

  const downloadMindmap = async (format) => {
    if (!mindmapData || !selectedDocuments.length) {
      toast.error('No mindmap data or document selected');
      return;
    }

    try {
      const response = await apiService.downloadMindmap(
        selectedDocuments[0]._id,
        format,
        settings.maxSections,
        settings.phrasesPerSection
      );
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindmap.${format === 'mermaid' ? 'mmd' : 'mm'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Mindmap downloaded as ${format} format!`);
    } catch (error) {
      console.error('Error downloading mindmap:', error);
      toast.error(`Failed to download mindmap: ${error.message}`);
    }
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success('Mindmap content copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">


      {/* Mindmap Content */}
      <div className="flex-1 overflow-hidden">
        {mindmapData ? (
          <div className="h-full flex flex-col">
            {/* View Mode and Format Toggle */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                {/* View Mode Toggle */}
                <button
                  onClick={() => setViewMode('visual')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium ${
                    viewMode === 'visual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Visual</span>
                </button>
                <button
                  onClick={() => setViewMode('code')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium ${
                    viewMode === 'code'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Code className="w-3 h-3" />
                  <span>Code</span>
                </button>
                
                {/* Format Toggle (only show in code view) */}
                {viewMode === 'code' && (
                  <>
                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1 self-center"></div>
                    <button
                      onClick={() => setActiveFormat('mermaid')}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        activeFormat === 'mermaid'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Mermaid
                    </button>
                    <button
                      onClick={() => setActiveFormat('freemind')}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        activeFormat === 'freemind'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      FreeMind
                    </button>
                  </>
                )}
              </div>
              
              <div className="flex space-x-2">
                {viewMode === 'code' && (
                  <button
                    onClick={() => copyToClipboard(mindmapData[activeFormat])}
                    className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Copy
                  </button>
                )}
                <button
                  onClick={() => downloadMindmap(activeFormat)}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Mindmap Info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Title:</strong> {mindmapData.root_title}</p>
                <p><strong>Sections:</strong> {mindmapData.sections_count}</p>
              </div>
            </div>

            {/* Mindmap Content */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'visual' ? (
                <MermaidRenderer 
                  mermaidCode={mindmapData.mermaid}
                  title={mindmapData.root_title}
                />
              ) : (
                <div className="h-full overflow-auto p-4">
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {mindmapData[activeFormat]}
                  </pre>
                </div>
              )}
            </div>

            {/* Section Details - Only show in code view */}
            {viewMode === 'code' && (
              <div className="border-t border-gray-200 dark:border-gray-700 max-h-48 overflow-auto">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Section Details
                  </h3>
                  <div className="space-y-2">
                    {mindmapData.sections.map((section, index) => (
                      <div key={index} className="text-xs">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {section.title}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 ml-2">
                          Key phrases: {section.phrases.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a document, text, or upload a PDF to generate a mindmap</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindmapPanel;
