import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Download, Copy, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const MermaidRenderer = ({ mermaidCode, title = "Mindmap" }) => {
  const mermaidRef = useRef(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [svgContent, setSvgContent] = useState('');

  useEffect(() => {
    // Initialize Mermaid with custom configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      mindmap: {
        padding: 10,
        maxNodeSizeX: 300,
        maxNodeSizeY: 150,
        curve: 'basis',
        useMaxWidth: true,
        htmlLabels: true
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: 50,
        rankSpacing: 50
      },
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#2563eb',
        lineColor: '#6b7280',
        secondaryColor: '#e5e7eb',
        tertiaryColor: '#f3f4f6'
      }
    });
  }, []);

  useEffect(() => {
    if (mermaidCode && mermaidRef.current) {
      renderMermaid();
    }
  }, [mermaidCode]);

  const renderMermaid = async () => {
    if (!mermaidCode || !mermaidRef.current) return;

    setIsRendering(true);
    setRenderError(null);

    try {
      // Clear previous content
      mermaidRef.current.innerHTML = '';
      
      // Generate unique ID for this diagram
      const id = `mermaid-${Date.now()}`;
      
      // Validate and render the mermaid diagram
      const { svg } = await mermaid.render(id, mermaidCode);
      
      // Set the SVG content
      mermaidRef.current.innerHTML = svg;
      setSvgContent(svg);
      
      // Apply zoom and fit to container
      const svgElement = mermaidRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.transform = `scale(${zoom})`;
        svgElement.style.transformOrigin = 'center center';
        svgElement.style.width = '100%';
        svgElement.style.height = '100%';
        svgElement.style.maxWidth = '100%';
        svgElement.style.maxHeight = '100%';
        svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      }
      
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      setRenderError(error.message);
      
      // Fallback: show the code if rendering fails
      mermaidRef.current.innerHTML = `
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800 font-medium mb-2">Failed to render diagram</p>
          <p class="text-red-600 text-sm mb-3">${error.message}</p>
          <pre class="text-xs bg-white p-2 rounded border overflow-auto max-h-40">${mermaidCode}</pre>
        </div>
      `;
    } finally {
      setIsRendering(false);
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    const svgElement = mermaidRef.current?.querySelector('svg');
    if (svgElement) {
      svgElement.style.transform = `scale(${newZoom})`;
      svgElement.style.transformOrigin = 'center center';
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.3);
    setZoom(newZoom);
    const svgElement = mermaidRef.current?.querySelector('svg');
    if (svgElement) {
      svgElement.style.transform = `scale(${newZoom})`;
      svgElement.style.transformOrigin = 'center center';
    }
  };

  const handleResetZoom = () => {
    setZoom(1);
    const svgElement = mermaidRef.current?.querySelector('svg');
    if (svgElement) {
      svgElement.style.transform = 'scale(1)';
      svgElement.style.transformOrigin = 'center center';
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mermaidCode).then(() => {
      toast.success('Mermaid code copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const downloadSVG = () => {
    if (!svgContent) {
      toast.error('No diagram to download');
      return;
    }

    try {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mindmap.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Mindmap downloaded as SVG!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download diagram');
    }
  };

  const downloadPNG = async () => {
    if (!svgContent) {
      toast.error('No diagram to download');
      return;
    }

    try {
      // Create a canvas to convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Create blob URL for the SVG
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = img.width * 2; // Higher resolution
        canvas.height = img.height * 2;
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mindmap.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
          URL.revokeObjectURL(url);
          toast.success('Mindmap downloaded as PNG!');
        }, 'image/png');
      };
      
      img.src = url;
    } catch (error) {
      console.error('PNG download error:', error);
      toast.error('Failed to download as PNG');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Zoom: {Math.round(zoom * 100)}%
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleResetZoom}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleZoomIn}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          
          {/* Copy & Download Controls */}
          <button
            onClick={copyToClipboard}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Copy Code"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <div className="relative group">
            <button
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            
            {/* Download Dropdown */}
            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={downloadSVG}
                className="block w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Download SVG
              </button>
              <button
                onClick={downloadPNG}
                className="block w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Download PNG
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mermaid Diagram Container */}
      <div className="flex-1 overflow-auto p-4">
        {isRendering && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Rendering diagram...</span>
          </div>
        )}
        
        <div 
          ref={mermaidRef}
          className="w-full h-full flex items-center justify-center overflow-auto"
          style={{ 
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-in-out',
            minHeight: '500px'
          }}
        />
        
        {renderError && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> If the visual diagram doesn't render properly, 
              you can still use the text-based mindmap code for external tools.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MermaidRenderer;
