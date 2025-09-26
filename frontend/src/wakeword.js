import { Model, Recognizer } from 'vosk-browser';

let model = null;
let recognizer = null;
let audioContext = null;
let processor = null;
let source = null;
let stream = null;

// Model configuration
const MODEL_PATH = '/models/vosk-model-small-en-us-0.15'; // Path to your model
const SAMPLE_RATE = 16000;
const WAKE_WORDS = ['hey nox', 'hello nox', 'wake up nox']; // Add your wake words

/**
 * Load the Vosk model
 */
export async function loadModel() {
  if (model) return model;

  try {
    console.log('Loading Vosk model...');
    model = await Model.load(MODEL_PATH);
    console.log('✅ Vosk model loaded successfully');
    return model;
  } catch (error) {
    console.error('❌ Failed to load Vosk model:', error);
    throw error;
  }
}

/**
 * Initialize the recognizer with the loaded model
 */
export async function initRecognizer() {
  if (recognizer) return recognizer;

  try {
    const model = await loadModel();
    
    recognizer = new Recognizer({
      model: model,
      sampleRate: SAMPLE_RATE,
      words: true, // Enable word-level timestamps
      partialResults: true // Get partial results for faster response
    });

    console.log('✅ Recognizer initialized');
    return recognizer;
  } catch (error) {
    console.error('❌ Failed to initialize recognizer:', error);
    throw error;
  }
}

/**
 * Check if the recognized text contains any wake words
 */
function checkForWakeWord(text) {
  const cleanText = text.toLowerCase().trim();
  return WAKE_WORDS.some(wakeWord => cleanText.includes(wakeWord.toLowerCase()));
}

/**
 * Start listening for wake words
 */
export async function startWakeWordListener(onWakeWordDetected) {
  try {
    // Clean up any existing instances
    await stopWakeWordListener();

    // Initialize recognizer
    await initRecognizer();

    // Get microphone access
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: SAMPLE_RATE,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      },
      video: false
    });

    // Set up audio context
    audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

    // Load audio worklet processor
    try {
      await audioContext.audioWorklet.addModule('/resources/processor.js');
    } catch (error) {
      console.error('❌ Failed to load audio worklet:', error);
      // Fallback: try relative path
      await audioContext.audioWorklet.addModule('./resources/processor.js');
    }

    // Create audio nodes
    source = audioContext.createMediaStreamSource(stream);
    processor = new AudioWorkletNode(audioContext, 'vosk-processor');

    // Connect audio nodes
    source.connect(processor);
    processor.connect(audioContext.destination);

    // Initialize processor
    processor.port.postMessage({
      command: 'init',
      sampleRate: SAMPLE_RATE,
      bufferSize: 4096
    });

    // Handle audio data from processor
    processor.port.onmessage = async (event) => {
      if (event.data.audio && recognizer) {
        try {
          // Convert Float32 to Int16 for Vosk
          const audioData = event.data.audio;
          const int16Data = new Int16Array(audioData.length);
          
          for (let i = 0; i < audioData.length; i++) {
            int16Data[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
          }

          // Accept waveform data
          if (recognizer.acceptWaveform(int16Data)) {
            const result = recognizer.result();
            if (result && result.text) {
              console.log('Recognized:', result.text);
              
              if (checkForWakeWord(result.text)) {
                console.log('🚀 Wake word detected!');
                onWakeWordDetected(result.text);
                
                // Reset recognizer for next detection
                recognizer.reset();
              }
            }
          } else {
            // Get partial results for real-time feedback
            const partialResult = recognizer.partialResult();
            if (partialResult && partialResult.partial) {
              console.log('Partial:', partialResult.partial);
            }
          }
        } catch (error) {
          console.error('Error processing audio:', error);
        }
      }
    };

    console.log('🎤 Wake word listener started');
    return true;

  } catch (error) {
    console.error('❌ Failed to start wake word listener:', error);
    await stopWakeWordListener();
    throw error;
  }
}

/**
 * Stop listening and clean up resources
 */
export async function stopWakeWordListener() {
  try {
    // Stop audio processing
    if (processor) {
      processor.port.close();
      processor.disconnect();
      processor = null;
    }

    // Stop audio source
    if (source) {
      source.disconnect();
      source = null;
    }

    // Close audio context
    if (audioContext) {
      await audioContext.close();
      audioContext = null;
    }

    // Stop media stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    // Clean up recognizer
    if (recognizer) {
      recognizer.free();
      recognizer = null;
    }

    console.log('🔇 Wake word listener stopped');
  } catch (error) {
    console.error('Error stopping wake word listener:', error);
  }
}

/**
 * Check if wake word listener is active
 */
export function isListening() {
  return !!(stream && recognizer && audioContext);
}

/**
 * Get current listening status
 */
export function getListeningStatus() {
  return {
    isListening: isListening(),
    modelLoaded: !!model,
    recognizerReady: !!recognizer,
    streamActive: !!stream
  };
}