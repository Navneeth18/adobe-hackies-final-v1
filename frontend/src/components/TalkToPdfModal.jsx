import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const TalkToPdfModal = ({ isOpen, onClose, clusterId, documentIds }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState('voice'); // 'voice' or 'text'
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

  const handleQuery = async (queryText) => {
    if (!queryText.trim()) return;

    setCurrentTranscript('');
    setTextInput('');
    setIsProcessing(true);

    // Add user message to conversation
    const userMessage = {
      type: 'user',
      content: queryText,
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
          query: queryText,
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

  const handleVoiceQuery = async (transcript) => {
    await handleQuery(transcript);
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    await handleQuery(textInput);
  };

  const speakResponse = async (text) => {
    if (!text) return;

    setIsSpeaking(true);

    try {
      // Generate TTS audio using Azure TTS
      const response = await fetch('http://localhost:8000/api/v1/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: 'en-US-JennyNeural'
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS generation failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.audio_url) {
        // Create audio element and play
        const audio = new Audio(data.audio_url);
        synthRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          console.error('Audio playback error');
        };

        audio.onpause = () => {
          setIsPaused(true);
        };

        audio.onplay = () => {
          setIsPaused(false);
        };

        await audio.play();
      } else {
        throw new Error(data.error || 'Failed to generate TTS audio');
      }

    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      // Fallback to browser TTS if Azure TTS fails
      fallbackToWebSpeech(text);
    }
  };

  const fallbackToWebSpeech = (text) => {
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

  const pauseSpeaking = () => {
    if (synthRef.current && synthRef.current instanceof Audio) {
      synthRef.current.pause();
      setIsPaused(true);
    } else if (synthRef.current) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if (synthRef.current && synthRef.current instanceof Audio) {
      synthRef.current.play();
      setIsPaused(false);
    } else if (synthRef.current) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      if (synthRef.current instanceof Audio) {
        synthRef.current.pause();
        synthRef.current.currentTime = 0;
      } else {
        window.speechSynthesis.cancel();
      }
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const clearConversation = () => {
    setConversation([]);
    setError(null);
    stopSpeaking();
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === 'voice' ? 'text' : 'voice');
    setTextInput('');
    setCurrentTranscript('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {inputMode === 'voice' ? '🎤' : '💬'} Talk to PDF
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleInputMode}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                inputMode === 'voice' 
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              title={`Switch to ${inputMode === 'voice' ? 'text' : 'voice'} mode`}
            >
              {inputMode === 'voice' ? '💬 Text' : '🎤 Voice'}
            </button>
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

        {/* Input Controls */}
        <div className="p-4 border-t bg-gray-50">
          {inputMode === 'text' ? (
            /* Text Input Mode */
            <form onSubmit={handleTextSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your question about the documents..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isProcessing}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    !textInput.trim() || isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isProcessing ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    '📤'
                  )}
                </button>
              </div>
              
              {/* Audio Controls for Text Mode */}
              {isSpeaking && (
                <div className="flex items-center justify-center gap-2">
                  {!isPaused ? (
                    <button
                      onClick={pauseSpeaking}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                    >
                      ⏸️ Pause
                    </button>
                  ) : (
                    <button
                      onClick={resumeSpeaking}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                    >
                      ▶️ Resume
                    </button>
                  )}
                  <button
                    onClick={stopSpeaking}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                  >
                    ⏹️ Stop
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* Voice Input Mode */
            <div className="space-y-3">
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

                {isProcessing && (
                  <div className="bg-gray-400 text-white p-4 rounded-full shadow-lg">
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Audio Controls for Voice Mode */}
              {isSpeaking && (
                <div className="flex items-center justify-center gap-2">
                  {!isPaused ? (
                    <button
                      onClick={pauseSpeaking}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                    >
                      ⏸️ Pause
                    </button>
                  ) : (
                    <button
                      onClick={resumeSpeaking}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                    >
                      ▶️ Resume
                    </button>
                  )}
                  <button
                    onClick={stopSpeaking}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                  >
                    ⏹️ Stop
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status Text */}
          <div className="text-center mt-2 text-sm text-gray-600">
            {inputMode === 'text' ? (
              isProcessing ? 'Processing your question...' : 
              isSpeaking ? (isPaused ? 'Audio paused' : 'Playing response...') :
              'Type your question and press enter'
            ) : (
              isListening ? 'Listening... Speak now!' :
              isProcessing ? 'Processing your question...' :
              isSpeaking ? (isPaused ? 'Audio paused' : 'Playing response...') :
              'Click microphone to ask a question'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalkToPdfModal;
