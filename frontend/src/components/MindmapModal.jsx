import React, { useState, useEffect } from 'react';
import MindmapPanel from './MindmapPanel';

const MindmapModal = ({ isOpen, onClose, selectedDocuments, selectedText, generatedMindmapData, onMindmapGenerated }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-lg shadow-2xl w-[90vw] h-[85vh] max-w-6xl flex flex-col transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <span className="text-2xl">🧠</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mindmap Generator</h2>
              <p className="text-sm text-gray-600">Generate visual mindmaps from your documents</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto min-h-0">
          <MindmapPanel 
            selectedDocuments={selectedDocuments}
            selectedText={selectedText}
            generatedMindmapData={generatedMindmapData}
            onMindmapGenerated={onMindmapGenerated}
          />
        </div>
      </div>
    </div>
  );
};

export default MindmapModal;
