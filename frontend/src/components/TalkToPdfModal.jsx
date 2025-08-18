import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const TalkToPdfModal = ({ isOpen, onClose, clusterId, documentIds }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const conversationEndRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!isOpen) return;

    // Check for speech recognition support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setCurrentTranscript(transcript);
      
      // If result is final, process the query
      if (event.results[event.results.length - 1].isFinal) {
        handleVoiceQuery(transcript);
      }
    };

    recognitionRef.current.onerror = (event) => {
      setIsListening(false);
      setError(`Speech recognition error: ${event.error}`);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    
    setCurrentTranscript('');
    setError(null);
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      setError('Failed to start speech recognition. Please try again.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleVoiceQuery = async (transcript) => {
    if (!transcript.trim()) return;

    setCurrentTranscript('');
    setIsProcessing(true);

    // Add user message to conversation
    const userMessage = {
      type: 'user',
      content: transcript,
      timestamp: new Date().toLocaleTimeString()
    };
    setConversation(prev => [...prev, userMessage]);

    try {
      // Send query to backend chat endpoint
      const response = await fetch('http://localhost:8000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: transcript,
          cluster_id: clusterId,
          document_ids: documentIds
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add AI response to conversation
      const aiMessage = {
        type: 'ai',
        content: data.answer,
        timestamp: new Date().toLocaleTimeString(),
        relevantSections: data.relevant_sections || []
      };
      setConversation(prev => [...prev, aiMessage]);

      // Speak the response
      speakResponse(data.answer);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        type: 'ai',
        content: 'I encountered an error while processing your question. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setConversation(prev => [...prev, errorMessage]);
      toast.error('Failed to process your question');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text) => {
    if (!text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
    synthRef.current = utterance;
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const clearConversation = () => {
    setConversation([]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🎤 Talk to PDF
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={clearConversation}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              disabled={conversation.length === 0}
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">🎙️</div>
              <p>Click the microphone button below to start asking questions about your documents!</p>
            </div>
          )}

          {conversation.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.isError
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">{message.timestamp}</div>
              </div>
            </div>
          ))}

          {/* Current transcript display */}
          {currentTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[80%] p-3 rounded-lg bg-blue-200 text-blue-800 border-2 border-blue-300">
                <div className="text-sm">{currentTranscript}</div>
                <div className="text-xs opacity-70 mt-1">Speaking...</div>
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={conversationEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        {/* Voice Controls */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-center gap-4">
            {/* Voice Wave Animation */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 bg-blue-500 rounded-full transition-all duration-300 ${
                    isListening || isSpeaking
                      ? 'animate-pulse h-8'
                      : 'h-2'
                  }`}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: isListening || isSpeaking 
                      ? `${Math.random() * 20 + 10}px` 
                      : '8px'
                  }}
                />
              ))}
            </div>

            {/* Main Control Button */}
            {!isListening && !isProcessing && !isSpeaking && (
              <button
                onClick={startListening}
                className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
                disabled={!!error}
              >
                🎤
              </button>
            )}

            {isListening && (
              <button
                onClick={stopListening}
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg animate-pulse"
              >
                ⏹️
              </button>
            )}

            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg animate-pulse"
              >
                🔇
              </button>
            )}

            {isProcessing && (
              <div className="bg-gray-400 text-white p-4 rounded-full shadow-lg">
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Status Text */}
          <div className="text-center mt-2 text-sm text-gray-600">
            {isListening && 'Listening... Speak now!'}
            {isProcessing && 'Processing your question...'}
            {isSpeaking && 'Speaking response...'}
            {!isListening && !isProcessing && !isSpeaking && 'Click microphone to ask a question'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalkToPdfModal;
