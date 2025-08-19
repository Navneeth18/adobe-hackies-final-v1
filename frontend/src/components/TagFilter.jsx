import { useState, useEffect } from 'react';
import { Tag, X, Filter } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const TagFilter = ({ clusterId, selectedTags, onTagsChange, onFilteredDocuments }) => {
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (clusterId) {
      fetchAvailableTags();
    }
  }, [clusterId]);

  useEffect(() => {
    // When selected tags change, fetch filtered documents
    if (clusterId) {
      fetchFilteredDocuments();
    }
  }, [selectedTags, clusterId]);

  const fetchAvailableTags = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getClusterTags(clusterId);
      setAvailableTags(response.tags || []);
    } catch (error) {
      console.error('Error fetching available tags:', error);
      toast.error('Failed to load available tags');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilteredDocuments = async () => {
    try {
      const response = await apiService.getDocumentsByCluster(clusterId, selectedTags);
      onFilteredDocuments(response.documents || []);
    } catch (error) {
      console.error('Error fetching filtered documents:', error);
      toast.error('Failed to filter documents');
    }
  };

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      // Remove tag from selection
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      // Add tag to selection
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  if (!clusterId) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] hover:text-blue-600"
        >
          <Filter className="w-4 h-4" />
          Filter by Tags
          {selectedTags.length > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              {selectedTags.length}
            </span>
          )}
        </button>
        {selectedTags.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Selected:</p>
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleTagClick(tag)}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs hover:bg-blue-200"
                  >
                    {tag}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Available Tags */}
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-1">Available:</p>
            {isLoading ? (
              <p className="text-xs text-[var(--text-secondary)]">Loading tags...</p>
            ) : (
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {availableTags
                  .filter(tag => !selectedTags.includes(tag))
                  .map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleTagClick(tag)}
                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs hover:bg-blue-100 hover:text-blue-800 transition-colors"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {availableTags.length === 0 && !isLoading && (
            <p className="text-xs text-[var(--text-secondary)] italic">
              No tags available. Add tags to documents using the 🏷️ icon to enable filtering.
            </p>
          )}
        </div>
      )}

      {/* Compact view when collapsed */}
      {!isExpanded && selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
          {selectedTags.length > 3 && (
            <span className="text-xs text-[var(--text-secondary)]">
              +{selectedTags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TagFilter;
