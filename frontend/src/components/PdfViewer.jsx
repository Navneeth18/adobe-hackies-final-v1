import { useEffect, useState, useRef } from "react";

const PdfViewer = ({ file, onTextSelection, onGenerateAudio, targetPage }) => {
  const [directSelection, setDirectSelection] = useState("");
  const viewerRef = useRef(null);
  const [selectionInfo, setSelectionInfo] = useState(null);
  const [isViewerReady, setIsViewerReady] = useState(false);

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

          previewFilePromise.then((adobeViewer) => {
            adobeViewer.getAPIs().then((apis) => {
              apis.enableTextSelection(true);
              setIsViewerReady(true);

              // Navigate to target page if specified
              if (targetPage && targetPage > 0) {
                setTimeout(() => {
                  apis.gotoLocation(targetPage).then(() => {
                    console.log(`Navigated to page ${targetPage}`);
                  }).catch((error) => {
                    console.warn(`Failed to navigate to page ${targetPage}:`, error);
                  });
                }, 1000); // Wait for viewer to be fully ready
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
  }, [file, onTextSelection]);

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
