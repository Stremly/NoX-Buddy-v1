// AppLoader.jsx - Beautiful loading screen for Nox-Buddy app launch
// Modern, minimal, and professional design with linear progress

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import noxServiceManager from '../../services/noxServiceManager';
import StremlyBlack from '../../../public/images/Stremly_black.png'
import axios from 'axios'

const AppLoader = ({ onLoadingComplete, setProfileData, setUserData }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');
  const [isVisible, setIsVisible] = useState(true);
  const [showSecretCodeScreen, setShowSecretCodeScreen] = useState(false);
  const [storedUser, setStoredUser] = useState(null);
  const [secretCode, setSecretCode] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authMode, setAuthMode] = useState('signup');
  const API_BASE = 'http://localhost:8000';



  useEffect(() => {
    const loadingSteps = [
      { progress: 0, text: 'Initializing...', duration: 500 },
      { progress: 25, text: 'Loading components...', duration: 600 },
      { progress: 50, text: 'Starting Nox Backend...', duration: 800 },
      { progress: 75, text: 'Preparing interface...', duration: 600 },
      { progress: 100, text: 'Almost there!', duration: 700 }
    ];

    let currentStep = 0;
    
    const runLoadingStep = async () => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setProgress(step.progress);
        setLoadingText(step.text);
        
        // Special handling for backend startup step
        if (step.progress === 50) {
          try {
            await noxServiceManager.startBackend();
            console.log('✅ Backend startup handled by main process');
            
            // Update loading text based on service type
                const isRunning = await noxServiceManager.isBackendRunning();
    if (isRunning) {
      setLoadingText('Backend connected...');
    } else {
      setLoadingText('Starting services...');
    }
            const platformMsg = noxServiceManager.getPlatformMessage();
            if (platformMsg) {
              setLoadingText('Demo mode active...');
            }
          } catch (error) {
            console.error('❌ Failed to start service during loading:', error);
            setLoadingText('Service startup failed, continuing...');
          }
        }
        
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
const checkStoredUser = async () => {
  try {
    const userDataStr = localStorage.getItem('nox-buddy-user');
    if (userDataStr) {
      const parsedUser = JSON.parse(userDataStr);

      // Wait for backend to be ready
      const isRunning = await noxServiceManager.isBackendRunning();
      if (!isRunning) {
        console.warn('Backend not running, cannot validate stored user yet');
        return; // optional: retry later
      }

      // Fetch latest user info from backend
      try {
        const response = await axios.get(`${API_BASE}/users/${parsedUser.secretCode}`);
        const backendUser = response.data;

        // Overwrite localStorage with latest info
        const updatedLocalUser = {
          name: backendUser.name,
          email: backendUser.email,
          secretCode: backendUser.secret_code,
          bio: backendUser.bio,
          photo: backendUser.photo,
          noxId: backendUser.nox_id,
          createdAt: parsedUser.createdAt || new Date().toISOString()
        };
        setUserData(updatedLocalUser);
        setProfileData(prev => ({
          ...prev,
          personal: {
            name: updatedLocalUser.name,
            email: updatedLocalUser.email,
            bio: updatedLocalUser.bio,
            photo: updatedLocalUser.photo,
            secretCode: updatedLocalUser.secretCode
          }
        }));
        localStorage.setItem('nox-buddy-user', JSON.stringify(updatedLocalUser));

        // Auto-login existing user
        setLoadingText(`Welcome back, ${backendUser.name}!`);
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onLoadingComplete(), 500);
        }, 1000);
        return;
      } catch (error) {
        console.warn('Stored user not found in backend, clearing localStorage');
        localStorage.removeItem('nox-buddy-user');
      }
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


  // Handle new secret code generation
  const handleGenerateNewCode = () => {
    const newCode = generateSecretCode();
    setSecretCode(newCode);
    setSuccess(`New secret code generated: ${newCode}`);
  };

// Handle secret code submission for signup
const handleSignupSubmit = async () => {
  if (!secretCode.trim()) {
    setError('Please enter or generate a secret code');
    return;
  }

  if (!userName.trim()) {
    setError('Please enter your name');
    return;
  }

  if (!userEmail.trim()) {
    setError('Please enter your email');
    return;
  }

  setError('');
  setSuccess('Creating your account...');

  try {
    // Generate a nox_id (you can modify this logic as needed)
    const noxId = `nox_${Date.now()}`;
    
    // Prepare user data for backend
    const userData = {
      name: userName,
      email: userEmail,
      secret_code: secretCode,
      nox_id: noxId,
      contacts: []
    };
    
    console.log('🔄 Attempting to create user...');
    console.log('API URL:', `${API_BASE}/users/`);
    console.log('User data:', userData);
    // Send to backend API
    const response = await axios.post(`${API_BASE}/users/`, userData);
    
    // Store user data in localStorage as well
    const localUserData = {
      name: response.data.name,
      email: response.data.email,
      secretCode: response.data.secret_code,
      noxId: response.data.nox_id,
      createdAt: new Date().toISOString()
};
    
    localStorage.setItem('nox-buddy-user', JSON.stringify(localUserData));
    
    setSuccess(`Welcome ${userName}! Account created successfully.`);
    
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onLoadingComplete();
      }, 500);
    }, 1500);
  } catch (error) {
    console.error('❌ Signup error details:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    if (error.response?.status === 400) {
      setError('User with this secret code or email already exists');
    } else {
      setError('Failed to create account. Please try again.');
    }
    console.error('Signup error:', error);
  }
};

  // Handle sign in with secret code
