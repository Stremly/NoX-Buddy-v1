// src/components/VoiceRecorder/MovingBlob.jsx
import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBlob = ({ isRecording }) => {
  if (!isRecording) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Main moving blob */}
      <motion.div
        className="relative w-40 h-40" // Much smaller
        animate={{
          // Floating movement around the screen
          x: [0, 30, -20, 10, 0],
          y: [0, -25, 15, -10, 0],
          rotate: [0, 5, -3, 2, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Sharp blob shape */}
        <motion.div
          className="absolute inset-0 bg-[#0033A0]"
          animate={{
            borderRadius: [
              "45% 55% 60% 40% / 50% 45% 55% 50%",
              "55% 45% 40% 60% / 55% 50% 50% 45%", 
              "50% 50% 55% 45% / 45% 55% 45% 55%",
              "45% 55% 60% 40% / 50% 45% 55% 50%"
            ],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            filter: "blur(0px)", // Sharp edges
            boxShadow: "0 0 20px rgba(0, 51, 160, 0.4)"
          }}
        />

        {/* Inner shine */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-1/3 h-1/3 rounded-full bg-white opacity-30"
          animate={{
            x: [-5, 5, -5],
            y: [-3, 3, -3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </div>
  );
};

export default AnimatedBlob;