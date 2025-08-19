import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const DragDropUpload = ({ onFilesSelected, accept = "application/pdf", multiple = true, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drag inactive if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragActive(false);
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setIsDragOver(false);

    if (disabled) {
      toast.error("File upload is currently disabled");
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    
    // Filter files by accept type
    const validFiles = files.filter(file => {
      if (accept === "application/pdf") {
        return file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf');
      }
      return true;
    });

    const invalidFiles = files.filter(file => {
      if (accept === "application/pdf") {
        return !(file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf'));
      }
      return false;
    });

    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) rejected. Only PDF files are allowed.`);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
      toast.success(`${validFiles.length} file(s) added for upload`);
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFilesSelected(files);
      toast.success(`${files.length} file(s) selected`);
    }
    // Reset input value to allow selecting the same files again
    e.target.value = '';
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-2 text-center transition-all duration-300 cursor-pointer transform ${
        disabled
          ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-50"
          : isDragOver
          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 scale-105 shadow-xl border-blue-400"
          : isDragActive
          ? "border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 scale-102 shadow-lg"
          : "border-[var(--border-color)] bg-[var(--card-bg)] hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-transparent hover:scale-101 hover:shadow-md"
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Visual feedback with enhanced animations */}
      <div className={`transition-all duration-300 ${isDragOver ? 'scale-110' : 'scale-100'}`}>
        {isDragOver ? (
          <>
            <div className="relative">
              <div className="text-4xl mb-2 animate-bounce">📁</div>
              <div className="absolute inset-0 animate-ping">
                <div className="w-12 h-12 mx-auto bg-blue-400 rounded-full opacity-20"></div>
              </div>
            </div>
            <p className="text-lg font-bold text-blue-600 mb-1 animate-pulse">Drop files here!</p>
            <p className="text-xs text-blue-500 font-medium">Release to add your PDFs</p>
          </>
        ) : isDragActive ? (
          <>
            <div className="relative">
              <div className="text-4xl mb-2 animate-pulse">📄</div>
              <div className="absolute inset-0">
                <div className="w-8 h-8 mx-auto border-2 border-purple-400 border-dashed rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="text-base font-semibold text-purple-600 mb-1">Drag files here</p>
            <p className="text-xs text-purple-500">Drop to add PDFs for analysis</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3 transition-transform hover:scale-110">📤</div>
            <p className="text-base font-semibold text-[var(--text-primary)] mb-2">
              {disabled ? "Upload Disabled" : "Drag & Drop PDFs"}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              {disabled 
                ? "Please wait for current operation to complete"
                : "Drag and drop PDF files here, or click to browse"
              }
            </p>
            {!disabled && (
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Browse Files
              </div>
            )}
            
          </>
        )}
      </div>

      {/* File type indicator */}
      <div className="absolute top-2 right-2">
        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
          PDF only
        </span>
      </div>

      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg pointer-events-none" />
      )}
    </div>
  );
};

export default DragDropUpload;