// Handle sign in with secret code
const handleSigninSubmit = async () => {
  if (!secretCode.trim()) {
    setError('Please enter your secret code');
    return;
  }

  setError('');
  setSuccess('Signing you in...');

  try {
    // Verify user exists in backend
    const response = await axios.get(`${API_BASE}/users/${secretCode}`);
    const userData = response.data;
    
    // Also store in localStorage for session persistence
    const localUserData = {
      name: userData.name,
      email: userData.email,
      secretCode: secretCode,
      noxId: userData.nox_id,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('nox-buddy-user', JSON.stringify(localUserData));
    
    setError('');
    setSuccess(`Welcome back, ${userData.name}!`);
    
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onLoadingComplete();
      }, 500);
    }, 1500);
  } catch (error) {
    if (error.response?.status === 404) {
      setError('Invalid secret code. Please try again or sign up.');
    } else {
      setError('Failed to sign in. Please try again.');
    }
    console.error('Signin error:', error);
  }
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
            // Auth Screen - Refined Compact Design
            <div className="w-full h-full flex items-center justify-center bg-white">
              <div className="w-full max-w-5xl mx-auto px-16 flex items-center justify-center gap-20">
                {/* Left Side - Logo */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex items-center justify-center"
                >
                  <img 
                    src={StremlyBlack}
                    alt="Nox-Buddy Logo" 
                    className="w-64 h-64 object-contain"
                  />
                </motion.div>

                {/* Right Side - Auth Form */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  className="w-80"
                >
                  {/* Header */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-black mb-1 tracking-tight">
                      Welcome
                    </h1>
                    <p className="text-sm text-gray-500">
                      {authMode === 'signup' ? 'Create your account to get started' : 'Sign in to continue'}
                    </p>
                  </div>

                  {/* Error/Success Messages */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 bg-red-50 text-red-600 px-3 py-2 rounded-2xl text-xs"
                    >
                      {error}
                    </motion.div>
                  )}
                  
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 bg-green-50 text-green-600 px-3 py-2 rounded-2xl text-xs"
                    >
                      {success}
                    </motion.div>
                  )}

                  {/* Auth Mode Toggle */}
                  <div className="flex bg-gray-100 rounded-2xl p-0.5 mb-5">
                    <button
                      onClick={() => {
                        setAuthMode('signup');
                        setError('');
                        setSuccess('');
                      }}
                      className={`flex-1 py-2 px-3 rounded-2xl text-xs font-semibold transition-all duration-300 ${
                        authMode === 'signup'
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('signin');
                        setError('');
                        setSuccess('');
                      }}
                      className={`flex-1 py-2 px-3 rounded-2xl text-xs font-semibold transition-all duration-300 ${
                        authMode === 'signin'
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      Sign In
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div className="min-h-[280px]">
                    <motion.div
                      key={authMode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="space-y-3"
                    >
                      {authMode === 'signup' ? (
                        // Signup Form
                        <>
                          {/* Secret Code Input */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-black">
                              Secret Code
                            </label>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder="Enter or generate code"
                                value={secretCode}
                                onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                                className="flex-1 px-3 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-black text-xs font-mono transition-all duration-300"
                                maxLength={8}
                              />
                              <button
                                onClick={handleGenerateNewCode}
                                className="px-4 py-2.5 rounded-2xle text-xs font-semibold transition-all duration-300 bg-gray-100 text-black hover:bg-gray-200"
                              >
                                Generate
                              </button>
                            </div>
                          </div>

                          {/* Name Input */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-black">
                              Name
                            </label>
                            <input
                              type="text"
                              placeholder="Enter your full name"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-black text-xs transition-all duration-300"
                            />
                          </div>

                          {/* Email Input */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-black">
                              Email
                            </label>
                            <input
                              type="email"
                              placeholder="Enter your email address"
                              value={userEmail}
                              onChange={(e) => setUserEmail(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-black text-xs transition-all duration-300"
                            />
                          </div>

                          <button
                            onClick={handleSignupSubmit}
                            disabled={!secretCode.trim() || !userName.trim() || !userEmail.trim()}
                            className="w-full py-3 px-4 rounded-2xl bg-black text-white text-sm font-semibold transition-all duration-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                          >
                            Create Account
                          </button>
                        </>
                      ) : (
                        // Sign In Form
                        <>
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-black">
                              Secret Code
                            </label>
                            <input
                              type="text"
                              placeholder="Enter your secret code"
                              value={secretCode}
                              onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                              className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-black text-xs font-mono transition-all duration-300"
                              maxLength={8}
                            />
                          </div>

                          <button
                            onClick={handleSigninSubmit}
                            disabled={!secretCode.trim()}
                            className="w-full py-3 px-4 rounded-2xl bg-black text-white text-sm font-semibold transition-all duration-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                          >
                            Sign In
                          </button>
                        </>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppLoader;
