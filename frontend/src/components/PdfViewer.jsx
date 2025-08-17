import { useEffect, useState, useRef } from "react";

const PdfViewer = ({ file, onTextSelection, onGenerateAudio }) => {
  const [directSelection, setDirectSelection] = useState("");
  const viewerRef = useRef(null);

  useEffect(() => {
    let mouseUpHandler;
    let selectionTimeout;

    // Fallback text selection handler for when Adobe callback doesn't work
    const handleMouseUp = () => {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 10) {
          const selectedText = selection.toString().trim();
          console.log("Fallback text selection:", selectedText);
          console.log("onTextSelection callback available:", !!onTextSelection);
          setDirectSelection(selectedText);
          
          if (onTextSelection) {
            console.log("Calling onTextSelection with text:", selectedText);
            onTextSelection(selectedText);
          }
        }
      }, 200);
    };


    if (file && window.AdobeDC && window.AdobeDC.View) {
      try {
        console.log("Initializing Adobe PDF Embed API...");
        const adobeDCView = new window.AdobeDC.View({
          clientId: import.meta.env.VITE_ADOBE_CLIENT_ID,
          divId: "adobe-dc-view",
        });
        
        viewerRef.current = adobeDCView;

        const reader = new FileReader();
        reader.onload = function (e) {
          console.log("Loading PDF file...");
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

          // Enable text selection and set up proper selection detection
          previewFilePromise.then(adobeViewer => {
            console.log("PDF loaded, setting up text selection...");
            adobeViewer.getAPIs().then(apis => {
              // Enable text selection
              apis.enableTextSelection(true)
                .then(() => {
                  console.log("Text selection enabled successfully");
                })
                .catch(error => {
                  console.log("Error enabling text selection:", error);
                });

              // Set up proper text selection detection using getSelectedContent
              let lastSelectedText = "";
              let isProcessing = false;
              const checkForSelection = () => {
                if (isProcessing) return; // Prevent overlapping calls
                
                // Skip Adobe API calls that cause issues
                return;
              };


              // Use mouse events as primary detection method since getSelectedContent returns empty
              const handleTextSelection = () => {
                setTimeout(() => {
                  const selection = window.getSelection();
                  if (selection && selection.toString().trim().length > 10) {
                    const selectedText = selection.toString().trim();
                    if (selectedText !== lastSelectedText) {
                      console.log("Mouse selection detected:", selectedText);
                      lastSelectedText = selectedText;
                      setDirectSelection(selectedText);
                      
                      if (onTextSelection) {
                        console.log("Triggering semantic search...");
                        onTextSelection(selectedText);
                      }
                    }
                  }
                }, 100);
              };

              // Add mouse event listeners to PDF container
              setTimeout(() => {
                const pdfContainer = document.getElementById('adobe-dc-view');
                if (pdfContainer) {
                  pdfContainer.addEventListener('mouseup', handleTextSelection);
                  document.addEventListener('mouseup', handleTextSelection);
                  console.log("Added mouse selection listeners");
                }
              }, 2000);

              // Remove periodic checking to prevent reloads
              
            });
          });
          
          // Also register the traditional callback as backup
          adobeDCView.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.TEXT_SELECTION,
            function(event) {
              console.log("Adobe text selection callback:", event);
              if (event.selectedText && event.selectedText.trim().length > 10) {
                const selectedText = event.selectedText.trim();
                console.log("Adobe callback selected text:", selectedText);
                setDirectSelection(selectedText);
                
                if (onTextSelection) {
                  console.log("Triggering semantic search via callback...");
                  onTextSelection(selectedText);
                }
              }
            },
            {}
          );


          // Add multiple fallback event listeners for better text selection detection
          setTimeout(() => {
            const pdfContainer = document.getElementById('adobe-dc-view');
            if (pdfContainer) {
              mouseUpHandler = handleMouseUp;
              
              // Add multiple event types for better coverage
              pdfContainer.addEventListener('mouseup', mouseUpHandler);
              pdfContainer.addEventListener('selectionchange', mouseUpHandler);
              document.addEventListener('mouseup', mouseUpHandler);
              document.addEventListener('selectionchange', mouseUpHandler);
              
              // Also try to find iframe content if Adobe uses iframe
              const checkForIframe = setInterval(() => {
                const iframe = pdfContainer.querySelector('iframe');
                if (iframe) {
                  try {
                    iframe.contentDocument.addEventListener('mouseup', mouseUpHandler);
                    iframe.contentDocument.addEventListener('selectionchange', mouseUpHandler);
                    console.log("Added listeners to PDF iframe");
                    clearInterval(checkForIframe);
                  } catch (e) {
                    console.log("Cannot access iframe content (CORS)");
                  }
                }
              }, 500);
              
              // Clear interval after 10 seconds
              setTimeout(() => clearInterval(checkForIframe), 10000);
              
              console.log("Added comprehensive fallback listeners");
            }
          }, 2000);
        };
        reader.readAsArrayBuffer(file);

      } catch (error) {
        console.error("Error initializing Adobe PDF Embed API:", error);
        // Still add fallback handler even if Adobe fails
        mouseUpHandler = handleMouseUp;
        document.addEventListener('mouseup', mouseUpHandler);
      }
    } else {
      // If Adobe API not available, use fallback
      mouseUpHandler = handleMouseUp;
      document.addEventListener('mouseup', mouseUpHandler);
    }

    // Cleanup function
    return () => {
      if (mouseUpHandler) {
        document.removeEventListener('mouseup', mouseUpHandler);
        document.removeEventListener('selectionchange', mouseUpHandler);
        const pdfContainer = document.getElementById('adobe-dc-view');
        if (pdfContainer) {
          pdfContainer.removeEventListener('mouseup', mouseUpHandler);
          pdfContainer.removeEventListener('selectionchange', mouseUpHandler);
        }
      }
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
    </div>
  );
};

export default PdfViewer;
