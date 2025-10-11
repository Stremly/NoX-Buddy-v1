// src/hooks/useHybridVoiceRecognition.js
import { useState, useRef, useCallback, useEffect } from 'react';

export const useHybridVoiceRecognition = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const finalAudioBufferRef = useRef([]);

  const GROQ_CONFIG = {
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    model: 'whisper-large-v3',
    baseURL: 'https://api.groq.com/openai/v1',
  };

  // Validate API key on hook initialization
  useEffect(() => {
    if (!GROQ_CONFIG.apiKey) {
      console.warn('Groq API key not found. Voice transcription will use Web Speech API only.');
    }
  }, []);

  // Web Speech API for real-time transcription
  const setupSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      // Update real-time display
      if (interim) {
        setInterimTranscript(interim);
      }
      
      if (final) {
        setTranscript(prev => prev + final);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event) => {
      // Only log significant errors, ignore common ones
      if (!['no-speech', 'aborted', 'network'].includes(event.error)) {
        console.warn('Speech recognition error:', event.error);
      }
      
      // Don't show errors for common issues
      if (!['no-speech', 'aborted'].includes(event.error)) {
        setError(`Speech recognition: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (isRecording && recognitionRef.current) {
        // Auto-restart if still recording, with small delay to prevent rapid restarts
        setTimeout(() => {
          if (isRecording && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Ignore restart errors
            }
          }
        }, 100);
      }
    };

    return recognition;
  }, [isRecording]);

  // Groq for final, accurate transcription
  const transcribeWithGroq = useCallback(async (audioBlob) => {
    // Skip if no API key or invalid audio
    if (!GROQ_CONFIG.apiKey || !audioBlob || audioBlob.size < 10000) {
      console.log('Skipping Groq transcription: API key missing or audio too small');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', GROQ_CONFIG.model);
      formData.append('language', 'en');
      formData.append('response_format', 'json');

      const response = await fetch(`${GROQ_CONFIG.baseURL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_CONFIG.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Don't show error to user for invalid media files - just use Web Speech result
        if (response.status === 400 && errorText.includes('could not process file')) {
          console.log('Groq could not process audio file, using Web Speech result instead');
          return null;
        }
        throw new Error(`Groq API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const transcribedText = data.text?.trim();
      
      if (transcribedText && transcribedText.length > 0) {
        console.log('✅ Groq transcription successful:', transcribedText);
        return transcribedText;
      }
      
      return null;
      
    } catch (err) {
      // Only show user-facing errors for non-media issues
      if (!err.message.includes('could not process file')) {
        console.error('Groq transcription failed:', err);
        setError(`Transcription error: ${err.message}`);
      } else {
        console.log('Using Web Speech result due to audio processing issue');
      }
      return null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      finalAudioBufferRef.current = [];

      // Try to get audio stream for Groq recording
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          } 
        });
        streamRef.current = stream;
      } catch (micError) {
        console.warn('Microphone access failed, continuing without audio recording:', micError);
        // Continue without microphone - user can still use the interface
      }
      
      // Setup MediaRecorder for Groq (only if we have a stream)
      if (stream) {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            finalAudioBufferRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Use Groq for final, accurate transcription
          if (finalAudioBufferRef.current.length > 0) {
            setIsProcessing(true);
            const audioBlob = new Blob(finalAudioBufferRef.current, { 
              type: 'audio/webm;codecs=opus' 
            });
            
            // Only send to Groq if we have substantial audio data
            if (audioBlob.size > 10000) { // At least 10KB of audio data
              const groqText = await transcribeWithGroq(audioBlob);
              if (groqText && groqText.trim()) {
                // Replace Web Speech text with more accurate Groq text
                setTranscript(groqText);
              }
            } else {
              console.log('Audio too short for Groq transcription, using Web Speech result');
            }
            setIsProcessing(false);
          }
          
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        };

        // Start MediaRecorder for Groq
        mediaRecorder.start(1000);
      }

      // Start Web Speech API for real-time (if available)
      try {
        const recognition = setupSpeechRecognition();
        recognitionRef.current = recognition;
        recognition.start();
      } catch (speechError) {
        console.warn('Web Speech API not available:', speechError);
        setError('Voice recognition not available in this browser');
      }

      setIsRecording(true);
      
      // Small delay to ensure everything is initialized
      setTimeout(() => {
        setInterimTranscript('Listening...');
      }, 500);
      
    } catch (err) {
      console.error('Recording start error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(`Failed to start recording: ${err.message}`);
      }
      setIsRecording(false);
    }
  }, [setupSpeechRecognition, transcribeWithGroq]);

  const stopRecording = useCallback(() => {
    if (isRecording) {
      // Stop Web Speech
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      
      // Stop MediaRecorder (this will trigger Groq processing)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Clean up audio stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
      
      setIsRecording(false);
      setInterimTranscript('');
    }
  }, [isRecording]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  // Combined display with real-time feedback
  const displayTranscript = interimTranscript ? 
    (transcript + (transcript ? ' ' : '') + interimTranscript) : 
    transcript;

  return {
    isRecording,
    transcript: displayTranscript,
    finalTranscript: transcript,
    interimTranscript,
    error,
    isProcessing,
    stream: streamRef.current,
    startRecording,
    stopRecording,
    clearTranscript,
    setTranscript
  };
};

export default useHybridVoiceRecognition;
