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
  async semanticSearch(text, documentIds = null) {
    try {
      const requestBody = { text };
      if (documentIds && documentIds.length > 0) {
        requestBody.document_ids = documentIds;
      }

      const response = await fetch(`${API_BASE_URL}/search/semantic`, {
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
};
