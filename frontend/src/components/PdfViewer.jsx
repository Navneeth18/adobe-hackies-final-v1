import { useEffect, useState, useRef } from "react";

const PdfViewer = ({ file, onTextSelection, onGenerateAudio, targetPage, highlightText }) => {
  // Debug logging for navigation props
  useEffect(() => {
    if (targetPage || highlightText) {
      console.log('PdfViewer received navigation props:', { targetPage, highlightText });
    }
  }, [targetPage, highlightText]);
  const [directSelection, setDirectSelection] = useState("");
  const viewerRef = useRef(null);
  const [selectionInfo, setSelectionInfo] = useState(null);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [pdfApis, setPdfApis] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    let selectionTimeout;
    let selectionCheckInterval;

    const triggerSelection = (selectedText, source, rectOverride) => {
      if (!selectedText || selectedText.trim().length <= 3) return;

      const text = selectedText.trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const rect =
        rectOverride ||
        (window.getSelection()?.rangeCount
          ? window.getSelection().getRangeAt(0).getBoundingClientRect()
          : null);

      setDirectSelection(text);
      setSelectionInfo({
        text,
        length: text.length,
        wordCount,
        position: rect ? { x: rect.x, y: rect.y } : null,
        timestamp: new Date().toLocaleTimeString(),
        source,
      });

      if (rect && rect.width > 0 && rect.height > 0) {
        showSelectionFeedback(text, rect);
      }

      if (onTextSelection) {
        onTextSelection(text);
      }
    };

    const debounceSelection = (text, source, rectOverride) => {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(() => {
        triggerSelection(text, source, rectOverride);
      }, 1800); // idle delay
    };

    // ---- Browser text selection ----
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const text = selection.toString();
        debounceSelection(text, "manual-idle");
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);

    // ---- Adobe PDF Embed ----
    if (file && window.AdobeDC?.View) {
      try {
        // Clear any existing viewer content
        const viewerContainer = document.getElementById("adobe-dc-view");
        if (viewerContainer) {
          viewerContainer.innerHTML = '';
        }

        const adobeDCView = new window.AdobeDC.View({
          clientId: import.meta.env.VITE_ADOBE_CLIENT_ID,
          divId: "adobe-dc-view",
        });

        // Register required callbacks to prevent errors
        const registerCallbacks = () => {
          try {
            // Check if callback types are available
            if (window.AdobeDC?.View?.Enum?.CallbackType) {
              const callbackTypes = window.AdobeDC.View.Enum.CallbackType;
              
              // Register feature flag callbacks if available
              if (callbackTypes.GET_FEATURE_FLAG) {
                adobeDCView.registerCallback(
                  callbackTypes.GET_FEATURE_FLAG,
                  function(flagName) {
                    console.log(`Feature flag requested: ${flagName}`);
                    // Return default values for common flags
                    const defaultFlags = {
                      'enable-tools-multidoc': false,
                      'edit-config': false,
                      'enable-accessibility': true,
                      'preview-config': true,
                      'enable-inline-organize': false,
                      'enable-pdf-request-signatures': false,
                      'DCWeb_edit_image_experiment': false
                    };
                    return defaultFlags[flagName] || false;
                  }
                );
              }

              // Register other common callbacks to prevent errors
              const commonCallbacks = [
                'SAVE_API',
                'PDF_VIEWER_READY',
                'DOCUMENT_DOWNLOAD',
                'DOCUMENT_PRINT'
              ];

              commonCallbacks.forEach(callbackName => {
                if (callbackTypes[callbackName]) {
                  try {
                    adobeDCView.registerCallback(
                      callbackTypes[callbackName],
                      function(event) {
                        console.log(`Adobe callback triggered: ${callbackName}`, event);
                        return true;
                      }
                    );
                  } catch (err) {
                    console.warn(`Failed to register ${callbackName} callback:`, err);
                  }
                }
              });
            }
          } catch (error) {
            console.warn('Failed to register Adobe callbacks:', error);
          }
        };

        registerCallbacks();

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

          previewFilePromise.then((adobeViewer) => {
            adobeViewer.getAPIs().then((apis) => {
              apis.enableTextSelection(true);
              setPdfApis(apis);
              setIsViewerReady(true);

              // Navigate to target page and highlight text if specified
              if (targetPage && targetPage > 0) {
                // Multiple attempts with different timing and methods
                const attemptNavigation = (attempt = 1) => {
                  const delay = attempt === 1 ? 2000 : attempt * 1000;
                  
                  setTimeout(() => {
                    console.log(`Navigation attempt ${attempt} to page ${targetPage}`);
                    setIsNavigating(true);
                    
                    // Try different navigation methods with detailed error logging
                    const tryMethod = async (methodName, promise) => {
                      try {
                        const result = await promise;
                        console.log(`✅ ${methodName} succeeded:`, result);
                        return result;
                      } catch (error) {
                        console.log(`❌ ${methodName} failed:`, error);
                        return null;
                      }
                    };
                    
                    const navigationPromises = [
                      // Method 1: gotoLocation with page number (1-based)
                      tryMethod('gotoLocation(pageNumber)', apis.gotoLocation(targetPage)),
                      // Method 2: gotoLocation with page object
                      tryMethod('gotoLocation({pageNumber})', apis.gotoLocation({ pageNumber: targetPage })),
                      // Method 3: gotoLocation with different format
                      tryMethod('gotoLocation({page})', apis.gotoLocation({ page: targetPage })),
                      // Method 4: Try 0-based indexing
                      tryMethod('gotoLocation(pageNumber-1)', apis.gotoLocation(targetPage - 1)),
                      // Method 5: Try with location object
                      tryMethod('gotoLocation({location})', apis.gotoLocation({ location: { pageNumber: targetPage } }))
                    ];
                    
                    Promise.allSettled(navigationPromises).then((results) => {
                      const successful = results.some(result => result.status === 'fulfilled' && result.value !== null);
                      
                      if (successful) {
                        console.log(`Successfully navigated to page ${targetPage}`);
                        setIsNavigating(false);
                        
                        // If we have text to highlight, search and highlight it
                        if (highlightText && highlightText.trim()) {
                          setTimeout(() => {
                            apis.search(highlightText.trim()).then((searchResult) => {
                              if (searchResult && searchResult.length > 0) {
                                console.log(`Found and highlighted text: "${highlightText}"`);
                              } else {
                                console.warn(`No search results found for: "${highlightText}"`);
                              }
                            }).catch((error) => {
                              console.warn(`Failed to search/highlight text "${highlightText}":`, error);
                            });
                          }, 1000); // Wait for page navigation to complete
                        }
                      } else {
                        console.warn(`Navigation attempt ${attempt} failed for page ${targetPage}`);
                        
                        // Retry up to 3 times
                        if (attempt < 3) {
                          attemptNavigation(attempt + 1);
                        } else {
                          console.error(`All navigation attempts failed for page ${targetPage}`);
                          setIsNavigating(false);
                          // Fallback: try to scroll to approximate position
                          try {
                            const pdfContainer = document.getElementById('adobe-dc-view');
                            if (pdfContainer) {
                              const estimatedHeight = (targetPage - 1) * 800; // Rough estimate
                              pdfContainer.scrollTop = estimatedHeight;
                              console.log(`Fallback: Scrolled to estimated position for page ${targetPage}`);
                            }
                          } catch (scrollError) {
                            console.warn('Fallback scroll also failed:', scrollError);
                          }
                        }
                      }
                    });
                  }, delay);
                };
                
                attemptNavigation();
              }

              // ---- Adobe polling (debounced every 1s) ----
              const checkForSelection = () => {
                apis.getSelectedContent().then((result) => {
                  if (result?.type === "text" && result.data) {
                    debounceSelection(result.data, "adobe-api");
                  }
                });
              };

              selectionCheckInterval = setInterval(checkForSelection, 1000);

              // ---- Adobe callback (debounced) ----
              try {
                if (window.AdobeDC?.View?.Enum?.CallbackType?.TEXT_SELECTION) {
                  adobeDCView.registerCallback(
                    window.AdobeDC.View.Enum.CallbackType.TEXT_SELECTION,
                    function (event) {
                      if (event.selectedText) {
                        const pdfContainer = document.getElementById("adobe-dc-view");
                        const rect = pdfContainer?.getBoundingClientRect();
                        debounceSelection(event.selectedText, "adobe-callback", rect);
                      }
                    },
                    {}
                  );
                } else {
                  console.warn('TEXT_SELECTION callback type not available');
                }
              } catch (callbackError) {
                console.warn('Failed to register TEXT_SELECTION callback:', callbackError);
              }
            });
          });
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.warn("Adobe viewer init failed:", error);
      }
    }

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (selectionTimeout) clearTimeout(selectionTimeout);
      if (selectionCheckInterval) clearInterval(selectionCheckInterval);
      document
        .querySelectorAll(".selection-notification")
        .forEach((n) => n.remove());
    };
  }, [file, onTextSelection, targetPage, highlightText]);

  const showSelectionFeedback = (text, rect) => {
    try {
      // Remove old notifications
      document
        .querySelectorAll(".selection-notification")
        .forEach((notif) => notif.remove());

      const safeRect = {
        bottom: rect.bottom || rect.top + (rect.height || 20),
        left: Math.max(10, rect.left || 10),
        width: rect.width || 200,
      };

      const notification = document.createElement("div");
      notification.className = "selection-notification";
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

      const wordCount = text.split(/\s+/).filter(Boolean).length;
      notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 2px;">✓ Text Selected</div>
        <div>${wordCount} words • ${text.length} characters</div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = "slideOut 0.3s ease-in";
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 300);
        }
      }, 3000);
    } catch (error) {
      console.warn("Error showing selection feedback:", error);
    }
  };

  return (
    <div className="relative w-full h-full">
      {isNavigating && (
        <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-50 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Navigating to page {targetPage}...
        </div>
      )}
      <div id="adobe-dc-view" className="w-full h-full"></div>

      {selectionInfo && (
        <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-50 max-w-xs">
          <div className="text-xs text-gray-500 mb-1">Last Selection</div>
          <div className="text-sm font-medium text-gray-800 mb-2">
            {selectionInfo.wordCount} words • {selectionInfo.length} chars
          </div>
          <div className="text-xs text-gray-600 truncate">
            "{selectionInfo.text.substring(0, 50)}
            {selectionInfo.text.length > 50 ? "..." : ""}"
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {selectionInfo.timestamp} • {selectionInfo.source || "manual"}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default PdfViewer;
