// AppLoader.jsx - Beautiful loading screen for Nox-Buddy app launch
// Modern, minimal, and professional design with linear progress

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AppLoader = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');
  const [isVisible, setIsVisible] = useState(true);
  const [showSecretCodeScreen, setShowSecretCodeScreen] = useState(false);
  const [storedUser, setStoredUser] = useState(null);
  const [secretCode, setSecretCode] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadingSteps = [
      { progress: 0, text: 'Initializing...', duration: 500 },
      { progress: 25, text: 'Loading components...', duration: 600 },
      { progress: 50, text: 'Setting up environment...', duration: 600 },
      { progress: 75, text: 'Preparing interface...', duration: 600 },
      { progress: 100, text: 'Almost there!', duration: 700 }
    ];

    let currentStep = 0;
    
    const runLoadingStep = () => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setProgress(step.progress);
        setLoadingText(step.text);
        
        setTimeout(() => {
          currentStep++;
          if (currentStep < loadingSteps.length) {
            runLoadingStep();
          } else {
            // Loading complete, check for stored user
            setTimeout(() => {
              checkStoredUser();
            }, 300);
          }
        }, step.duration);
      }
    };

    // Start loading sequence after a brief delay
    setTimeout(runLoadingStep, 200);
  }, [onLoadingComplete]);

  // Check for stored user data
  const checkStoredUser = () => {
    try {
      const userData = localStorage.getItem('nox-buddy-user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setStoredUser(parsedUser);
        // Auto-login existing user
        setLoadingText(`Welcome back, ${parsedUser.name}!`);
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            onLoadingComplete();
          }, 500);
        }, 1000);
        return;
      }
      setShowSecretCodeScreen(true);
    } catch (error) {
      console.error('Error reading stored user data:', error);
      localStorage.removeItem('nox-buddy-user');
      setShowSecretCodeScreen(true);
    }
  };

  // Generate a new secret code
  const generateSecretCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Handle login with stored user
  const handleStoredUserLogin = async () => {
    setError('');
    setSuccess(`Welcome back, ${storedUser.name}!`);
    
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onLoadingComplete();
      }, 500);
    }, 1500);
  };

  // Handle new secret code generation
  const handleGenerateNewCode = () => {
    const newCode = generateSecretCode();
    setSecretCode(newCode);
    setSuccess(`New secret code generated: ${newCode}`);
  };

  // Handle secret code submission
  const handleSecretCodeSubmit = () => {
    if (!secretCode.trim()) {
      setError('Please enter or generate a secret code');
      return;
    }

    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    setError('');
    setSuccess(`Welcome ${userName}!`);
    
    // Store user data directly and go to homepage
    const userData = {
      name: userName,
      secretCode: secretCode,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('nox-buddy-user', JSON.stringify(userData));
    
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onLoadingComplete();
      }, 500);
    }, 1500);
  };

  // Handle entering new code (when user has stored data)
  const handleEnterNewCode = () => {
    setStoredUser(null); // Hide stored user option
    setSecretCode('');
    setUserName('');
    setError('');
    setSuccess('');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
        >
          {!showSecretCodeScreen ? (
            // Loading Screen
            <div className="relative z-10 flex flex-col items-center space-y-6 w-full max-w-xs mx-auto px-6">
              {/* App Name */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                className="text-center"
              >
                <h1 
                  className="text-2xl font-bold tracking-tight"
                  style={{ 
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#1B365D'
                  }}
                >
                  Nox-Buddy
                </h1>
              </motion.div>

              {/* Loading Progress Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="w-full space-y-3"
              >
                {/* Progress Bar Container */}
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  {/* Progress Fill */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="h-full bg-blue-600 rounded-full"
                    style={{ backgroundColor: '#1B365D' }}
                  />
                </div>

                {/* Loading Text and Percentage */}
                <div className="flex justify-between items-center">
                  <motion.p
                    key={loadingText}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-xs font-medium text-gray-500"
                  >
                    {loadingText}
                  </motion.p>
                  <motion.span
                    key={progress}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-xs font-semibold"
                    style={{ color: '#1B365D' }}
                  >
                    {progress}%
                  </motion.span>
                </div>
              </motion.div>
            </div>
          ) : (
            // Secret Code Screen
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 flex flex-col items-center space-y-6 w-full max-w-sm mx-auto px-6"
            >
              {/* App Name */}
              <div className="text-center">
                <h1 
                  className="text-2xl font-bold tracking-tight mb-2"
                  style={{ 
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: '#1B365D'
                  }}
                >
                  Nox-Buddy
                </h1>
                <p className="text-sm text-gray-600">Setup your access</p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="w-full bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="w-full bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-medium">
                  {success}
                </div>
              )}

              {/* Stored User Login Option */}
              {storedUser ? (
                <div className="w-full space-y-3">
                  <button
                    onClick={handleStoredUserLogin}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-3xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
                    style={{ 
                      backgroundColor: '#1B365D',
                      color: 'white'
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>Login as {storedUser.name}</span>
                  </button>
                  
                  <button
                    onClick={handleEnterNewCode}
                    className="w-full text-center py-2 text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    Or enter a different secret code
                  </button>
                </div>
              ) : (
                // Secret Code Input
                <div className="w-full space-y-3">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-3xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400/30 focus:border-gray-400 text-sm"
                    />
                  </div>

                  {/* Secret Code Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">
                      Secret Code
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Enter code"
                        value={secretCode}
                        onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2.5 rounded-3xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400/30 focus:border-gray-400 text-sm font-mono"
                        maxLength={8}
                      />
                      <button
                        onClick={handleGenerateNewCode}
                        className="px-3 py-2.5 rounded-3xl text-xs font-semibold transition-all duration-200 hover:opacity-90"
                        style={{ 
                          backgroundColor: '#1B365D',
                          color: 'white'
                        }}
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSecretCodeSubmit}
                    disabled={!secretCode.trim() || !userName.trim()}
                    className="w-full py-3 px-4 rounded-3xl text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: '#1B365D',
                      color: 'white'
                    }}
                  >
                    Continue
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppLoader;
