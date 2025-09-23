// src/components/VoiceRecorder/MicrophoneButton.jsx
import React from 'react';

const MicrophoneButton = ({ 
  isRecording, 
  onStart, 
  onStop, 
  disabled = false,
  size = "large" 
}) => {
  const sizes = {
    small: "w-8 h-8",
    medium: "w-12 h-12", 
    large: "w-16 h-16",
    xlarge: "w-20 h-20" // New XL size
  };

  // Define handleClick function
  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative rounded-full border-2 transition-all duration-300 
        flex items-center justify-center
        ${sizes[size]}
        ${isRecording 
          ? 'bg-red-500 border-red-600 scale-110 shadow-lg' 
          : 'bg-[#0033A0] border-[#0033A0] hover:bg-blue-600 hover:scale-105'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-4 focus:ring-blue-300
      `}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      {/* Mic Icon */}
      <svg 
        className={`w-1/2 h-1/2 text-white transition-transform duration-300 ${
          isRecording ? 'scale-110' : 'scale-100'
        }`}
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        {isRecording ? (
          // Stop icon
          <rect x="8" y="8" width="8" height="8" rx="1"/>
        ) : (
          // Mic icon
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
        )}
      </svg>
      
      {/* Recording animation */}
      {isRecording && (
        <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
      )}
    </button>
  );
};

export default MicrophoneButton;