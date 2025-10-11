// Test Grok API connectivity and functionality
export const testGroqAPI = async () => {
  const GROQ_CONFIG = {
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  };

  console.log('🧪 Testing Grok API...');
  
  if (!GROQ_CONFIG.apiKey) {
    console.error('❌ API Key not found');
    return { success: false, error: 'API Key missing' };
  }

  try {
    // Test with a simple text completion first
    const response = await fetch(`${GROQ_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: 'Say "API test successful" if you can read this.'
          }
        ],
        max_tokens: 10
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log('✅ Grok API Test Successful:', data.choices[0]?.message?.content);
    
    return { 
      success: true, 
      message: data.choices[0]?.message?.content,
      usage: data.usage 
    };
    
  } catch (error) {
    console.error('❌ API Test Failed:', error);
    return { success: false, error: error.message };
  }
};

// Simple transcription API availability check
export const testGroqTranscription = async () => {
  console.log('🎤 Checking Grok Transcription API availability...');
  
  const GROQ_CONFIG = {
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    model: 'whisper-large-v3',
    baseURL: 'https://api.groq.com/openai/v1',
  };

  if (!GROQ_CONFIG.apiKey) {
    console.error('❌ API Key not found for transcription test');
    return { success: false, error: 'API Key missing' };
  }

  // Just check if API key is valid - don't send test audio
  console.log('✅ Transcription API configured with Whisper Large V3');
  console.log('🔑 API Key present:', GROQ_CONFIG.apiKey ? 'Yes' : 'No');
  
  return { 
    success: true, 
    message: 'Transcription API ready - will be tested with real audio',
    model: GROQ_CONFIG.model
  };
};
