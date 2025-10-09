// Electron Nox Service - Communicates with backend via Electron main process
class ElectronNoxService {
  constructor() {
    this.isRunning = false;
    this.messageQueue = [];
    this.responseCallbacks = new Map();
    this.messageId = 0;
    this.setupIpcListeners();
  }

  // Setup IPC listeners for communication with main process
  setupIpcListeners() {
    if (window.electronAPI) {
      // Listen for backend responses
      window.electronAPI.onNoxResponse((response) => {
        this.handleBackendResponse(response);
      });

      // Listen for backend status updates
      window.electronAPI.onNoxStatus((status) => {
        console.log('🔄 Nox Backend Status:', status);
        this.isRunning = status.running;
        
        if (status.running && this.messageQueue.length > 0) {
          this.processMessageQueue();
        }
      });
    } else {
      console.warn('⚠️ Electron API not available - running in browser mode');
    }
  }

  // Start the Nox backend via Electron main process
  async startBackend() {
    return new Promise((resolve, reject) => {
      if (!window.electronAPI) {
        console.error('❌ Electron API not available');
        reject(new Error('Electron API not available'));
        return;
      }

      console.log('🚀 Starting Nox Backend via Electron...');
      
      // Request main process to start backend
      window.electronAPI.startNoxBackend()
        .then((result) => {
          if (result.success) {
            console.log('✅ Nox Backend started successfully');
            this.isRunning = true;
            resolve(true);
          } else {
            console.error('❌ Failed to start backend:', result.error);
            reject(new Error(result.error));
          }
        })
        .catch((error) => {
          console.error('❌ Backend startup error:', error);
          reject(error);
        });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.isRunning) {
          reject(new Error('Backend startup timeout'));
        }
      }, 10000);
    });
  }

  // Process queued messages
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const queuedMessage = this.messageQueue.shift();
      this.sendToBackend(queuedMessage.message, queuedMessage.callback);
    }
  }

  // Handle responses from the backend
  handleBackendResponse(data) {
    try {
      let response = data;
      
      // Parse if it's a string
      if (typeof data === 'string') {
        try {
          response = JSON.parse(data);
        } catch {
          response = { text: data };
        }
      }
      
      // Find the corresponding callback
      if (response.messageId && this.responseCallbacks.has(response.messageId)) {
        const callback = this.responseCallbacks.get(response.messageId);
        callback(response.text || response.message || response.toString());
        this.responseCallbacks.delete(response.messageId);
      } else {
        // Handle general responses - use the most recent callback
        const callbacks = Array.from(this.responseCallbacks.values());
        if (callbacks.length > 0) {
          const callback = callbacks[callbacks.length - 1];
          callback(response.text || response.message || response.toString());
          // Clear the callback after use
          const lastKey = Array.from(this.responseCallbacks.keys()).pop();
          this.responseCallbacks.delete(lastKey);
        }
      }
    } catch (error) {
      console.error('❌ Error handling backend response:', error);
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

      if (!window.electronAPI) {
        reject(new Error('Electron API not available'));
        return;
      }

      try {
        const messageId = ++this.messageId;
        this.responseCallbacks.set(messageId, resolve);

        // Send via Electron IPC
        window.electronAPI.sendNoxMessage({
          messageId,
          text: message,
          timestamp: new Date().toISOString()
        });

        console.log('📤 Sent to Nox:', message);

        // Timeout after 15 seconds
        setTimeout(() => {
          if (this.responseCallbacks.has(messageId)) {
            this.responseCallbacks.delete(messageId);
            resolve('Sorry, I didn\'t receive a response. Please try again.');
          }
        }, 15000);

      } catch (error) {
        console.error('❌ Error sending message:', error);
        reject(error);
      }
    });
  }

  // Stop the backend
  stopBackend() {
    if (window.electronAPI && this.isRunning) {
      console.log('🛑 Stopping Nox Backend...');
      window.electronAPI.stopNoxBackend();
      this.isRunning = false;
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
const electronNoxService = new ElectronNoxService();

export default electronNoxService;
