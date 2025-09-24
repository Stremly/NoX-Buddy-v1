// VoiceRecording.jsx - Full Page Voice Recording Interface
// Minimal and professional voice recording with Siri animation

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SiriWaveform } from '../../components/UI';
import useHybridVoiceRecognition from '../../hooks/useHybridVoiceRecognition';
import { testGroqAPI, testGroqTranscription } from '../../utils';

const VoiceRecording = ({ isOpen, onClose, isDarkMode, onTranscriptComplete }) => {
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(null);
  
  // Voice recognition hook
  const {
    isRecording: voiceIsRecording,
    transcript,
    finalTranscript,
    interimTranscript,
    error: voiceError,
    isProcessing,
    startRecording: startVoiceRecording,
    stopRecording: stopVoiceRecording,
    clearTranscript
  } = useHybridVoiceRecognition();

  // Start recording timer and voice recognition when page opens
  useEffect(() => {
    if (isOpen) {
      setRecordingDuration(0);
      clearTranscript();
      
      // Start voice recording
      startVoiceRecording();
      
      let seconds = 0;
      const timer = setInterval(() => {
        seconds += 1;
        setRecordingDuration(seconds);
        
        // Auto-stop after 60 seconds
        if (seconds >= 60) {
          clearInterval(timer);
          setRecordingTimer(null);
          stopVoiceRecording();
          onClose();
        }
      }, 1000);
      
      setRecordingTimer(timer);
    } else {
      // Clean up timer and voice recording when page closes
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      stopVoiceRecording();
      setRecordingDuration(0);
    }

    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
      stopVoiceRecording();
    };
  }, [isOpen, onClose, startVoiceRecording, stopVoiceRecording, clearTranscript]);

  // Test API once when component first mounts (for development)
  useEffect(() => {
    if (isOpen) {
      // Only run tests once per session
      const hasTestedAPI = sessionStorage.getItem('groq-api-tested');
      if (!hasTestedAPI) {
        console.log('🧪 Running one-time API tests...');
        
        testGroqAPI().then(result => {
          console.log('🧪 Grok API Test Result:', result);
        });
        
        testGroqTranscription().then(result => {
          console.log('🎤 Grok Transcription Test Result:', result);
        });
        
        sessionStorage.setItem('groq-api-tested', 'true');
      }
    }
  }, [isOpen]);

  const handleStop = () => {
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    stopVoiceRecording();
    
    // Pass the transcript back to the parent component (exclude starting messages)
    const cleanTranscript = finalTranscript || transcript;
    if (onTranscriptComplete && cleanTranscript && 
        !cleanTranscript.includes('Starting') && 
        !cleanTranscript.includes('🎤') &&
        cleanTranscript.trim().length > 0) {
      onTranscriptComplete(cleanTranscript.trim());
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}
    >
      {/* Recording Indicator - Top Right */}
      <div className="absolute top-6 right-6 flex items-center space-x-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className={`text-sm font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          REC
        </span>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center space-y-8">
        {/* Real Siri Waveform */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative flex items-center justify-center"
        >
          <SiriWaveform
            isActive={voiceIsRecording}
            width={350}
            height={200}
            color="#1B365D"
            isDarkMode={isDarkMode}
            onMicrophoneError={(error) => {
              console.error('Microphone error:', error);
            }}
          />
        </motion.div>

        {/* Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <span className={`text-3xl font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
          </span>
        </motion.div>

        {/* Status Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {isProcessing ? 'Processing...' : voiceError ? 'Tap to speak' : voiceIsRecording ? 'Listening...' : 'Ready'}
          </p>
          {voiceError && (
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Voice recognition may not be available - you can still type your message
            </p>
          )}
        </motion.div>

      </div>

      {/* Minimal Stop Button - Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-8"
      >
        <button
          onClick={handleStop}
          className={`w-16 h-16 rounded-full transition-all duration-300 transform hover:scale-110 focus:outline-none ${
            isDarkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
          }`}
        >
          <svg className="w-6 h-6 mx-auto" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  );
};

export default VoiceRecording;
