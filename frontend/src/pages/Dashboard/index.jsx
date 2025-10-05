// Dashboard.jsx - Modern AI Startup Dashboard
// Integrated chat interface with clean sidebar navigation

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceRecording from '../VoiceRecording';
import noxServiceManager from '../../services/noxServiceManager';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('engage');
  const [profileSubTab, setProfileSubTab] = useState('personal');
  const [userData, setUserData] = useState(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [minimizedMessages, setMinimizedMessages] = useState([]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isScreenRecording, setIsScreenRecording] = useState(false);

  // Reset expanded state when minimizing
  const resetMinimizedState = () => {
    setIsExpanded(false);
    setMinimizedMessages([]);
  };

  // Auto-resize window when messages change
  const autoResizeWindow = async (messageCount) => {
    if (isMinimized && isExpanded && window.electronAPI && window.electronAPI.expandWindowForConversation) {
      await window.electronAPI.expandWindowForConversation(messageCount);
    }
  };

  // Toggle voice recording
  const toggleVoiceRecording = () => {
    setIsVoiceRecording(prev => {
      const newState = !prev;
      console.log('Voice recording:', newState ? 'Started' : 'Stopped');
      // TODO: Implement actual voice recording logic
      return newState;
    });
  };

  // Toggle screen recording
  const toggleScreenRecording = () => {
    setIsScreenRecording(prev => {
      const newState = !prev;
      console.log('Screen recording:', newState ? 'Started' : 'Stopped');
      // TODO: Implement actual screen recording logic
      return newState;
    });
  };

  // Auto-start recordings when minimized
  useEffect(() => {
    if (isMinimized) {
      // Auto-start voice recording when minimized
      setIsVoiceRecording(true);
      // Auto-start screen recording when minimized
      setIsScreenRecording(true);
      console.log('Auto-started recordings for minimized mode');
    } else {
      // Stop recordings when not minimized
      setIsVoiceRecording(false);
      setIsScreenRecording(false);
      console.log('Stopped recordings - not in minimized mode');
    }
  }, [isMinimized]);

  // Effect to auto-resize when minimized messages change
  useEffect(() => {
    if (isMinimized && isExpanded && minimizedMessages.length > 0) {
      autoResizeWindow(minimizedMessages.length);
      
      // Auto-scroll to bottom when new message is added
      setTimeout(() => {
        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 150);
    }
  }, [minimizedMessages.length, isMinimized, isExpanded]);

  // Handle minimize with Electron window resize
  const handleMinimize = async () => {
    console.log('Minimize button clicked');
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI) {
        console.log('Electron API available, calling resizeWindowForMinimize');
        const result = await window.electronAPI.resizeWindowForMinimize();
        console.log('Resize result:', result);
        
        if (result.success) {
          console.log('Window resized successfully');
        } else {
          console.error('Failed to resize window:', result.error);
        }
      } else {
        console.log('Electron API not available, running in browser mode');
      }
      
      // Reset and set the minimized state
      resetMinimizedState();
      setIsMinimized(true);
    } catch (error) {
      console.error('Error minimizing window:', error);
      // Fallback to just setting state
      setIsMinimized(true);
    }
  };

  // Handle restore from minimize
  const handleRestore = async () => {
    console.log('Restore button clicked');
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI) {
        console.log('Electron API available, calling restoreWindowFromMinimize');
        const result = await window.electronAPI.restoreWindowFromMinimize();
        console.log('Restore result:', result);
        
        if (result.success) {
          console.log('Window restored successfully');
        } else {
          console.error('Failed to restore window:', result.error);
        }
      } else {
        console.log('Electron API not available, running in browser mode');
      }
      
      // Set the restored state
      setIsMinimized(false);
    } catch (error) {
      console.error('Error restoring window:', error);
      // Fallback to just setting state
      setIsMinimized(false);
    }
  };
  const [contacts, setContacts] = useState([
    { id: 1, name: 'John Doe', noxId: 'NOX-ABC123', lastMessage: 'Hello there!', timestamp: '2 hours ago' },
    { id: 2, name: 'Jane Smith', noxId: 'NOX-XYZ789', lastMessage: 'How are you?', timestamp: '1 day ago' }
  ]);
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [reminders, setReminders] = useState([
    {
      id: 1,
      description: 'Team meeting at 3 PM',
      reminderId: 'REM-001',
      dateCreated: '2024-01-15',
      dateReminder: '2024-01-20',
      numberSent: 2,
      acknowledged: false,
      status: 'Active'
    },
    {
      id: 2,
      description: 'Submit project report',
      reminderId: 'REM-002',
      dateCreated: '2024-01-10',
      dateReminder: '2024-01-18',
      numberSent: 1,
      acknowledged: true,
      status: 'Completed'
    }
  ]);
  const [showNewReminderForm, setShowNewReminderForm] = useState(false);
  const [connectedApps, setConnectedApps] = useState([
    { id: 1, name: 'Slack', status: 'Connected', config: { webhook: 'https://hooks.slack.com/...' } },
    { id: 2, name: 'Discord', status: 'Connected', config: { token: 'BOT_TOKEN_123' } }
  ]);
  const [availableApps, setAvailableApps] = useState([
    { id: 3, name: 'Telegram', status: 'Available', config: {} },
    { id: 4, name: 'WhatsApp', status: 'Available', config: {} },
    { id: 5, name: 'Teams', status: 'Available', config: {} }
  ]);
  const [memoryItems, setMemoryItems] = useState([
    { id: 1, data: 'User prefers morning meetings' },
    { id: 2, data: 'Project deadline is March 15th' },
    { id: 3, data: 'Favorite programming language is JavaScript' }
  ]);

  // Load user data on component mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('nox-buddy-user');
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }

    // Test Electron API availability
    if (typeof window !== 'undefined' && window.electronAPI) {
      console.log('🧪 Electron API detected, testing...');
      if (window.electronAPI.testAPI) {
        const result = window.electronAPI.testAPI();
        console.log('🧪 API test result:', result);
      }
      
      // List available API methods
      console.log('📋 Available Electron API methods:', Object.keys(window.electronAPI));
    } else {
      console.log('🌐 Running in browser mode - Electron API not available');
    }
  }, []);

  // Handle chat functionality
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };
    
    // Handle messages differently when minimized
    if (isMinimized) {
      const newMessages = [...minimizedMessages, userMessage];
      setMinimizedMessages(newMessages);
      // Expand window for conversation with dynamic sizing
      if (window.electronAPI && window.electronAPI.expandWindowForConversation) {
        await window.electronAPI.expandWindowForConversation(newMessages.length + 1); // +1 for incoming response
        setIsExpanded(true);
      }
    } else {
      setMessages(prev => [...prev, userMessage]);
    }
    
    const messageText = inputText;
    setInputText('');
    
    // Show typing indicator
    const typingMessage = {
      id: Date.now() + 1,
      text: "Thinking...",
      isBot: true,
      isTyping: true,
      timestamp: new Date()
    };
    
    if (isMinimized) {
      setMinimizedMessages(prev => [...prev, typingMessage]);
    } else {
      setMessages(prev => [...prev, typingMessage]);
    }
    
    try {
      const response = await noxServiceManager.sendMessage(messageText);
      
      const botResponse = {
        id: Date.now() + 2,
        text: response || "I'm here to help! Could you please rephrase your question?",
        isBot: true,
        timestamp: new Date()
      };
      
      if (isMinimized) {
        setMinimizedMessages(prev => {
          const filtered = prev.filter(msg => !msg.isTyping);
          const newMessages = [...filtered, botResponse];
          // Auto-resize window after bot response is added
          setTimeout(() => {
            autoResizeWindow(newMessages.length);
          }, 100);
          return newMessages;
        });
      } else {
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.isTyping);
          return [...filtered, botResponse];
        });
      }
      
    } catch (error) {
      const errorResponse = {
        id: Date.now() + 2,
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        isBot: true,
        timestamp: new Date()
      };
      
      if (isMinimized) {
        setMinimizedMessages(prev => {
          const filtered = prev.filter(msg => !msg.isTyping);
          return [...filtered, errorResponse];
        });
      } else {
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.isTyping);
          return [...filtered, errorResponse];
        });
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleRestore();
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

  // Sidebar navigation items (Dashboard tabs)
  const sidebarItems = [
    {
      id: 'engage',
      label: 'Engage Tab',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: 'contacts',
      label: 'Contacts Tab',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 108 0 4 4 0 00-8 0zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      )
    },
    {
      id: 'reminders',
      label: 'Reminders Tab',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'integrations',
      label: 'Integrations Tab',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      id: 'memory',
      label: 'Memory Tab',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profile Tab',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Minimized Window - Adaptive Design */}
      {isMinimized && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50"
          style={{ 
            background: 'rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        >
          {/* Search Bar Mode */}
          {!isExpanded && (
            <div className="w-full h-full relative">
              {/* Main Search Container - Fills entire window */}
              <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="w-full h-full flex items-center px-4">
                  {/* Search Icon */}
                  <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  
                  {/* Input Field */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Nox anything..."
                    className="flex-1 bg-transparent text-base focus:outline-none placeholder-gray-500 text-gray-800 h-full"
                    autoFocus
                  />
                  
                  {/* Recording Controls */}
                  <div className="ml-3 flex items-center space-x-2 flex-shrink-0 relative z-10">
                    {/* Voice Recording Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleVoiceRecording();
                      }}
                      className={`relative p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                        isVoiceRecording 
                          ? 'bg-red-500 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                      title={isVoiceRecording ? 'Voice recording active - Click to stop' : 'Click to start voice recording'}
                    >
                      <svg className="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Screen Recording Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleScreenRecording();
                      }}
                      className={`relative p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                        isScreenRecording 
                          ? 'bg-red-500 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                      title={isScreenRecording ? 'Screen recording active - Click to stop' : 'Click to start screen recording'}
                    >
                      <svg className="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Send Button */}
                    {inputText && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSendMessage();
                        }}
                        className="relative p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-md cursor-pointer"
                        title="Send message"
                      >
                        <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expanded Conversation Mode */}
          {isExpanded && (
            <div className="w-full h-full relative">
              {/* Main Conversation Container - Fills entire window */}
              <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium text-gray-800 text-base">Nox Assistant</h3>
                    
                    {/* Recording Status Indicators */}
                    <div className="flex items-center space-x-1">
                      {isVoiceRecording && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span>Voice</span>
                        </div>
                      )}
                      {isScreenRecording && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
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
                          ? 'bg-red-500 text-white shadow-md' 
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
                          ? 'bg-red-500 text-white shadow-md' 
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
                        handleRestore();
                      }}
                      className="relative p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 rounded-lg transition-all duration-200 cursor-pointer"
                      title="Expand to full dashboard"
                    >
                      <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 messages-container">
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
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-gray-100 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 bg-gray-50 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-black text-sm"
                      autoFocus
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!inputText.trim()}
                      className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 shadow-sm"
                      title="Send message"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Main Dashboard */}
      {!isMinimized && (
        <div className="h-screen w-full bg-white flex">
          {/* Sidebar */}
          <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <img src="/images/Stremly_black.png" alt="Logo" className="w-6 h-6" />
            <h1 className="font-bold text-black">Nox-Buddy</h1>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === item.id
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">
                {userData?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userData?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black mb-1">
            Welcome back{userData?.name ? `, ${userData.name}` : ''}
          </h2>
          <p className="text-gray-500 text-sm">Ready to get productive with Nox-Buddy?</p>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6">
          {activeTab === 'engage' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              {/* Engage Tab Header with Minimize Button */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-black">Chat with Nox</h3>
                <button
                  onClick={handleMinimize}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  title="Minimize to floating window"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
              </div>

              {/* Attached Files */}
              {attachedFiles.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-gray-700">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 border border-gray-200 rounded-lg mb-4 overflow-y-auto p-4 bg-white">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Start a conversation with your AI assistant</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-2 rounded-lg text-sm ${
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
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                />
                <button
                  onClick={handleFileAttach}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Attach files"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowVoiceRecording(true)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Voice input"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() && attachedFiles.length === 0}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              {/* <div className="mb-6">
                <h2 className="text-2xl font-bold text-black mb-1">Profile</h2>
                <p className="text-gray-500 text-sm">Manage your account settings</p>
              </div> */}

              {/* Profile Sub-tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  onClick={() => setProfileSubTab('personal')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    profileSubTab === 'personal'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Personal Information
                </button>
                <button
                  onClick={() => setProfileSubTab('nox')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    profileSubTab === 'nox'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Nox Information
                </button>
                <button
                  onClick={() => setProfileSubTab('usage')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    profileSubTab === 'usage'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Usage Statistics
                </button>
              </div>

              {/* Profile Sub-tab Content */}
              <div className="flex-1 overflow-hidden">
                {profileSubTab === 'personal' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-gray-200 rounded-lg p-5 h-full"
                  >
                    <h3 className="text-lg font-semibold text-black mb-4">Personal Information</h3>
                    <div className="max-w-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 flex items-center space-x-3 mb-2">
                        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">
                            {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                          Change Photo
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={userData?.name || ''}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={userData?.email || ''}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm resize-none"
                          rows={3}
                          placeholder="Tell us about yourself"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Secret Code</label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                          placeholder="Enter secret code"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors">
                        Save Changes
                      </button>
                      
                      {/* Logout Button */}
                      <button 
                        onClick={() => {
                          // Clear user data
                          localStorage.removeItem('nox-buddy-user');
                          setUserData(null);
                          // Redirect to login/home page
                          window.location.href = '/';
                        }}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 text-sm font-medium transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Logout</span>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {profileSubTab === 'nox' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-gray-200 rounded-lg p-5 h-full"
                  >
                    <h3 className="text-lg font-semibold text-black mb-4">Nox Information</h3>
                    <div className="max-w-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nox ID</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono">
                          NOX-{Math.random().toString(36).substr(2, 8).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nox Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                          defaultValue="Nox Assistant"
                          placeholder="Give your AI a name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm resize-none"
                          rows={3}
                          placeholder="Describe your AI assistant"
                          defaultValue="Your intelligent desktop companion designed to help with various tasks and conversations."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm resize-none"
                          rows={3}
                          placeholder="Custom instructions for your AI"
                          defaultValue="Be helpful, accurate, and concise in your responses. Maintain a professional yet friendly tone."
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors">
                        Save Changes
                      </button>
                    </div>
                  </motion.div>
                )}

                {profileSubTab === 'usage' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-gray-200 rounded-lg p-5 h-full"
                  >
                    <h3 className="text-lg font-semibold text-black mb-4">Usage Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-black mb-1">24.5h</div>
                        <div className="text-xs text-gray-600">Total Hours</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-black mb-1">2.3 GB</div>
                        <div className="text-xs text-gray-600">Memory Size</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-black mb-1">12</div>
                        <div className="text-xs text-gray-600">Reminders</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-black mb-1">3.2h</div>
                        <div className="text-xs text-gray-600">Avg Runtime</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors">
                        Save Changes
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}


          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Contacts List */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-black">Contacts</h3>
                    <span className="text-sm text-black">{contacts.length}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedContact?.id === contact.id 
                            ? 'border-black bg-black text-white' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            selectedContact?.id === contact.id ? 'bg-white text-black' : 'bg-black text-white'
                          }`}>
                            <span className="text-sm font-medium">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{contact.name}</h4>
                            <p className="text-xs font-mono opacity-70">{contact.noxId}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {contacts.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-black text-sm">No contacts</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="space-y-4">
                  {/* Add New Contact */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-black mb-3">New Contact</h3>
                    
                    {!showNewContactForm ? (
                      <button
                        onClick={() => setShowNewContactForm(true)}
                        className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
                      >
                        Add Contact
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm font-mono"
                          placeholder="NOX-ID"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setShowNewContactForm(false);
                            }}
                            className="flex-1 px-3 py-2 bg-black text-white rounded-lg text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setShowNewContactForm(false)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat with Selected Contact */}
                  {selectedContact ? (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-black mb-3">{selectedContact.name}</h3>
                      <div className="space-y-3">
                        <div className="p-3 border border-gray-200 rounded-lg">
                          <p className="text-sm text-black font-mono">{selectedContact.noxId}</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('engage')}
                          className="w-full px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"
                        >
                          Open Chat
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-center py-8">
                        <p className="text-black text-sm">Select contact to chat</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-black">Reminders</h3>
                <button
                  onClick={() => setShowNewReminderForm(!showNewReminderForm)}
                  className="px-3 py-2 bg-black text-white rounded-lg text-sm font-medium"
                >
                  {showNewReminderForm ? 'Cancel' : 'Add'}
                </button>
              </div>

              {/* New Reminder Form */}
              {showNewReminderForm && (
                <div className="border border-gray-200 rounded-lg p-3 mb-4">
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                      placeholder="Description"
                    />
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                    />
                    <button
                      onClick={() => setShowNewReminderForm(false)}
                      className="w-full px-3 py-2 bg-black text-white rounded-lg text-sm font-medium"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* Reminders List */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-black">{reminder.description}</h4>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        reminder.status === 'Active' 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 text-black'
                      }`}>
                        {reminder.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-mono text-black">{reminder.reminderId}</span>
                      </div>
                      <div>
                        <span className="text-black">{reminder.dateReminder}</span>
                      </div>
                      <div>
                        <span className="text-black">Sent: {reminder.numberSent}</span>
                      </div>
                      <div>
                        <span className="text-black">
                          {reminder.acknowledged ? 'Acknowledged' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button className="flex-1 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium">
                        Edit
                      </button>
                      <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {reminders.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-black">No reminders yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              <h3 className="font-semibold text-black mb-4">Integrations</h3>
              
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Connected Applications */}
                <div>
                  <h4 className="font-medium text-black mb-3">Connected Applications</h4>
                  <div className="space-y-3">
                    {connectedApps.map((app) => (
                      <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-black">{app.name}</h5>
                          <span className="px-2 py-1 bg-black text-white rounded text-xs">
                            {app.status}
                          </span>
                        </div>
                        <div className="space-y-2 mb-3">
                          {Object.entries(app.config).map(([key, value]) => (
                            <div key={key}>
                              <label className="block text-sm text-black mb-1">{key}</label>
                              <input
                                type="text"
                                value={value}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                                readOnly
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <button className="flex-1 px-3 py-2 bg-black text-white rounded-lg text-sm">
                            Configure
                          </button>
                          <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Applications */}
                <div>
                  <h4 className="font-medium text-black mb-3">Available Applications</h4>
                  <div className="space-y-3">
                    {availableApps.map((app) => (
                      <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-black">{app.name}</h5>
                          <span className="px-2 py-1 border border-gray-200 rounded text-xs">
                            {app.status}
                          </span>
                        </div>
                        <button className="w-full px-3 py-2 bg-black text-white rounded-lg text-sm">
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Memory Tab */}
          {activeTab === 'memory' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-black">Memory</h3>
                <button className="px-3 py-2 bg-black text-white rounded-lg text-sm font-medium">
                  Add Memory
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {memoryItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-black text-sm mb-2">{item.data}</p>
                        <p className="text-xs text-black font-mono">ID: MEM-{item.id.toString().padStart(3, '0')}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="flex-1 px-3 py-2 bg-black text-white rounded-lg text-sm">
                        Save
                      </button>
                      <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {memoryItems.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-black">No memories stored</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Voice Recording Modal */}
        <VoiceRecording
          isOpen={showVoiceRecording}
          onClose={() => setShowVoiceRecording(false)}
          isDarkMode={false}
          onTranscriptComplete={(transcript) => {
            if (transcript && transcript.trim()) {
              setInputText(transcript.trim());
            }
          }}
        />
      </div>
      </div>
      )}
    </>
  );
};

export default Dashboard;
