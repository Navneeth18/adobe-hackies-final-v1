import React from 'react';

const Snippets = ({ snippets, selectedText, onSnippetClick, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-[var(--card-bg)] rounded p-4 shadow mb-4">
        <h3 className="font-medium mb-2 text-[var(--text-primary)]">🔍 Finding Relevant Snippets...</h3>
        <div className="text-center py-4">
          <div className="text-xl mb-2">🔄</div>
          <p className="text-sm text-[var(--text-secondary)]">Searching across your documents</p>
        </div>
      </div>
    );
  }

  if (!snippets || snippets.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] rounded p-4 shadow mb-4">
        <h3 className="font-medium mb-2 text-[var(--text-primary)]">🔍 Relevant Snippets</h3>
        <p className="text-sm text-[var(--text-secondary)]">No relevant snippets found for your selection.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded p-4 shadow mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-[var(--text-primary)]">🔍 Relevant Snippets</h3>
        <span className="text-xs bg-[var(--highlight-bg)] text-[var(--highlight)] px-2 py-1 rounded">
          {snippets.length} found
        </span>
      </div>
      
      {selectedText && (
        <div className="mb-3 p-3 bg-[var(--highlight-bg-light)] rounded border-l-4 border-[var(--highlight)]">
          <p className="text-xs text-[var(--highlight)] font-medium mb-1">Selected Text:</p>
          <p className="text-sm text-[var(--highlight-dark)] italic">"{selectedText}"</p>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {snippets.map((snippet, index) => (
          <div 
            key={index} 
            className="p-3 border rounded-lg hover:bg-[var(--hover-bg)] cursor-pointer transition-colors"
            onClick={() => onSnippetClick(snippet)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">
                  {snippet.section_title}
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Page {snippet.page_number} • Relevance: {Math.round(snippet.similarity * 100)}%
                </p>
              </div>
              <button className="text-xs bg-[var(--highlight)] text-white px-2 py-1 rounded hover:bg-[var(--highlight-hover)]">
                View
              </button>
            </div>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              "{snippet.text}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Snippets;
