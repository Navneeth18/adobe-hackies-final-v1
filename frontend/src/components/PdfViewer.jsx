import { useEffect, useState, useRef, memo } from "react";
import { useTheme } from "../context/ThemeContext";

const PdfViewer = memo(({ file, onTextSelection, targetPage, highlightText }) => {
  const { isDarkMode } = useTheme();
  const viewerRef = useRef(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState(null);

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
      }, 1800);
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const text = selection.toString();
        debounceSelection(text, "manual-idle");
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);

    if (file && window.AdobeDC?.View) {
      try {
        const viewerContainer = document.getElementById("adobe-dc-view");
        if (viewerContainer) {
          viewerContainer.innerHTML = '';
        }

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
              uiTheme: isDarkMode ? "DARK" : "LIGHT",
              showDownloadPDF: true,
              showPrintPDF: true,
              enableFormFilling: false,
              showAnnotationTools: false,
              showLeftHandPanel: false,
              enableSearchAPIs: true,
            }
          );

          previewFilePromise.then((adobeViewer) => {
            adobeViewer.getAPIs().then((apis) => {
              apis.enableTextSelection(true);

              if (targetPage && targetPage > 0) {
                const attemptNavigation = (attempt = 1) => {
                  const delay = attempt * 1500;
                  setTimeout(() => {
                    console.log(`Navigation attempt ${attempt} to page ${targetPage}`);
                    setIsNavigating(true);
                    apis.gotoLocation(targetPage)
                      .then(() => {
                        console.log(`Successfully navigated to page ${targetPage}`);
                        setIsNavigating(false);
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
                          }, 1000);
                        }
                      })
                      .catch((error) => {
                        console.warn(`Navigation attempt ${attempt} failed for page ${targetPage}:`, error);
                        if (attempt < 3) {
                          attemptNavigation(attempt + 1);
                        } else {
                          console.error(`All navigation attempts failed for page ${targetPage}`);
                          setIsNavigating(false);
                        }
                      });
                  }, delay);
                };
                attemptNavigation();
              }

              const checkForSelection = () => {
                apis.getSelectedContent().then((result) => {
                  if (result?.type === "text" && result.data) {
                    debounceSelection(result.data, "adobe-api");
                  }
                });
              };
              selectionCheckInterval = setInterval(checkForSelection, 1000);
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
      clearTimeout(selectionTimeout);
      clearInterval(selectionCheckInterval);
      document.querySelectorAll(".selection-notification").forEach((n) => n.remove());
    };
  }, [file, onTextSelection, targetPage, highlightText, isDarkMode]);

  const showSelectionFeedback = (text, rect) => {
    try {
      document.querySelectorAll(".selection-notification").forEach((notif) => notif.remove());

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
        <div className="absolute top-4 left-4 bg-[var(--button-secondary)] text-white px-3 py-2 rounded-lg shadow-lg z-50 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Navigating to page {targetPage}...
        </div>
      )}
      <div id="adobe-dc-view" className="w-full h-full"></div>

      {selectionInfo && (
        <div className="absolute top-4 right-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-3 shadow-lg z-50 max-w-xs">
          <div className="text-xs text-[var(--text-secondary)] mb-1">Last Selection</div>
          <div className="text-sm font-medium text-[var(--text-primary)] mb-2">
            {selectionInfo.wordCount} words • {selectionInfo.length} chars
          </div>
          <div className="text-xs text-[var(--text-secondary)] truncate">
            "{selectionInfo.text.substring(0, 50)}
            {selectionInfo.text.length > 50 ? "..." : ""}"
          </div>
          <div className="text-xs text-[var(--text-secondary)] opacity-70 mt-1">
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
});

export default PdfViewer;