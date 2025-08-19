import React, { useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const SelectedTextPodcast = ({ 
  selectedText, 
  documentId = null, 
  sectionTitle = null, 
  pageNumber = null,
  onClose 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [podcastData, setPodcastData] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const handleGeneratePodcast = async () => {
    if (!selectedText || selectedText.trim().length < 10) {
      toast.error("Please select more text to generate a meaningful podcast");
      return;
    }

    setIsGenerating(true);
    setPodcastData(null);
    setAudioUrl(null);

    try {
      toast.loading("Generating comprehensive podcast with insights...");
      
      const result = await apiService.generateSelectedTextPodcast(
        selectedText,
        documentId,
        sectionTitle,
        pageNumber
      );

      if (result.success && result.audio_id) {
        setPodcastData(result);
        setAudioUrl(`http://localhost:8000/api/v1/audio/serve-selected-text/${result.audio_id}`);
        
        toast.dismiss();
        toast.success(
          `Podcast generated! Includes ${result.sections_included} related sections and ${result.insights_count} insights.`
        );
      } else {
        throw new Error(result.error || "Failed to generate podcast");
      }
    } catch (error) {
      console.error("Failed to generate selected text podcast:", error);
      toast.dismiss();
      toast.error(`Failed to generate podcast: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl && podcastData) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `selected_text_podcast_${podcastData.audio_id}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Podcast download started!");
    }
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          🎧 Selected Text Overview
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Selected Text Preview */}
      <div className="mb-4">
        <p className="text-sm text-[var(--text-secondary)] mb-2">Selected Text:</p>
        <div className="bg-[var(--bg)] border border-[var(--border-color)] rounded p-3 max-h-32 overflow-y-auto">
          <p className="text-sm text-[var(--text-primary)]">
            {selectedText.length > 200 ? `${selectedText.substring(0, 200)}...` : selectedText}
          </p>
        </div>
        {documentId && (
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {sectionTitle && `Section: ${sectionTitle}`}
            {pageNumber && ` • Page ${pageNumber}`}
          </p>
        )}
      </div>

      {/* Generate Button */}
      <div className="mb-4">
        <button
          onClick={handleGeneratePodcast}
          disabled={isGenerating || !selectedText}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isGenerating || !selectedText
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 shadow-lg"
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating Comprehensive Overview...
            </span>
          ) : (
            "🎙️ Generate Overview"
          )}
        </button>
        
        <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">
          Includes current section, relevant sections, and cross-document insights
        </p>
      </div>

      {/* Podcast Results */}
      {podcastData && (
        <div className="border-t border-[var(--border-color)] pt-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
              📊 Podcast Details
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-[var(--bg)] rounded p-2">
                <span className="text-[var(--text-secondary)]">Related Sections:</span>
                <span className="text-[var(--text-primary)] font-medium ml-1">
                  {podcastData.sections_included}
                </span>
              </div>
              <div className="bg-[var(--bg)] rounded p-2">
                <span className="text-[var(--text-secondary)]">Insights Found:</span>
                <span className="text-[var(--text-primary)] font-medium ml-1">
                  {podcastData.insights_count}
                </span>
              </div>
            </div>
          </div>

          {/* Script Preview */}
          {podcastData.script_preview && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                📝 Script Preview
              </h4>
              <div className="bg-[var(--bg)] border border-[var(--border-color)] rounded p-3 max-h-24 overflow-y-auto">
                <p className="text-xs text-[var(--text-secondary)]">
                  {podcastData.script_preview}
                </p>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                🎵 Generated Overview
              </h4>
              <div className="bg-[var(--bg)] border border-[var(--border-color)] rounded p-3">
                <audio 
                  controls 
                  className="w-full mb-3"
                  preload="metadata"
                >
                  <source src={audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-2 px-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    📥 Download audio
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share && audioUrl) {
                        navigator.share({
                          title: 'Selected Text Podcast',
                          text: 'Check out this AI-generated podcast from selected text!',
                          url: audioUrl
                        });
                      } else {
                        navigator.clipboard.writeText(audioUrl);
                        toast.success("Audio URL copied to clipboard!");
                      }
                    }}
                    className="py-2 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    📤 Share
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feature Description */}
      {!podcastData && (
        <div className="border-t border-[var(--border-color)] pt-4">
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
            ✨ What's Included
          </h4>
          <ul className="text-xs text-[var(--text-secondary)] space-y-1">
            <li>• Current section context and analysis</li>
            <li>• Related sections from the same document</li>
            <li>• Cross-document insights and connections</li>
            <li>• AI-generated contextual analysis</li>
            <li>• Professional podcast-style narration</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SelectedTextPodcast;
