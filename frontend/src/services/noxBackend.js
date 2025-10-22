// Nox Backend Service - Manages communication with NoX_Backend.exe
import { spawn } from 'child_process';

class NoxBackendService {
  constructor() {
    this.process = null;
    this.isRunning = false;
    this.messageQueue = [];
    this.responseCallbacks = new Map();
    this.messageId = 0;
  }

  // Start the Nox backend executable
  async startBackend() {
    return new Promise((resolve, reject) => {
      try {
        console.log('🚀 Starting Nox Backend...');
        
        // Path to the backend executable
        const backendPath = '../backend/NoX_Backend 1.exe';
        
        // Start the process
        this.process = spawn(backendPath, [], {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true
        });

        // Handle process startup
        this.process.on('spawn', () => {
          console.log('✅ Nox Backend started successfully');
          this.isRunning = true;
          this.setupMessageHandling();
          resolve(true);
        });

        // Handle stdout (responses from Nox)
        this.process.stdout.on('data', (data) => {
          this.handleBackendResponse(data.toString());
        });

        // Handle stderr (errors)
        this.process.stderr.on('data', (data) => {
          console.error('❌ Nox Backend Error:', data.toString());
        });

        // Handle process exit
        this.process.on('exit', (code) => {
          console.log(`🔄 Nox Backend exited with code ${code}`);
          this.isRunning = false;
          this.process = null;
        });

        // Handle process errors
        this.process.on('error', (error) => {
          console.error('❌ Failed to start Nox Backend:', error);
          this.isRunning = false;
          reject(error);
        });

        // Timeout after 5 seconds if not started
        setTimeout(() => {
          if (!this.isRunning) {
            reject(new Error('Backend startup timeout'));
          }
        }, 5000);

      } catch (error) {
        console.error('❌ Error starting backend:', error);
        reject(error);
      }
    });
  }

  // Setup message handling
  setupMessageHandling() {
    // Process any queued messages
    while (this.messageQueue.length > 0) {
      const queuedMessage = this.messageQueue.shift();
      this.sendToBackend(queuedMessage.message, queuedMessage.callback);
    }
  }

  // Handle responses from the backend
  handleBackendResponse(data) {
    try {
      // Parse the response (assuming JSON format)
      const response = JSON.parse(data);
      
      // Find the corresponding callback
      if (response.messageId && this.responseCallbacks.has(response.messageId)) {
        const callback = this.responseCallbacks.get(response.messageId);
        callback(response.text || response.message || data);
        this.responseCallbacks.delete(response.messageId);
      } else {
        // Handle general responses
        console.log('📨 Nox Response:', response);
      }
    } catch (error) {
      // If not JSON, treat as plain text response
      console.log('📨 Nox Response (text):', data);
      
      // Call the most recent callback if available
      const callbacks = Array.from(this.responseCallbacks.values());
      if (callbacks.length > 0) {
        const callback = callbacks[callbacks.length - 1];
        callback(data.trim());
        // Clear all callbacks after response
        this.responseCallbacks.clear();
      }
    }
  }

  // Send message to backend
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (!this.isRunning) {
        // Queue message if backend not ready
        this.messageQueue.push({ message, callback: resolve });
        console.log('📤 Message queued (backend not ready):', message);
        return;
      }

      try {
        const messageId = ++this.messageId;
        this.responseCallbacks.set(messageId, resolve);

        // Create message object
        const messageObj = {
          messageId,
          text: message,
          timestamp: new Date().toISOString()
        };

        // Send to backend
        this.process.stdin.write(JSON.stringify(messageObj) + '\n');
        console.log('📤 Sent to Nox:', message);

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.responseCallbacks.has(messageId)) {
            this.responseCallbacks.delete(messageId);
            resolve('Sorry, I didn\'t receive a response. Please try again.');
          }
        }, 10000);

      } catch (error) {
        console.error('❌ Error sending message:', error);
        reject(error);
      }
    });
  }

  // Stop the backend
  stopBackend() {
    if (this.process && this.isRunning) {
      console.log('🛑 Stopping Nox Backend...');
      this.process.kill();
      this.isRunning = false;
      this.process = null;
      this.responseCallbacks.clear();
      this.messageQueue = [];
    }
  }

  // Check if backend is running
  isBackendRunning() {
    return this.isRunning;
  }
}

// Create singleton instance
const noxBackend = new NoxBackendService();

export default noxBackend;
