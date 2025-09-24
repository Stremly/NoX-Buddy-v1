// Homepage.jsx - Nox-Buddy Main Chat Interface
// Professional chat interface with McKinsey blue theme

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Settings from '../Settings';
import VoiceRecording from '../VoiceRecording';
import noxServiceManager from '../../services/noxServiceManager';

const Homepage = () => {
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [showPlatformNotice, setShowPlatformNotice] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Nox-Buddy, your desktop companion. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);

  // Check platform compatibility on component mount
  useEffect(() => {
    const platformMessage = noxServiceManager.getPlatformMessage();
    if (platformMessage) {
      setShowPlatformNotice(true);
      // Add platform notice to messages
      setTimeout(() => {
        setMessages(prev => {
          // Check if system message already exists
          const hasSystemMessage = prev.some(msg => msg.isSystemMessage);
          if (hasSystemMessage) {
            return prev; // Don't add duplicate
          }
          
          return [...prev, {
            id: Date.now(),
            text: platformMessage,
            isBot: true,
            isSystemMessage: true,
            timestamp: new Date()
          }];
        });
      }, 1000);
    }
  }, []);


  const handleSendMessage = async () => {
    if (inputText.trim() || attachedFiles.length > 0) {
      const userMessage = {
        id: Date.now(),
        text: inputText,
        files: [...attachedFiles],
        isBot: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      const messageText = inputText;
      setInputText('');
      setAttachedFiles([]);
      
      // Show typing indicator
      const typingMessage = {
        id: Date.now() + 1,
        text: "Nox is thinking...",
        isBot: true,
        isTyping: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, typingMessage]);
      
      try {
        // Send message to Nox service
        const response = await noxServiceManager.sendMessage(messageText);
        
        // Remove typing indicator and add real response
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.isTyping);
          return [...filtered, {
            id: Date.now() + 2,
            text: response || "I'm here to help! Could you please rephrase your question?",
            isBot: true,
            timestamp: new Date()
          }];
        });
        
      } catch (error) {
        console.error('Error getting response from Nox:', error);
        
        // Remove typing indicator and show error message
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.isTyping);
          return [...filtered, {
            id: Date.now() + 2,
            text: "I'm having trouble connecting right now. Please try again in a moment.",
            isBot: true,
            timestamp: new Date()
          }];
        });
      }
    }
  };

  const handleFileAttach = () => {
    console.log('File attach clicked');
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      setAttachedFiles([...attachedFiles, ...files]);
    };
    input.click();
  };

  const removeFile = (index) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    setShowVoiceRecording(true);
  };

  const handleVoiceRecordingClose = () => {
    setShowVoiceRecording(false);
    console.log('Voice recording completed');
  };

  const handleTranscriptComplete = (transcript) => {
    if (transcript && transcript.trim()) {
      setInputText(transcript.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <div className={`h-screen w-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <img 
            src={isDarkMode ? "/images/Stremly White Logo.png" : "/images/Stremly_black.png"}
            alt="Nox-Buddy Logo" 
            className="w-8 h-8 opacity-90"
          />
          <div>
            <h1 
              className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              style={{ 
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              Nox-Buddy
            </h1>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your Desktop Companion</p>
          </div>
        </div>
        
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className={`p-2 rounded-3xl transition-all duration-200 ${
            isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto scrollable p-4 space-y-4 mt-2">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-3xl ${
                message.isSystemMessage
                  ? isDarkMode ? 'bg-blue-900/30 text-blue-300 border border-blue-500/30' : 'bg-blue-50 text-blue-800 border border-blue-200'
                  : message.isBot
                  ? isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
                  : 'text-white'
              }`}
              style={!message.isBot && !message.isSystemMessage ? { backgroundColor: '#1B365D' } : {}}
            >
              {message.isTyping ? (
                <div className="flex items-center space-x-1">
                  <p className="text-sm">{message.text}</p>
                  <div className="flex space-x-1 ml-2">
                    <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{message.text}</p>
              )}
              {message.files && message.files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.files.map((file, index) => (
                    <div key={index} className="text-xs opacity-75">
                      📎 {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

        {/* Input Area */}
        <div className={`border-t p-3 mt-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 px-3 py-2 rounded-3xl text-sm ${
                  isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span>📎 {file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className={`${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Box and Buttons */}
        <div className="flex items-end space-x-2">
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className={`w-full px-3 py-2.5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none text-sm ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-gray-400'
              }`}
              rows={1}
              style={{ maxHeight: '100px' }}
            />
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex items-center space-x-1.5">
            {/* Attach Button */}
            <button
              onClick={handleFileAttach}
              className={`p-2.5 rounded-2xl transition-all duration-300 ease-in-out transform hover:scale-105 ${
                isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Attach file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Microphone Button */}
            <button
              onClick={toggleRecording}
              className={`p-2.5 rounded-2xl transition-all duration-300 ease-in-out transform hover:scale-105 ${
                isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Voice input"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() && attachedFiles.length === 0}
              className="p-2.5 rounded-2xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: '#1B365D', color: 'white' }}
              title="Send message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <Settings 
            onClose={() => setShowSettings(false)}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        )}
      </AnimatePresence>

      {/* Voice Recording Modal */}
      <VoiceRecording
        isOpen={showVoiceRecording}
        onClose={handleVoiceRecordingClose}
        isDarkMode={isDarkMode}
        onTranscriptComplete={handleTranscriptComplete}
      />
    </>
  );
};

export default Homepage;
