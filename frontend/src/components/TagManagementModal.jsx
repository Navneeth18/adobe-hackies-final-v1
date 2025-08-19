import { useState, useEffect } from 'react';
import { X, Tag, Plus, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const TagManagementModal = ({ isOpen, onClose, document, onTagsUpdated }) => {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && document) {
      // Initialize tags from document
      setTags(document.tags || []);
      
      // Fetch available tags from the cluster
      fetchClusterTags();
    }
  }, [isOpen, document]);

  const fetchClusterTags = async () => {
    if (!document?.cluster_id) return;
    
    try {
      setIsLoading(true);
      const response = await apiService.getClusterTags(document.cluster_id);
      setAvailableTags(response.tags || []);
    } catch (error) {
      console.error('Error fetching cluster tags:', error);
      toast.error('Failed to load available tags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSuggestedTagClick = (suggestedTag) => {
    if (!tags.includes(suggestedTag)) {
      setTags([...tags, suggestedTag]);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiService.updateDocumentTags(document._id, tags);
      toast.success('Tags updated successfully');
      
      // Update the document object with new tags
      const updatedDocument = { ...document, tags };
      onTagsUpdated(updatedDocument);
      
      onClose();
    } catch (error) {
      console.error('Error updating tags:', error);
      toast.error('Failed to update tags');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  // Get suggested tags (available tags not already applied)
  const suggestedTags = availableTags.filter(tag => !tags.includes(tag));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg)] rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Manage Tags</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--hover-bg)] rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Document Info */}
          <div className="bg-[var(--card-bg)] p-3 rounded-lg">
            <h3 className="font-medium text-[var(--text-primary)] truncate">
              {document?.filename}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Cluster: {document?.cluster_id?.slice(0, 8)}...
            </p>
          </div>

          {/* Current Tags */}
          <div>
            <h4 className="font-medium text-[var(--text-primary)] mb-2">Current Tags</h4>
            {tags.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] italic">No tags assigned</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Add New Tag */}
          <div>
            <h4 className="font-medium text-[var(--text-primary)] mb-2">Add New Tag</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter tag name..."
                className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg)] text-[var(--text-primary)]"
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim() || tags.includes(newTag.trim())}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suggested Tags */}
          {suggestedTags.length > 0 && (
            <div>
              <h4 className="font-medium text-[var(--text-primary)] mb-2">Suggested Tags</h4>
              {isLoading ? (
                <p className="text-sm text-[var(--text-secondary)]">Loading suggestions...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedTagClick(tag)}
                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm hover:bg-blue-100 hover:text-blue-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-[var(--border-color)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Tags'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagManagementModal;
