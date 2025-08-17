import { useEffect, useState, useRef } from "react";

const PdfViewer = ({ file, onTextSelection, onGenerateAudio }) => {
  const [showTextInput, setShowTextInput] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [directSelection, setDirectSelection] = useState("");
  const viewerRef = useRef(null);

  useEffect(() => {
    if (file && window.AdobeDC && window.AdobeDC.View) {
      try {
        console.log("Initializing Adobe PDF Embed API...");
        const adobeDCView = new window.AdobeDC.View({
          clientId: import.meta.env.VITE_ADOBE_CLIENT_ID, // replace with your key

          divId: "adobe-dc-view",
        });
        
        viewerRef.current = adobeDCView;

        const reader = new FileReader();
        reader.onload = function (e) {
          console.log("Loading PDF file...");
          adobeDCView.previewFile(
            {
              content: { promise: Promise.resolve(e.target.result) },
              metaData: { fileName: file.name },
            },
            {
              embedMode: "SIZED_CONTAINER",
              showDownloadPDF: true,
              showPrintPDF: true,
              enableFormFilling: false,
              enableTextSelection: true,
            }
          );
          
          // Register text selection event handler
          adobeDCView.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.TEXT_SELECTION,
            function(event) {
              if (event.selectedText && event.selectedText.trim().length > 0) {
                setDirectSelection(event.selectedText);
                // Show a floating action button near the selection
                showSelectionActionButton(event.selectedText);
              }
            }
          );
        };
        reader.readAsArrayBuffer(file);

        // Function to show floating action button near text selection
        const showSelectionActionButton = (text) => {
          // Remove any existing selection buttons
          const existingButtons = document.querySelectorAll('.selection-action-button');
          existingButtons.forEach(btn => btn.remove());
          
          // Get selection coordinates
          const selection = window.getSelection();
          if (!selection.rangeCount) return;
          
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Create floating action button
          const button = document.createElement('div');
          button.className = 'selection-action-button fixed z-[10000] flex gap-2';
          button.style.top = `${rect.bottom + 10}px`;
          button.style.left = `${rect.left + (rect.width / 2) - 100}px`;
          
          // Find related content button
          const findRelatedBtn = document.createElement('button');
          findRelatedBtn.textContent = '🔍 Find Related';
          findRelatedBtn.className = 'bg-[var(--highlight)] text-white px-3 py-2 rounded shadow-lg hover:bg-[var(--highlight-hover)] transition-colors text-sm';
          findRelatedBtn.onclick = () => {
            if (onTextSelection) {
              onTextSelection(text);
            }
            document.querySelectorAll('.selection-action-button').forEach(btn => btn.remove());
          };
          
          // Generate audio button
          const audioBtn = document.createElement('button');
          audioBtn.textContent = '🔊 Generate Audio';
          audioBtn.className = 'bg-[var(--highlight)] text-white px-3 py-2 rounded shadow-lg hover:bg-[var(--highlight-hover)] transition-colors text-sm';
          audioBtn.onclick = () => {
            if (onGenerateAudio) {
              onGenerateAudio(text);
            }
            document.querySelectorAll('.selection-action-button').forEach(btn => btn.remove());
          };
          
          button.appendChild(findRelatedBtn);
          button.appendChild(audioBtn);
          document.body.appendChild(button);
          
          // Remove button when clicking elsewhere
          const removeButton = (e) => {
            if (!button.contains(e.target)) {
              button.remove();
              document.removeEventListener('mousedown', removeButton);
            }
          };
          
          setTimeout(() => {
            document.addEventListener('mousedown', removeButton);
          }, 100);
        };
        
        // Add a button for manual text selection (fallback)
        const addSelectionButton = () => {
          console.log("Adding search button...");
          // Remove existing button if it exists
          const existingButton = document.getElementById('pdf-search-button');
          if (existingButton) {
            existingButton.remove();
          }

          const button = document.createElement('button');
          button.id = 'pdf-search-button';
          button.textContent = '🔍 Search Text';
          button.className = 'fixed top-4 right-4 z-50 bg-[var(--highlight)] text-white px-4 py-2 rounded shadow-lg hover:bg-[var(--highlight-hover)] transition-colors cursor-pointer';
          button.style.zIndex = '9999';
          button.onclick = () => {
            setShowTextInput(true);
          };
          
          document.body.appendChild(button);
          console.log("Search button added successfully");
        };

        // Add the selection button after a short delay (as fallback)
        setTimeout(addSelectionButton, 2000);

      } catch (error) {
        console.error("Error initializing Adobe PDF Embed API:", error);
      }
    } else {
      console.warn("Adobe PDF Embed API not available");
      console.log("window.AdobeDC:", window.AdobeDC);
      console.log("window.AdobeDC.View:", window.AdobeDC?.View);
    }

    // Cleanup function to remove buttons when component unmounts
    return () => {
      const button = document.getElementById('pdf-search-button');
      if (button) {
        button.remove();
      }
      
      // Remove any selection action buttons
      document.querySelectorAll('.selection-action-button').forEach(btn => btn.remove());
    };
  }, [file, onTextSelection]);

  const handleSearch = () => {
    if (selectedText.trim()) {
      console.log("Searching for text:", selectedText);
      if (onTextSelection) {
        onTextSelection(selectedText);
      }
      setShowTextInput(false);
      setSelectedText("");
    } else {
      alert("Please enter some text to search for.");
    }
  };

  return (
    <div className="relative w-full h-full">
      <div id="adobe-dc-view" className="w-full h-full"></div>
      
      {/* Text Input Modal */}
      {showTextInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-[var(--card-bg)] rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Search for Text</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Select text from the PDF, copy it, and paste it here to search for related content across your documents.
            </p>
            
            <textarea
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
              placeholder="Paste your selected text here..."
              className="w-full h-32 p-3 border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--highlight)]"
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSearch}
                className="flex-1 bg-[var(--highlight)] text-white px-4 py-2 rounded hover:bg-[var(--highlight-hover)] transition-colors"
              >
                🔍 Search
              </button>
              <button
                onClick={() => {
                  setShowTextInput(false);
                  setSelectedText("");
                }}
                className="flex-1 bg-[var(--button-secondary-bg)] text-[var(--text-primary)] px-4 py-2 rounded hover:bg-[var(--button-secondary-hover)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
