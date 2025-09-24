// Settings.jsx - Nox-Buddy Settings Page
// Modern, minimal settings interface with tabs

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Settings = ({ onClose, isDarkMode, setIsDarkMode }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userProfile, setUserProfile] = useState({
    name: '',
    buddyName: 'Nox-Buddy',
    email: ''
  });

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('nox-buddy-user');
    if (userData) {
      const parsedData = JSON.parse(userData);
      setUserProfile({
        name: parsedData.name || '',
        buddyName: 'Nox-Buddy',
        email: parsedData.email || ''
      });
    }
  }, []);

  const saveProfile = () => {
    const existingData = JSON.parse(localStorage.getItem('nox-buddy-user') || '{}');
    const updatedData = {
      ...existingData,
      name: userProfile.name,
      email: userProfile.email
    };
    localStorage.setItem('nox-buddy-user', JSON.stringify(updatedData));
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('nox-buddy-user');
    // Reload the page to restart the app
    window.location.reload();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'theme', label: 'Theme', icon: 'palette' },
    { id: 'reminders', label: 'Reminders', icon: 'bell' },
    { id: 'memory', label: 'Memory', icon: 'brain' }
  ];

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'user':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'palette':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      case 'bell':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
          </svg>
        );
      case 'brain':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-4 lg:space-y-6">
            <div>
              <h3 className={`text-lg lg:text-xl font-semibold mb-3 lg:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Profile Information
              </h3>
              <div className="space-y-3 lg:space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                    className={`w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-3xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Buddy Name
                  </label>
                  <input
                    type="text"
                    value={userProfile.buddyName}
                    onChange={(e) => setUserProfile({...userProfile, buddyName: e.target.value})}
                    className={`w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-3xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                    placeholder="Your buddy's name"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                    className={`w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-3xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                  <button
                    onClick={saveProfile}
                    className="flex-1 lg:flex-none px-6 py-2.5 lg:py-3 rounded-3xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: '#1B365D', color: 'white' }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 lg:flex-none px-6 py-2.5 lg:py-3 rounded-3xl text-sm font-semibold transition-all duration-200 border-2 hover:bg-red-50"
                    style={{ borderColor: '#DC2626', color: '#DC2626' }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'theme':
        return (
          <div className="space-y-4 lg:space-y-6">
            <div>
              <h3 className={`text-lg lg:text-xl font-semibold mb-3 lg:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Appearance
              </h3>
              <div className="space-y-3 lg:space-y-4">
                <div className={`p-3 lg:p-4 rounded-3xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <h4 className={`font-medium text-sm lg:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Dark Mode
                      </h4>
                      <p className={`text-xs lg:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Switch between light and dark themes
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                      style={{ backgroundColor: isDarkMode ? '#1B365D' : '#E5E7EB' }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isDarkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className={`p-3 lg:p-4 rounded-3xl border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <p className={`text-xs lg:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Theme changes will be applied immediately across the application.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reminders':
        return (
          <div className="space-y-4 lg:space-y-6">
            <div>
              <h3 className={`text-lg lg:text-xl font-semibold mb-3 lg:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Reminders
              </h3>
              <div className={`p-6 lg:p-8 rounded-3xl border-2 border-dashed text-center ${
                isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-gray-50'
              }`}>
                <div className={`w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <svg className={`w-5 h-5 lg:w-6 lg:h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  </svg>
                </div>
                <h4 className={`font-medium mb-2 text-sm lg:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Reminders Coming Soon
                </h4>
                <p className={`text-xs lg:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Set up and manage your personal reminders and notifications.
                </p>
              </div>
            </div>
          </div>
        );

      case 'memory':
        return (
          <div className="space-y-4 lg:space-y-6">
            <div>
              <h3 className={`text-lg lg:text-xl font-semibold mb-3 lg:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Memory & History
              </h3>
              <div className={`p-6 lg:p-8 rounded-3xl border-2 border-dashed text-center ${
                isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-300 bg-gray-50'
              }`}>
                <div className={`w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <svg className={`w-5 h-5 lg:w-6 lg:h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className={`font-medium mb-2 text-sm lg:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Memory Feature Coming Soon
                </h4>
                <p className={`text-xs lg:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  View and manage your conversation history and stored memories.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-3 lg:p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
            <img 
              src={isDarkMode ? "/images/Stremly White Logo.png" : "/images/Stremly_black.png"}
              alt="Nox-Buddy Logo" 
              className="w-6 h-6 lg:w-8 lg:h-8 opacity-90 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 
                className={`text-base lg:text-lg font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                style={{ 
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                Settings
              </h1>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                Manage your preferences
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`p-2 rounded-3xl transition-all duration-200 flex-shrink-0 ${
              isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-blue-50'
            }`}
            style={!isDarkMode ? { color: '#1B365D' } : {}}
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Mobile Tab Navigation */}
          <div className={`lg:hidden border-b ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} p-4 mt-1`}>
            <div className="flex space-x-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-3xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? isDarkMode ? 'bg-blue-600 text-white' : 'text-white'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'hover:bg-blue-50'
                  }`}
                  style={activeTab === tab.id && !isDarkMode ? { backgroundColor: '#1B365D' } : !isDarkMode && activeTab !== tab.id ? { color: '#1B365D' } : {}}
                >
                  {getIcon(tab.icon)}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Tab Navigation */}
          <div className={`hidden lg:block w-64 border-r ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} p-4`}>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-3xl text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? isDarkMode ? 'bg-blue-600 text-white' : 'text-white'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'hover:bg-blue-50'
                  }`}
                  style={activeTab === tab.id && !isDarkMode ? { backgroundColor: '#1B365D' } : !isDarkMode && activeTab !== tab.id ? { color: '#1B365D' } : {}}
                >
                  {getIcon(tab.icon)}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto scrollable mt-2">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
