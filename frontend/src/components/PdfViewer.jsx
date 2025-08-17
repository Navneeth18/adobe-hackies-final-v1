import { useEffect, useState, useRef } from "react";

const PdfViewer = ({ file, onTextSelection, onGenerateAudio }) => {
  const [directSelection, setDirectSelection] = useState("");
  const viewerRef = useRef(null);
  const [selectionInfo, setSelectionInfo] = useState(null);

  useEffect(() => {
    let mouseUpHandler;
    let selectionTimeout;

    // Simple text selection handler
    const handleMouseUp = () => {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 3) {
          const selectedText = selection.toString().trim();
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Update state immediately
          setDirectSelection(selectedText);
          setSelectionInfo({
            text: selectedText,
            length: selectedText.length,
            wordCount: selectedText.split(/\s+/).filter(word => word.length > 0).length,
            position: { x: rect.x, y: rect.y },
            timestamp: new Date().toLocaleTimeString()
          });
          
          // Show visual feedback
          if (rect.width > 0 && rect.height > 0) {
            showSelectionFeedback(selectedText, rect);
          }
          
          // Trigger callback for sidebar update
          if (onTextSelection) {
            onTextSelection(selectedText);
          }
        }
      }, 100);
    };
    
    // Visual feedback for text selection
    const showSelectionFeedback = (text, rect) => {
      try {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.selection-notification');
        existingNotifications.forEach(notif => notif.remove());
        
        // Validate rect properties
        const safeRect = {
          bottom: rect.bottom || rect.top + (rect.height || 20),
          left: Math.max(10, rect.left || 10),
          width: rect.width || 200
        };
        
        // Create selection notification
        const notification = document.createElement('div');
        notification.className = 'selection-notification';
        notification.style.cssText = `
          position: fixed;
          top: ${safeRect.bottom + 10}px;
          left: ${safeRect.left}px;
          background: #10b981;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease-out;
          max-width: 300px;
          word-wrap: break-word;
          pointer-events: none;
        `;
        
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        notification.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 2px;">✓ Text Selected</div>
          <div>${wordCount} words • ${text.length} characters</div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
              if (notification.parentNode) {
                notification.remove();
              }
            }, 300);
          }
        }, 3000);
      } catch (error) {
        console.warn('Error showing selection feedback:', error);
      }
    };


    if (file && window.AdobeDC && window.AdobeDC.View) {
      try {
        const adobeDCView = new window.AdobeDC.View({
          clientId: import.meta.env.VITE_ADOBE_CLIENT_ID,
          divId: "adobe-dc-view",
        });
        
        viewerRef.current = adobeDCView;

        const reader = new FileReader();
        reader.onload = function (e) {
          const previewFilePromise = adobeDCView.previewFile(
            {
              content: { promise: Promise.resolve(e.target.result) },
              metaData: { fileName: file.name },
            },
            {
              embedMode: "SIZED_CONTAINER",
              showDownloadPDF: true,
              showPrintPDF: true,
              enableFormFilling: false,
              showAnnotationTools: false,
              showLeftHandPanel: false,
              enableSearchAPIs: true,
              includePDFAnnotations: false,
            }
          );

          // Enable text selection with Adobe API
          previewFilePromise.then(adobeViewer => {
            adobeViewer.getAPIs().then(apis => {
              apis.enableTextSelection(true);

              let lastSelectedText = "";
              let selectionCheckInterval;
              
              // Adobe native selection detection using getSelectedContent API
              const checkForSelection = () => {
                apis.getSelectedContent()
                  .then(result => {
                    if (result && result.type === 'text' && result.data && result.data.trim().length > 3) {
                      const selectedText = result.data.trim();
                      if (selectedText !== lastSelectedText) {
                        lastSelectedText = selectedText;
                        
                        setDirectSelection(selectedText);
                        setSelectionInfo({
                          text: selectedText,
                          length: selectedText.length,
                          wordCount: selectedText.split(/\s+/).filter(word => word.length > 0).length,
                          timestamp: new Date().toLocaleTimeString(),
                          source: 'adobe-api'
                        });
                        
                        // Show visual feedback at PDF center
                        const pdfContainer = document.getElementById('adobe-dc-view');
                        if (pdfContainer) {
                          const rect = pdfContainer.getBoundingClientRect();
                          showSelectionFeedback(selectedText, {
                            left: rect.left + rect.width / 2 - 150,
                            top: rect.top + 100,
                            width: 300,
                            height: 30
                          });
                        }
                        
                        if (onTextSelection) {
                          onTextSelection(selectedText);
                        }
                      }
                    } else if (!result || !result.data) {
                      // Clear selection if nothing is selected
                      if (lastSelectedText) {
                        lastSelectedText = "";
                        setDirectSelection("");
                        setSelectionInfo(null);
                      }
                    }
                  })
                  .catch(() => {
                    // Silently handle API errors
                  });
              };

              // Start periodic checking for selections
              selectionCheckInterval = setInterval(checkForSelection, 300);
              
              // Also add mouse event fallback
              const handleMouseSelection = () => {
                setTimeout(checkForSelection, 100);
              };

              setTimeout(() => {
                const pdfContainer = document.getElementById('adobe-dc-view');
                if (pdfContainer) {
                  pdfContainer.addEventListener('mouseup', handleMouseSelection);
                  document.addEventListener('mouseup', handleMouseSelection);
                }
              }, 2000);
              
              // Cleanup interval on component unmount
              return () => {
                if (selectionCheckInterval) {
                  clearInterval(selectionCheckInterval);
                }
              };
            });
          });
          
          // Adobe callback as backup
          adobeDCView.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.TEXT_SELECTION,
            function(event) {
              if (event.selectedText && event.selectedText.trim().length > 3) {
                const selectedText = event.selectedText.trim();
                
                setDirectSelection(selectedText);
                setSelectionInfo({
                  text: selectedText,
                  length: selectedText.length,
                  wordCount: selectedText.split(/\s+/).filter(word => word.length > 0).length,
                  timestamp: new Date().toLocaleTimeString(),
                  source: 'adobe-callback'
                });
                
                const pdfContainer = document.getElementById('adobe-dc-view');
                if (pdfContainer) {
                  const rect = pdfContainer.getBoundingClientRect();
                  showSelectionFeedback(selectedText, {
                    left: rect.left + rect.width / 2 - 100,
                    top: rect.top + 50,
                    bottom: rect.top + 100,
                    width: 200,
                    height: 20
                  });
                }
                
                if (onTextSelection) {
                  onTextSelection(selectedText);
                }
              }
            },
            {}
          );

          // Fallback listeners
          setTimeout(() => {
            const pdfContainer = document.getElementById('adobe-dc-view');
            if (pdfContainer) {
              mouseUpHandler = handleMouseUp;
              pdfContainer.addEventListener('mouseup', mouseUpHandler);
              document.addEventListener('mouseup', mouseUpHandler);
            }
          }, 2000);
        };
        reader.readAsArrayBuffer(file);

      } catch (error) {
        mouseUpHandler = handleMouseUp;
        document.addEventListener('mouseup', mouseUpHandler);
      }
    } else {
      // Fallback if Adobe API not available
      mouseUpHandler = handleMouseUp;
      document.addEventListener('mouseup', mouseUpHandler);
    }

    // Cleanup function
    return () => {
      if (mouseUpHandler) {
        document.removeEventListener('mouseup', mouseUpHandler);
        document.removeEventListener('selectionchange', mouseUpHandler);
        const pdfContainer = document.getElementById('adobe-dc-view');
      }
      
      // Clear any existing selection timeouts
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
      
      // Remove any existing notifications
      const existingNotifications = document.querySelectorAll('.selection-notification');
      existingNotifications.forEach(notif => notif.remove());
    };
  }, [file, onTextSelection, onGenerateAudio]);

  return (
    <div className="relative w-full h-full">
      <div id="adobe-dc-view" className="w-full h-full"></div>
      
      {/* Selection Info Overlay */}
      {selectionInfo && (
        <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-50 max-w-xs">
          <div className="text-xs text-gray-500 mb-1">Last Selection</div>
          <div className="text-sm font-medium text-gray-800 mb-2">
            {selectionInfo.wordCount} words • {selectionInfo.length} chars
          </div>
          <div className="text-xs text-gray-600 truncate">
            "{selectionInfo.text.substring(0, 50)}{selectionInfo.text.length > 50 ? '...' : ''}"
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {selectionInfo.timestamp} • {selectionInfo.source || 'manual'}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

export default PdfViewer;
