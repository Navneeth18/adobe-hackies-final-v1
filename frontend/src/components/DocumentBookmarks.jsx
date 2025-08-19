import { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const DocumentBookmarks = ({ document, onPageNavigation }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    if (document?._id) {
      fetchBookmarks();
    }
  }, [document]);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getDocumentBookmarks(document._id);
      setBookmarks(response.bookmarks || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error('Failed to load document bookmarks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmarkClick = (bookmark) => {
    if (onPageNavigation) {
      onPageNavigation(bookmark.page);
    }
  };

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const renderBookmark = (bookmark, index, level = 0) => {
    const hasChildren = index < bookmarks.length - 1 && bookmarks[index + 1]?.level > bookmark.level;
    const isExpanded = expandedItems.has(index);
    const indentClass = level > 0 ? `ml-${Math.min(level * 4, 16)}` : '';

    return (
      <div key={index} className={`${indentClass}`}>
        <div
          className="flex items-center gap-2 p-2 hover:bg-[var(--hover-bg)] rounded cursor-pointer group"
          onClick={() => handleBookmarkClick(bookmark)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(index);
              }}
              className="p-1 hover:bg-[var(--card-bg)] rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          
          <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <div className="text-sm text-[var(--text-primary)] truncate group-hover:text-blue-600">
              {bookmark.title}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              Page {bookmark.page}
            </div>
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {bookmarks
              .slice(index + 1)
              .filter((_, i) => {
                const nextIndex = index + 1 + i;
                const nextBookmark = bookmarks[nextIndex];
                return nextBookmark && nextBookmark.level > bookmark.level;
              })
              .map((childBookmark, childIndex) => {
                const actualIndex = index + 1 + childIndex;
                return renderBookmark(childBookmark, actualIndex, bookmark.level);
              })}
          </div>
        )}
      </div>
    );
  };

  if (!document) {
    return (
      <div className="p-4 text-center text-[var(--text-secondary)]">
        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Select a document to view bookmarks</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-[var(--text-secondary)]">Loading bookmarks...</p>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="p-4 text-center text-[var(--text-secondary)]">
        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No bookmarks found in this document</p>
        <p className="text-xs mt-1">This PDF may not have a table of contents</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 p-2 border-b border-[var(--border-color)]">
        <BookOpen className="w-4 h-4 text-blue-600" />
        <h3 className="font-medium text-[var(--text-primary)]">Table of Contents</h3>
        <span className="text-xs text-[var(--text-secondary)] bg-[var(--card-bg)] px-2 py-0.5 rounded">
          {bookmarks.length} items
        </span>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {bookmarks
          .filter(bookmark => bookmark.level === 1) // Only show top-level items initially
          .map((bookmark, index) => {
            const actualIndex = bookmarks.findIndex(b => b === bookmark);
            return renderBookmark(bookmark, actualIndex);
          })}
      </div>
    </div>
  );
};

export default DocumentBookmarks;
