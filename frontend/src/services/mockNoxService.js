// Mock Nox Service - Fallback for when backend is not available (macOS/browser mode)
class MockNoxService {
  constructor() {
    this.isRunning = false;
    this.messageQueue = [];
    this.responses = [
      "I'm currently running in demo mode. The full Nox backend is designed for Windows systems.",
      "Thanks for your message! I'm operating in limited mode right now.",
      "I understand you're trying to chat with me. Unfortunately, I'm running in compatibility mode.",
      "Hello! I'm Nox in demo mode. For full functionality, please use a Windows system.",
      "I appreciate your patience. I'm currently in fallback mode due to system compatibility.",
      "Your message has been received. I'm running with limited capabilities at the moment.",
      "I'm here, but operating in demo mode. Full features are available on Windows systems.",
      "Thanks for reaching out! I'm currently in compatibility mode for your system."
    ];
    this.responseIndex = 0;
  }

  async startBackend() {
    console.log('🔄 Starting Mock Nox Service (Demo Mode)');
    
    // Simulate startup delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.isRunning = true;
    console.log('✅ Mock Nox Service started (Demo Mode Active)');
    
    return Promise.resolve(true);
  }

  async sendMessage(message) {
    console.log('📤 Mock Nox received:', message);
    
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    // Get a response based on the message content
    let response = this.getContextualResponse(message);
    
    console.log('📨 Mock Nox response:', response);
    return response;
  }

  getContextualResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Contextual responses based on message content
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm Nox running in demo mode. I'm designed to work best on Windows systems, but I'm happy to chat with you here!";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return "I'm currently in demo mode due to system compatibility. On Windows, I can access my full AI capabilities, but right now I can provide basic responses and conversation.";
    }
    
    if (lowerMessage.includes('windows') || lowerMessage.includes('system') || lowerMessage.includes('compatibility')) {
      return "You're right! I'm designed to run natively on Windows systems. This demo mode gives you a preview of our conversation interface.";
    }
    
    if (lowerMessage.includes('mac') || lowerMessage.includes('macos') || lowerMessage.includes('apple')) {
      return "I see you're on a Mac! While my full backend is Windows-based, this demo shows you how our conversation interface works. Pretty neat, right?";
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're welcome! I'm glad I could help, even in this limited demo mode.";
    }
    
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
      return "Goodbye! Thanks for trying out Nox-Buddy. Remember, the full experience is available on Windows!";
    }
    
    // Default rotating responses
    const response = this.responses[this.responseIndex];
    this.responseIndex = (this.responseIndex + 1) % this.responses.length;
    return response;
  }

  stopBackend() {
    console.log('🛑 Stopping Mock Nox Service');
    this.isRunning = false;
  }

  isBackendRunning() {
    return this.isRunning;
  }
}

// Create singleton instance
const mockNoxService = new MockNoxService();

export default mockNoxService;
