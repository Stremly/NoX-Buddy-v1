// src/components/VoiceRecorder/useHybridVoiceRecognition.js
import { useState, useRef, useCallback } from 'react';

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
    apiKey: process.env.REACT_APP_GROQ_API_KEY,
    model: 'whisper-large-v3',
    baseURL: 'https://api.groq.com/openai/v1',
  };

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
      console.warn('Speech recognition error:', event.error);
      // Don't show errors for common issues like no-speech
      if (event.error !== 'no-speech') {
        setInterimTranscript('');
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        // Auto-restart if still recording
        recognition.start();
      }
    };

    return recognition;
  }, [isRecording]);

  // Groq for final, accurate transcription
  const transcribeWithGroq = useCallback(async (audioBlob) => {
    if (!audioBlob || audioBlob.size < 5000) return null;

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
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

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return data.text.trim();
      
    } catch (err) {
      console.error('Groq transcription failed:', err);
      return null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('🎤 Starting...');
      finalAudioBufferRef.current = [];

      // Get audio stream for Groq recording
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      
      // Setup MediaRecorder for Groq
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
          
          const groqText = await transcribeWithGroq(audioBlob);
          if (groqText) {
            // Replace Web Speech text with more accurate Groq text
            setTranscript(groqText);
          }
          setIsProcessing(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      // Start Web Speech API for real-time
      const recognition = setupSpeechRecognition();
      recognitionRef.current = recognition;
      recognition.start();

      // Start MediaRecorder for Groq
      mediaRecorder.start(1000);
      setIsRecording(true);
      setInterimTranscript('🎤 Listening...');
      
    } catch (err) {
      setError(`Failed to start recording: ${err.message}`);
      setIsRecording(false);
    }
  }, [setupSpeechRecognition, transcribeWithGroq]);

  const stopRecording = useCallback(() => {
    if (isRecording) {
      // Stop Web Speech
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      // Stop MediaRecorder (this will trigger Groq processing)
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
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