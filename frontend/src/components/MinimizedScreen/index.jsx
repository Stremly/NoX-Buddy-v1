// MinimizedScreen.jsx - Single Spotlight-like Search Bar Interface
// Clean, unified search bar design similar to macOS Spotlight

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MinimizedScreen = ({
  inputText,
  setInputText,
  onSendMessage,
  onRestore,
  isVoiceRecording,
  isScreenRecording,
  toggleVoiceRecording,
  toggleScreenRecording,
  onKeyPress,
  isExpanded,
  setIsExpanded,
  minimizedMessages,
  autoResizeWindow
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isFloatingCircle, setIsFloatingCircle] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState(null);
  const [circlePosition, setCirclePosition] = useState({ x: 15, y: 85 }); // Default to bottom-left
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimer, setHoverTimer] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);

  // Clear attached files when sending message
  const handleSendWithClear = () => {
    onSendMessage();
    setAttachedFiles([]);
  };

  // Timer for inactivity detection (6 seconds for spotlight mode only)
  const INACTIVITY_TIMEOUT = 6000; // 6 seconds
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isReceivingResponse, setIsReceivingResponse] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    // Only set timer if we're in spotlight mode (not expanded or floating)
    // AND user is not actively interacting
    if (!isExpanded && !isFloatingCircle && !isUserTyping && !isReceivingResponse && !isFocused) {
      const timer = setTimeout(() => {
        // Double-check user isn't actively interacting before transitioning
        if (!isUserTyping && !isReceivingResponse && !isFocused) {
          console.log('⏰ Auto-minimizing to floating circle due to inactivity');
          setIsFloatingCircle(true);
        } else {
          console.log('⏰ Auto-minimize cancelled - user is active');
        }
      }, INACTIVITY_TIMEOUT);
      setInactivityTimer(timer);
    }
  };

  // Start inactivity timer ONLY when in spotlight mode (not expanded conversation)
  useEffect(() => {
    if (!isExpanded && !isFloatingCircle) {
      resetInactivityTimer();
    } else {
      // Clear any existing timer when in expanded mode - no auto-minimize in conversation
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        setInactivityTimer(null);
      }
    }
    
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
      if (window.typingTimer) {
        clearTimeout(window.typingTimer);
      }
    };
  }, [isExpanded, isFloatingCircle]);

  // Handle transition to floating circle mode (only on initial transition)
  useEffect(() => {
    if (isFloatingCircle) {
      // Reset hover state to ensure circle starts collapsed
      setIsHovered(false);
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        setHoverTimer(null);
      }
      
      if (window.electronAPI) {
        // Only resize window when first entering floating circle mode
        window.electronAPI.resizeWindowForFloatingCircle(circlePosition)
          .then(result => {
            if (result.success) {
              console.log('✅ Electron window resized for floating circle');
            } else {
              console.error('❌ Failed to resize window for floating circle:', result.error);
            }
          })
          .catch(error => {
            console.error('❌ Error calling resizeWindowForFloatingCircle:', error);
          });
      }
    }
  }, [isFloatingCircle]);

  // Auto-resize window when messages change
  useEffect(() => {
    if (isExpanded && minimizedMessages.length > 0) {
      autoResizeWindow(minimizedMessages.length);
      
      // Auto-scroll to bottom when new message is added
      setTimeout(() => {
        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
        }
      }, 150);
    }
  }, [minimizedMessages.length, isExpanded, autoResizeWindow]);

  // Enhanced user interaction handler
  const handleUserInteraction = () => {
    setLastActivityTime(Date.now());
    resetInactivityTimer();
  };

  // Handle typing detection with proper timing
  const handleTypingActivity = () => {
    setIsUserTyping(true);
    handleUserInteraction();
    
    // Clear any existing typing timer
    if (window.typingTimer) {
      clearTimeout(window.typingTimer);
    }
    
    // Set new timer to mark typing as stopped after 2 seconds of inactivity
    window.typingTimer = setTimeout(() => {
      setIsUserTyping(false);
      resetInactivityTimer();
    }, 2000); // 2 seconds after last keystroke
  };

  // Debug: Log activity states (remove in production)
  useEffect(() => {
    console.log('🔍 Activity State:', {
      isUserTyping,
      isReceivingResponse,
      isFocused,
      hasText: inputText.length > 0,
      isExpanded,
      isFloatingCircle,
      isDragging
    });
  }, [isUserTyping, isReceivingResponse, isFocused, inputText, isExpanded, isFloatingCircle, isDragging]);

  // Global mouse up listener to handle drag end outside the circle
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setTimeout(() => setIsDragging(false), 200);
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  // Monitor messages for response detection
  useEffect(() => {
    if (minimizedMessages && minimizedMessages.length > 0) {
      const lastMessage = minimizedMessages[minimizedMessages.length - 1];
      if (lastMessage.sender === 'assistant') {
        setIsReceivingResponse(true);
        // Clear response state after message is fully received
        setTimeout(() => {
          setIsReceivingResponse(false);
          resetInactivityTimer();
        }, 2000); // 2 seconds after receiving response
      }
    }
  }, [minimizedMessages]);

  // Handle floating circle click to return to spotlight
  const handleFloatingCircleClick = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.resizeWindowFromFloatingCircle();
        if (result.success) {
          console.log('✅ Electron window resized from floating circle to spotlight');
        } else {
          console.error('❌ Failed to resize window from floating circle:', result.error);
        }
      } catch (error) {
        console.error('❌ Error calling resizeWindowFromFloatingCircle:', error);
      }
    }
    
    setIsFloatingCircle(false);
    resetInactivityTimer();
  };

  // Handle click detection for double-click (works with drag region)
  const handleCircleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (clickTimer) {
      clearTimeout(clickTimer);
    }
    
    if (newCount === 2) {
      // Double-click detected
      console.log('🖱️ Double-click detected on floating circle');
      handleFloatingCircleClick();
      setClickCount(0);
      return;
    }
    
    const timer = setTimeout(() => {
      setClickCount(0);
    }, 300); // 300ms window for double-click
    
    setClickTimer(timer);
  };

  // Handle hover with delay
  const handleMouseEnter = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Don't collapse if currently dragging
    if (isDragging) {
      return;
    }
    
    // Add delay before collapsing
    const timer = setTimeout(() => {
      // Double-check we're not dragging before collapsing
      if (!isDragging) {
        setIsHovered(false);
      }
    }, 1000); // 1s delay before collapsing
    setHoverTimer(timer);
  };




  // Render floating circle separately from main container
  if (isFloatingCircle) {
    console.log('🔵 Rendering floating circle mode');
    return (
      <div className="w-full h-full flex items-center justify-center floating-circle">
        <div
          className="relative p-2"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            className="cursor-move flex items-center justify-center relative overflow-hidden"
          style={{
            height: '70px',
            userSelect: 'none',
            WebkitAppRegion: 'drag',
            border: 'none',
            outline: 'none',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          animate={{
            width: isHovered ? '240px' : '70px',
            borderRadius: isHovered ? '35px' : '50%',
            scale: isDragging ? 1.05 : 1,
            opacity: isDragging ? 0.9 : 1
          }}
          transition={{ 
            duration: isHovered ? 0.4 : 0.3, 
            ease: isHovered ? "easeOut" : "easeIn",
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          onMouseDown={() => {
            setIsDragging(true);
            setDragStartTime(Date.now());
          }}
          onMouseUp={() => {
            const dragDuration = Date.now() - (dragStartTime || 0);
            // Only consider it a drag if mouse was down for more than 100ms
            if (dragDuration > 100) {
              setTimeout(() => setIsDragging(false), 200); // Small delay to prevent immediate collapse
            } else {
              setIsDragging(false);
            }
          }}
          onClick={handleCircleClick}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          {/* Logo - always visible */}
          <motion.div
            className="flex items-center justify-center"
            animate={{
              x: isHovered ? -85 : 0
            }}
            transition={{ 
              duration: 0.4, 
              ease: "easeOut",
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          >
            <img 
              src="/images/Stremly White Logo.png" 
              alt="Nox-Buddy" 
              className="w-18 h-18 object-contain pointer-events-none"
              draggable={false}
              style={{ border: 'none', outline: 'none' }}
            />
          </motion.div>

          {/* Action buttons - only visible on hover */}
          <motion.div
            className="absolute right-4 flex items-center space-x-4"
            initial={{ opacity: 0, x: 30, scale: 0.8 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              x: isHovered ? 0 : 30,
              scale: isHovered ? 1 : 0.8
            }}
            transition={{ 
              duration: 0.4, 
              ease: "easeOut",
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: isHovered ? 0.1 : 0
            }}
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            {/* Voice Recording Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleVoiceRecording();
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 ${
                isVoiceRecording 
                  ? 'bg-white text-black shadow-white/20' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
              title="Toggle Voice Recording"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>

            {/* Screen Recording Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleScreenRecording();
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 ${
                isScreenRecording 
                  ? 'bg-white text-black shadow-white/20' 
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
              title="Toggle Screen Recording"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l3.5 2L16 12V8l-3.5 2L9 8v4zm8-8H7c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
              </svg>
            </button>

            {/* Expand to Spotlight Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFloatingCircleClick();
              }}
              className="w-10 h-10 rounded-full bg-gray-800 text-white hover:bg-gray-700 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
              title="Expand to Spotlight"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10v10M7 17L17 7" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50"
      style={{ 
        background: 'rgba(0, 0, 0, 0.02)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      {/* Single Spotlight Search Bar Mode */}
      <AnimatePresence>
        {!isExpanded && !isFloatingCircle && (
          <motion.div 
            className="w-full h-full relative"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              scale: 0.95,
              transition: { duration: 0.2, ease: "easeInOut" }
            }}
            onMouseMove={handleUserInteraction}
            onClick={handleUserInteraction}
          >
          {/* Main Container - Single Unified Search Bar */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Single Spotlight Search Bar */}
            <motion.div 
              className="relative bg-white/98 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:bg-white"
              style={{ width: '600px', height: '64px' }}
              animate={{
                boxShadow: isFocused 
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(59, 130, 246, 0.4)' 
                  : '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="w-full h-full flex items-center px-6">
                {/* Search Icon */}
                <svg className="w-5 h-5 text-gray-400 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                
                {/* Input Field */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    handleTypingActivity();
                  }}
                  onKeyPress={(e) => {
                    onKeyPress(e);
                    handleTypingActivity();
                  }}
                  onFocus={() => {
                    setIsFocused(true);
                    handleUserInteraction();
                  }}
                  onBlur={() => {
                    setIsFocused(false);
                    // Don't immediately reset timer on blur, user might still be interacting
                  }}
                  onInput={handleTypingActivity}
                  onKeyDown={handleTypingActivity}
                  placeholder="Ask Nox anything..."
                  className="flex-1 bg-transparent text-lg focus:outline-none placeholder-gray-400 text-gray-800 h-full font-medium"
                  autoFocus
                />
                
                {/* Action Buttons Container */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* Voice Recording Button */}
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleVoiceRecording();
                      handleUserInteraction();
                    }}
                    className={`relative p-2.5 rounded-2xl transition-all duration-300 cursor-pointer ${
                      isVoiceRecording 
                        ? 'bg-black text-white shadow-lg' 
                        : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 hover:text-gray-800'
                    }`}
                    title={isVoiceRecording ? 'Voice recording active - Click to stop' : 'Click to start voice recording'}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Recording indicator - subtle white dot */}
                    {isVoiceRecording && (
                      <motion.div
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-full"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    
                    <svg className="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  </motion.button>

                  {/* Screen Recording Button */}
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleScreenRecording();
                      handleUserInteraction();
                    }}
                    className={`relative p-2.5 rounded-2xl transition-all duration-300 cursor-pointer ${
                      isScreenRecording 
                        ? 'bg-black text-white shadow-lg' 
                        : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 hover:text-gray-800'
                    }`}
                    title={isScreenRecording ? 'Screen recording active - Click to stop' : 'Click to start screen recording'}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Recording indicator - subtle white dot */}
                    {isScreenRecording && (
                      <motion.div
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-full"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    
                    <svg className="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l3.5 2L16 12V8l-3.5 2L9 8v4zm8-8H7c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </motion.button>

                  {/* Minimize to Circle Button */}
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFloatingCircle(true);
                      handleUserInteraction();
                    }}
                    className="relative p-2.5 bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 hover:text-gray-800 rounded-2xl transition-all duration-300 cursor-pointer"
                    title="Minimize to floating circle"
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>
                  </motion.button>

                  {/* Expand to Conversation Button */}
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRestore();
                    }}
                    className="relative p-2.5 bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 hover:text-gray-800 rounded-2xl transition-all duration-300 cursor-pointer"
                    title="Expand to full dashboard"
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10v10M7 17L17 7" />
                    </svg>
                  </motion.button>

                  {/* Send Button - appears when typing */}
                  <AnimatePresence>
                    {inputText && (
                      <motion.button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSendMessage();
                          handleUserInteraction();
                        }}
                        className="relative p-2.5 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center"
                        title="Send message"
                        initial={{ opacity: 0, scale: 0.8, x: 10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 10 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Conversation Mode */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="w-full h-full relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Main Conversation Container - Fills entire window */}
            <motion.div 
              className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
              initial={{ 
                scale: 0.95,
                borderRadius: "24px",
                y: 10
              }}
              animate={{ 
                scale: 1,
                borderRadius: "24px",
                y: 0
              }}
              exit={{ 
                scale: 0.95,
                borderRadius: "24px",
                y: 10
              }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94],
                borderRadius: { duration: 0.3 }
              }}
            >
            {/* Header */}
            <motion.div 
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
            >
              <div className="flex items-center space-x-3">
                <h3 className="font-medium text-gray-800 text-base">Nox Assistant</h3>
                
                {/* Recording Status Indicators */}
                <div className="flex items-center space-x-1">
                  {isVoiceRecording && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                      <span>Voice</span>
                    </div>
                  )}
                  {isScreenRecording && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                      <span>Screen</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 relative z-10">
                {/* Recording Controls */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleVoiceRecording();
                  }}
                  className={`relative p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                    isVoiceRecording 
                      ? 'bg-black text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  }`}
                  title={isVoiceRecording ? 'Voice recording active - Click to stop' : 'Click to start voice recording'}
                >
                  <svg className="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleScreenRecording();
                  }}
                  className={`relative p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                    isScreenRecording 
                      ? 'bg-black text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  }`}
                  title={isScreenRecording ? 'Screen recording active - Click to stop' : 'Click to start screen recording'}
                >
                  <svg className="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Window Controls */}
                <div className="w-px h-4 bg-gray-200 mx-2"></div>
                
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.electronAPI && window.electronAPI.collapseWindowToSearchbar) {
                      await window.electronAPI.collapseWindowToSearchbar();
                      setIsExpanded(false);
                    }
                  }}
                  className="relative p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 rounded-lg transition-all duration-200 cursor-pointer"
                  title="Collapse to search bar"
                >
                  <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRestore();
                  }}
                  className="relative p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 rounded-lg transition-all duration-200 cursor-pointer"
                  title="Expand to full dashboard"
                >
                  <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h10v10M7 17L17 7" />
                  </svg>
                </button>
              </div>
            </motion.div>

            {/* Messages Area */}
            <motion.div 
              className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 messages-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
            >
              {minimizedMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  Start a conversation...
                </div>
              ) : (
                minimizedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                        message.isBot
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-black text-white'
                      }`}
                    >
                      {message.isTyping ? (
                        <div className="flex items-center space-x-2">
                          <span>{message.text}</span>
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                          </div>
                        </div>
                      ) : (
                        message.text
                      )}
                    </div>
                  </div>
                ))
              )}
            </motion.div>

            {/* Input Area */}
            <motion.div 
              className="border-t border-gray-100 flex-shrink-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
            >
              {/* Attached Files Preview */}
              {attachedFiles.length > 0 && (
                <div className="px-3 pt-3 pb-2">
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group"
                      >
                        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-2 py-1.5 pr-7">
                          {/* File Icon/Thumbnail */}
                          {file.type.startsWith('image/') ? (
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={file.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          )}
                          {/* File Name */}
                          <span className="text-xs text-gray-700 max-w-[100px] truncate">
                            {file.name}
                          </span>
                          {/* Remove Button */}
                          <button
                            onClick={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== index))}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 flex items-center space-x-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    handleTypingActivity();
                  }}
                  onKeyPress={(e) => {
                    onKeyPress(e);
                    handleTypingActivity();
                  }}
                  onInput={handleTypingActivity}
                  onKeyDown={(e) => {
                    handleTypingActivity();
                    // Force resize window when user types to ensure proper expansion
                    if (isExpanded && minimizedMessages.length > 0) {
                      autoResizeWindow(minimizedMessages.length);
                    }
                  }}
                  onFocus={() => {
                    // Force resize when input is focused to ensure window is properly expanded
                    if (isExpanded && minimizedMessages.length > 0) {
                      autoResizeWindow(minimizedMessages.length);
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-50 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-black text-sm"
                  autoFocus
                />
                
                {/* Attach File Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const files = Array.from(e.target.files);
                      setAttachedFiles([...attachedFiles, ...files]);
                    };
                    input.click();
                  }}
                  className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 rounded-lg transition-all duration-200 flex-shrink-0"
                  title="Attach files"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                <button 
                  onClick={handleSendWithClear}
                  disabled={!inputText.trim() && attachedFiles.length === 0}
                  className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 shadow-sm"
                  title="Send message"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default MinimizedScreen;