const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiService = {
  // Get all uploaded documents
  async getDocuments() {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Upload a new document
  async uploadDocument(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Get document content by ID
  async getDocumentContent(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/content`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get content: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting document content:', error);
      throw error;
    }
  },

  // Perform semantic search
  async semanticSearch(selectedText, documentIds = null) {
    try {
      const requestBody = { selected_text: selectedText };
      if (documentIds && documentIds.length > 0) {
        requestBody.document_ids = documentIds;
      }

      const response = await fetch(`${API_BASE_URL}/documents/semantic-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error performing semantic search:', error);
      throw error;
    }
  },

  // Get recommendations
  async getRecommendations(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/${documentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Recommendations failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  },

  // Get insights for selected text with related snippets
  async getInsights(text, relatedSnippets = null) {
    try {
      const requestBody = { text };
      if (relatedSnippets && relatedSnippets.length > 0) {
        requestBody.related_snippets = relatedSnippets;
      }

      const response = await fetch(`${API_BASE_URL}/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Insights failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting insights:', error);
      throw error;
    }
  },

  // Get document PDF file
  async getDocumentPdf(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/pdf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get PDF: ${response.status}`);
      }

      // Return the blob for PDF viewing
      return await response.blob();
    } catch (error) {
      console.error('Error getting document PDF:', error);
      throw error;
    }
  },

  // Get document sections
  async getDocumentSections(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/sections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get sections: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting document sections:', error);
      throw error;
    }
  },

  // Delete document
  async deleteDocument(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  // Generate audio podcast with enhanced insights
  generatePodcast: async (selectedText, snippets = [], insights = {}) => {
    try {
      const requestData = {
        selected_text: selectedText,
        snippets: snippets,
        contradictions: insights.contradictory_viewpoints || [],
        alternate_viewpoints: insights.alternate_applications || [],
        contextual_insights: insights.contextual_insights || [],
        cross_document_connections: insights.cross_document_connections || []
      };

      const response = await fetch(`${API_BASE_URL}/audio/generate-podcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Podcast generation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating podcast:', error);
      throw error;
    }
  },

  // Upload cluster of documents
  async uploadCluster(files) {
    try {
      const formData = new FormData();
      
      // Append all files to the form data
      files.forEach((file, index) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/documents/upload_cluster`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading cluster:', error);
      throw error;
    }
  },

  // Get generated podcast audio
  getPodcast: async (audioId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio/podcast/${audioId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get podcast: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting podcast:', error);
      throw error;
    }
  },

  // Generate multilingual podcast from PDF
  generateMultilingualPodcast: async (documentId, language = 'en', summarize = true, size = 'medium') => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio/generate-multilingual-podcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          language: language,
          summarize: summarize,
          size: size
        }),
      });

      if (!response.ok) {
        throw new Error(`Multilingual podcast generation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating multilingual podcast:', error);
      throw error;
    }
  },

  // Get supported languages for multilingual podcasts
  getSupportedLanguages: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio/supported-languages`);

      if (!response.ok) {
        throw new Error(`Failed to fetch supported languages: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching supported languages:', error);
      throw error;
    }
  },

  // Mindmap API methods
  async generateMindmapFromDocument(documentId, maxSections = 12, phrasesPerSection = 6) {
    try {
      const response = await fetch(`${API_BASE_URL}/mindmap/generate/${documentId}?max_sections=${maxSections}&phrases_per_section=${phrasesPerSection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating mindmap from document:', error);
      throw error;
    }
  },

  async generateMindmapFromUpload(file, maxSections = 12, phrasesPerSection = 6) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/mindmap/generate?max_sections=${maxSections}&phrases_per_section=${phrasesPerSection}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating mindmap from upload:', error);
      throw error;
    }
  },

  async generateMindmapFromText(text, title = 'Document', maxSections = 12, phrasesPerSection = 6) {
    try {
      const response = await fetch(`${API_BASE_URL}/mindmap/text?max_sections=${maxSections}&phrases_per_section=${phrasesPerSection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, title }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating mindmap from text:', error);
      throw error;
    }
  },

  async downloadMindmap(documentId, format = 'mermaid', maxSections = 12, phrasesPerSection = 6) {
    try {
      const response = await fetch(`${API_BASE_URL}/mindmap/download/${documentId}?format=${format}&max_sections=${maxSections}&phrases_per_section=${phrasesPerSection}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response; // Return response for blob handling
    } catch (error) {
      console.error('Error downloading mindmap:', error);
      throw error;
    }
  },

  // Generate selected text podcast with comprehensive insights
  generateSelectedTextPodcast: async (selectedText, documentId = null, sectionTitle = null, pageNumber = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio/generate-selected-text-podcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_text: selectedText,
          document_id: documentId,
          section_title: sectionTitle,
          page_number: pageNumber
        }),
      });

      if (!response.ok) {
        throw new Error(`Selected text podcast generation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating selected text podcast:', error);
      throw error;
    }
  },
};
