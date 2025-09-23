// src/pages/VoiceInputPage.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useHybridVoiceRecognition from '../../components/VoiceRecorder/useVoiceRecognition';

const VoiceInputPage = () => {
  const navigate = useNavigate();
  const [isMicHovered, setIsMicHovered] = useState(false);
  
  const {
    isRecording,
    transcript,
    error,
    isProcessing,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useHybridVoiceRecognition();

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
          
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Voice Input</h1>
            <p className="text-gray-600 mt-1">Speak naturally to transcribe</p>
          </div>
          
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>
      </div>

      {/* Animated Blob Section */}
      <div className="flex-1 relative min-h-[35vh] flex flex-col items-center justify-center px-6">
        {/* Moving Blob */}
        <div className="relative flex items-center justify-center mb-8">
          <AnimatePresence>
            {isRecording ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative"
              >
                {/* Moving Blob when speaking */}
                <motion.div
                  className="relative w-40 h-40"
                  animate={{
                    x: [0, 25, -15, 10, 0],
                    y: [0, -20, 10, -5, 0],
                    rotate: [0, 3, -2, 1, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-[#0033A0] rounded-[45%_55%_60%_40%_/_50%_45%_55%_50%]"
                    animate={{
                      borderRadius: [
                        "45% 55% 60% 40% / 50% 45% 55% 50%",
                        "55% 45% 40% 60% / 55% 50% 50% 45%", 
                        "50% 50% 55% 45% / 45% 55% 45% 55%",
                        "45% 55% 60% 40% / 50% 45% 55% 50%"
                      ],
                      scale: [1, 1.03, 0.98, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      boxShadow: "0 0 25px rgba(0, 51, 160, 0.25)"
                    }}
                  />
                </motion.div>
              </motion.div>
            ) : (
              /* Static blob when not speaking */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-32 h-32 bg-[#0033A0] rounded-full opacity-15"
                style={{
                  boxShadow: "0 0 15px rgba(0, 51, 160, 0.15)"
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Listening text - BELOW the blob */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4"
            >
              <p className="text-[#0033A0] font-medium flex items-center justify-center">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 bg-[#0033A0] rounded-full mr-2"
                />
                Listening... Speak now
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transcript Preview Section */}
      <div className="px-6 py-6 flex-1 flex flex-col justify-center">
        <div className="max-w-4xl mx-auto w-full">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200"
              >
                <p className="text-red-700 text-center">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript text */}
          <motion.div
            className="text-center min-h-[120px] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence mode="wait">
              {transcript ? (
                <motion.div
                  key="transcript"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <p className="text-2xl font-light text-gray-800 leading-relaxed px-4">
                    {transcript}
                  </p>
                  {!isRecording && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={clearTranscript}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
                    >
                      Clear text
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-gray-400"
                >
                  <p className="text-lg px-4">
                    {isRecording ? "Speak now..." : "Your transcription will appear here"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center"
            >
              <p className="text-[#0033A0] flex items-center justify-center">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-[#0033A0] border-t-transparent rounded-full mr-2"
                />
                Processing your speech...
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Microphone Section */}
      <div className="px-6 pb-10 pt-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center space-y-8">
            {/* Microphone Button with Sound Waves */}
            <div className="relative flex items-center justify-center">
              {/* Sound waves - positioned around microphone */}
              <AnimatePresence>
                {isRecording && (
                  <div className="absolute -inset-4 flex items-center justify-center">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: [0.8, 1.2 + i * 0.3],
                          opacity: [0.3, 0.6 - i * 0.2, 0]
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute border-2 border-[#0033A0] rounded-full"
                        style={{
                          width: 80 + i * 40,
                          height: 80 + i * 40,
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: "easeOut"
                        }}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {/* Microphone Button - White background when recording */}
              <motion.button
                onHoverStart={() => setIsMicHovered(true)}
                onHoverEnd={() => setIsMicHovered(false)}
                onClick={handleMicClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative w-24 h-24 rounded-full border-4 flex items-center justify-center
                  transition-all duration-300 z-10
                  ${isRecording 
                    ? 'bg-white border-[#0033A0] shadow-2xl' 
                    : 'bg-[#0033A0] border-[#0033A0] hover:bg-blue-600 hover:shadow-xl'
                  }
                `}
              >
                <svg 
                  className={`w-10 h-10 transition-colors duration-300 ${
                    isRecording ? 'text-[#0033A0] scale-110' : 'text-white scale-100'
                  }`}
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  {isRecording ? (
                    // Stop icon (square)
                    <rect x="8" y="8" width="8" height="8" rx="1"/>
                  ) : (
                    // Mic icon
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                  )}
                </svg>

                {/* Recording pulse animation */}
                {isRecording && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#0033A0]"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.button>
            </div>

            {/* Instruction text */}
            <motion.p 
              className="text-gray-600 text-lg font-medium"
              animate={{
                opacity: isMicHovered ? 0.8 : 1
              }}
            >
              {isRecording ? 'Tap to stop' : 'Tap to speak'}
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceInputPage;