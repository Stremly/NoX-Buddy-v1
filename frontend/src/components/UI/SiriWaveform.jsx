// SiriWaveform.jsx - Real-time Siri Waveform with Microphone Input
// Uses SiriWave library v2.4.0 with correct API

import React, { useRef, useEffect, useState } from 'react';
import SiriWave from 'siriwave';

const SiriWaveform = ({ 
  isActive = false,
  width = 300,
  height = 150,
  color = '#1B365D',
  isDarkMode = false,
  onMicrophoneError = null
}) => {
  const containerRef = useRef(null);
  const siriWaveRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [micPermission, setMicPermission] = useState('prompt');

  // Initialize SiriWave with correct v2.4.0 API
  useEffect(() => {
    if (containerRef.current && !siriWaveRef.current) {
      try {
        siriWaveRef.current = new SiriWave({
          container: containerRef.current,
          style: 'ios9',
          width: width,
          height: height,
          speed: 0.3,
          amplitude: 2,
          frequency: 4,
          color: isDarkMode ? '#9CA3AF' : color,
          cover: true,
          autostart: true
        });
        console.log('SiriWave initialized successfully');
        
        // Set initial amplitude to make it visible
        if (siriWaveRef.current) {
          siriWaveRef.current.setAmplitude(0.3);
        }
      } catch (error) {
        console.error('SiriWave initialization error:', error);
      }
    }

    return () => {
      if (siriWaveRef.current) {
        try {
          siriWaveRef.current.dispose();
        } catch (error) {
          console.error('SiriWave dispose error:', error);
        }
        siriWaveRef.current = null;
      }
    };
  }, [width, height, color, isDarkMode, isActive]);

  // Setup microphone and audio analysis
  const setupMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false, // Better for voice detection
          noiseSuppression: false, // Better for voice detection
          autoGainControl: false,  // Better for natural voice levels
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      setMicPermission('granted');
      microphoneRef.current = stream;

      // Create audio context and analyser
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // Configure analyser for voice detection
      analyserRef.current.fftSize = 2048; // Higher resolution for better voice detection
      analyserRef.current.smoothingTimeConstant = 0.3; // Less smoothing for more responsive
      
      // Connect microphone to analyser
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Start audio analysis
      startAudioAnalysis();

    } catch (error) {
      console.error('Microphone access denied:', error);
      setMicPermission('denied');
      
      // Fallback animation only when microphone is not available
      if (siriWaveRef.current && isActive) {
        try {
          // Create a gentle breathing animation as fallback
          const fallbackAnimation = () => {
            if (siriWaveRef.current && isActive && micPermission === 'denied') {
              const time = Date.now() / 1000;
              const breath = Math.sin(time * 0.8) * 0.15;
              const amplitude = 0.3 + breath;
              siriWaveRef.current.setAmplitude(Math.max(amplitude, 0.2));
              animationFrameRef.current = requestAnimationFrame(fallbackAnimation);
            }
          };
          fallbackAnimation();
        } catch (err) {
          console.error('SiriWave fallback animation error:', err);
        }
      }
      
      if (onMicrophoneError) {
        onMicrophoneError(error);
      }
    }
  };

  // Analyze audio and update waveform
  const startAudioAnalysis = () => {
    if (!analyserRef.current || !siriWaveRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(analyserRef.current.fftSize);

    const analyzeAudio = () => {
      if (!isActive || !siriWaveRef.current) return;

      // Get both frequency and time domain data for better voice detection
      analyserRef.current.getByteFrequencyData(dataArray);
      analyserRef.current.getByteTimeDomainData(timeDataArray);
      
      // Calculate RMS (Root Mean Square) for better voice detection
      let rms = 0;
      for (let i = 0; i < timeDataArray.length; i++) {
        const sample = (timeDataArray[i] - 128) / 128;
        rms += sample * sample;
      }
      rms = Math.sqrt(rms / timeDataArray.length);
      
      // Focus on voice frequency range (85Hz - 3400Hz for human speech)
      let voiceSum = 0;
      const voiceStart = Math.floor((85 / 22050) * bufferLength); // 85Hz
      const voiceEnd = Math.floor((3400 / 22050) * bufferLength); // 3400Hz
      
      for (let i = voiceStart; i < voiceEnd && i < bufferLength; i++) {
        voiceSum += dataArray[i];
      }
      const voiceAverage = voiceSum / (voiceEnd - voiceStart);
      
      // More responsive amplitude calculation
      let finalAmplitude;
      
      if (rms > 0.05) {
        // Strong voice detected - high amplitude
        finalAmplitude = Math.min(2 + (rms * 8), 5);
      } else if (rms > 0.02) {
        // Normal voice detected - medium amplitude  
        finalAmplitude = Math.min(1 + (rms * 6), 3);
      } else if (rms > 0.005) {
        // Quiet voice detected - low amplitude
        finalAmplitude = Math.min(0.5 + (rms * 4), 1.5);
      } else {
        // No voice or very quiet - baseline
        finalAmplitude = 0.2 + (voiceAverage / 255 * 0.3);
      }
      
      // Update SiriWave amplitude using correct API
      try {
        siriWaveRef.current.setAmplitude(finalAmplitude);
        
        // Debug logging for voice levels (remove in production)
        if (rms > 0.01) {
          console.log(`🎤 Voice Level - RMS: ${rms.toFixed(3)}, Amplitude: ${finalAmplitude.toFixed(2)}`);
        }
      } catch (error) {
        console.error('SiriWave setAmplitude error:', error);
      }

      // Continue analysis
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    };

    analyzeAudio();
  };

  // Handle activation/deactivation
  useEffect(() => {
    if (isActive && siriWaveRef.current) {
      // Start with baseline amplitude
      try {
        siriWaveRef.current.setAmplitude(0.3);
      } catch (error) {
        console.error('SiriWave setAmplitude error:', error);
      }
      
      // Try to setup microphone for real voice input
      setupMicrophone();
    } else if (!isActive && siriWaveRef.current) {
      // Stop all animations and audio analysis
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Set amplitude to 0 when inactive
      try {
        siriWaveRef.current.setAmplitude(0);
      } catch (error) {
        console.error('SiriWave setAmplitude error:', error);
      }
    }

    return () => {
      // Cleanup on unmount or deactivation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (microphoneRef.current) {
        microphoneRef.current.getTracks().forEach(track => track.stop());
        microphoneRef.current = null;
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isActive]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          background: 'transparent'
        }}
      />
      
      {/* Microphone permission status */}
      {micPermission === 'denied' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Microphone access required
          </p>
        </div>
      )}
    </div>
  );
};

export default SiriWaveform;
