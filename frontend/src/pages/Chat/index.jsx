// Chat.jsx - Dedicated Chat Interface
// Clean chat interface with back navigation to dashboard

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceRecording from '../VoiceRecording';
import noxServiceManager from '../../services/noxServiceManager';

const Chat = ({ onBack }) => {
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
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
    <div className="h-screen w-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-2xl transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <img 
            src="/images/Stremly_black.png"
            alt="Nox-Buddy Logo" 
            className="w-8 h-8"
          />
          <div>
            <h1 className="text-lg font-bold text-black">
              Nox Chat
            </h1>
            <p className="text-xs text-gray-500">AI Conversation</p>
          </div>
        </div>
        
        {/* Chat Actions */}
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-2xl transition-colors duration-200">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto scrollable p-6 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-md px-4 py-3 rounded-2xl ${
                message.isSystemMessage
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : message.isBot
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-black text-white'
              }`}
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
      <div className="border-t border-gray-200 p-4">
        {/* Attached Files */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 px-3 py-2 rounded-2xl text-sm bg-gray-100 text-gray-600"
              >
                <span>📎 {file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Box and Buttons */}
        <div className="flex items-end space-x-3">
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-black resize-none text-sm transition-all duration-300"
              rows={1}
              style={{ maxHeight: '100px' }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Attach Button */}
            <button
              onClick={handleFileAttach}
              className="p-3 hover:bg-gray-100 rounded-2xl transition-colors duration-200"
              title="Attach file"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Microphone Button */}
            <button
              onClick={toggleRecording}
              className="p-3 hover:bg-gray-100 rounded-2xl transition-colors duration-200"
              title="Voice input"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() && attachedFiles.length === 0}
              className="p-3 bg-black text-white rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              title="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Recording Modal */}
      <VoiceRecording
        isOpen={showVoiceRecording}
        onClose={handleVoiceRecordingClose}
        isDarkMode={false}
        onTranscriptComplete={handleTranscriptComplete}
      />
    </div>
  );
};

export default Chat;
