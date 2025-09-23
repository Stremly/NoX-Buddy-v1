// src/components/VoiceRecorder/VoiceRecorder.jsx
import React from 'react';
import { useHybridVoiceRecognition } from './useVoiceRecognition';
import MicrophoneButton from './MicrophoneButton';
import AnimatedBlob from './AnimatedBlob';

const VoiceRecorder = () => {
  const {
    isRecording,
    transcript,
    finalTranscript,
    interimTranscript,
    error,
    isProcessing,
    stream,
    startRecording,
    stopRecording,
    clearTranscript,
    setTranscript
  } = useHybridVoiceRecognition();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="text-center pt-8 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Voice Input</h1>
        <p className="text-gray-600 mt-2">Speak naturally and see your words appear</p>
      </div>

      {/* Animated Blob Section - Top */}
      <div className="flex-1 relative min-h-[400px] flex items-center justify-center">
        <AnimatedBlob isRecording={isRecording} stream={stream} />
        
        {/* Centered microphone icon when not recording */}
        {!isRecording && (
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-[#0033A0] rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
              </svg>
            </div>
            <p className="text-gray-500">Click the microphone below to start</p>
          </div>
        )}
      </div>

      {/* Speech Preview Section - Middle */}
      <div className="px-6 py-4 flex-1 flex flex-col justify-center">
        <div className="max-w-2xl mx-auto w-full">
          {/* Status Indicators */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          {isProcessing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-blue-700 text-sm flex items-center justify-center">
                <span className="animate-pulse mr-2">🔄</span>
                Processing final transcription...
              </p>
            </div>
          )}

          {/* Speech Preview */}
          <div className="bg-gray-50 rounded-lg p-6 min-h-[120px]">
            {transcript ? (
              <div className="space-y-3">
                <p className="text-gray-700 text-lg leading-relaxed">{transcript}</p>
                
                {interimTranscript && (
                  <div className="border-t pt-3">
                    <p className="text-blue-600 text-sm flex items-center">
                      <span className="animate-pulse mr-2">●</span>
                      Listening: {interimTranscript}...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 h-full flex items-center justify-center">
                <p>Your speech will appear here...</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
            <span>
              {finalTranscript.length} characters • {finalTranscript.split(/\s+/).filter(w => w).length} words
            </span>
            {isRecording && (
              <span className="text-[#0033A0] font-medium flex items-center">
                <span className="w-2 h-2 bg-[#0033A0] rounded-full animate-ping mr-1"></span>
                Recording
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Voice Record Button Section - Bottom */}
      <div className="px-6 py-8 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex flex-col items-center space-y-4">
            {/* Microphone Button */}
            <MicrophoneButton
              isRecording={isRecording}
              onStart={startRecording}
              onStop={stopRecording}
              size="xlarge"
            />
            
            {/* Button Label */}
            <p className="text-sm text-gray-600">
              {isRecording ? 'Click to stop recording' : 'Click to start speaking'}
            </p>

            {/* Clear Button */}
            {finalTranscript && !isRecording && (
              <button
                onClick={clearTranscript}
                className="px-6 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 border border-gray-300"
              >
                Clear Text
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs text-gray-500">
            💡 Real-time transcription powered by Web Speech API • Final accuracy enhanced by Groq Whisper
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;