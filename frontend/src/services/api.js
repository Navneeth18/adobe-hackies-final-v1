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
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Get PDF file by document ID
  async getDocumentPdf(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/pdf`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error fetching PDF:', error);
      throw error;
    }
  },
  
  // Get documents by cluster ID
  async getDocumentsByCluster(clusterId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${clusterId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching documents by cluster:', error);
      throw error;
    }
  },

  // Get document sections
  async getDocumentSections(documentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/sections/${documentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document sections: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching document sections:', error);
      throw error;
    }
  },

  // Semantic search for relevant sections and snippets
  async semanticSearch(selectedText) {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/semantic-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selected_text: selectedText }),
      });

      if (!response.ok) {
        throw new Error(`Semantic search failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error performing semantic search:', error);
      throw error;
    }
  },
  
  // Generate podcast audio from selected text and insights
  async generatePodcast(selectedText, snippets, contradictions, alternateViewpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}/audio/generate-podcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_text: selectedText,
          snippets: snippets,
          contradictions: contradictions,
          alternate_viewpoints: alternateViewpoints
        }),
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
  
  // Get podcast audio by ID
  async getPodcastAudio(audioId) {
    try {
      const response = await fetch(`${API_BASE_URL}/audio/podcast/${audioId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch podcast audio: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error fetching podcast audio:', error);
      throw error;
    }
  },

  // Upload multiple PDFs as a cluster
  async uploadCluster(files) {
    try {
      const formData = new FormData();
      
      // Add each file to FormData
      files.forEach((file, index) => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/documents/upload_cluster`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading cluster:', error);
      throw error;
    }
  },

  // Get recommendations for selected text
  async getRecommendations(queryText, clusterId) {
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_text: queryText,
          cluster_id: clusterId,
        }),
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

  // Get insights for selected text
  async getInsights(text) {
    try {
      const response = await fetch(`${API_BASE_URL}/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
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

  // Generate podcast
  async generatePodcast(intro, discussion) {
    try {
      const response = await fetch(`${API_BASE_URL}/podcast/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intro, discussion }),
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

  // Get knowledge graph
  async getKnowledgeGraph(clusterId) {
    try {
      const response = await fetch(`${API_BASE_URL}/graph/${clusterId}`);

      if (!response.ok) {
        throw new Error(`Graph failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting knowledge graph:', error);
      throw error;
    }
  },
};