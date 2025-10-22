// Nox Service Manager - Chooses appropriate service based on platform and availability
import electronNoxService from './electronNoxService';
import mockNoxService from './mockNoxService';

class NoxServiceManager {
  constructor() {
    this.activeService = null;
    this.serviceType = 'unknown';
    this.platformMessageShown = false;
    this.initializeService();
  }

  // Detect platform and available services
  initializeService() {
    // Check if we're in Electron
    const isElectron = window.electronAPI !== undefined;
    
    // Detect OS
    const userAgent = navigator.userAgent;
    const isMac = /Mac|iPhone|iPod|iPad/.test(userAgent);
    const isWindows = /Win/.test(userAgent);
    const isLinux = /Linux/.test(userAgent);
    
    console.log('🔍 Platform Detection:');
    console.log('- Electron:', isElectron);
    console.log('- macOS:', isMac);
    console.log('- Windows:', isWindows);
    console.log('- Linux:', isLinux);
    
    // Choose service based on platform and capabilities
    if (isElectron) {
      // Electron app - use real backend on all platforms (Windows, macOS, Linux)
      this.activeService = electronNoxService;
      if (isWindows) {
        this.serviceType = 'electron-windows';
        console.log('✅ Using Electron Nox Service (Full Features - Windows)');
      } else if (isMac) {
        this.serviceType = 'electron-macos';
        console.log('✅ Using Electron Nox Service (Full Features - macOS)');
      } else if (isLinux) {
        this.serviceType = 'electron-linux';
        console.log('✅ Using Electron Nox Service (Full Features - Linux)');
      }
      console.log('🔧 Python backend will be started automatically');
    } else {
      // Browser mode - use mock service
      this.activeService = mockNoxService;
      this.serviceType = 'browser';
      console.log('⚠️ Using Mock Nox Service (Browser Mode)');
      console.log('💡 Download desktop app for full features');
    }
  }

  // Get platform-specific status message
  getStatusMessage() {
    switch (this.serviceType) {
      case 'electron-windows':
        return 'Nox Backend running with full capabilities on Windows';
      case 'electron-macos':
        return 'Nox Backend running with full capabilities on macOS';
      case 'electron-linux':
        return 'Nox Backend running with full capabilities on Linux';
      case 'browser':
        return 'Demo mode: Running in browser - full features available in desktop app';
      default:
        return 'Nox service status unknown';
    }
  }

  // Check if we're using the real backend
  isUsingRealBackend() {
    return this.serviceType === 'electron-windows' || 
           this.serviceType === 'electron-macos' || 
           this.serviceType === 'electron-linux';
  }

  // Delegate all service calls to the active service
  async startBackend() {
    try {
      const result = await this.activeService.startBackend();
      console.log('📊 Service Status:', this.getStatusMessage());
      return result;
    } catch (error) {
      console.error('❌ Backend startup failed:', error);
      
      // Fallback to mock service if real backend fails
      if (this.isUsingRealBackend()) {
        console.log('🔄 Falling back to Mock Service');
        this.activeService = mockNoxService;
        this.serviceType = 'fallback';
        return await this.activeService.startBackend();
      }
      
      throw error;
    }
  }

  async sendMessage(message) {
    return await this.activeService.sendMessage(message);
  }

  stopBackend() {
    return this.activeService.stopBackend();
  }

  isBackendRunning() {
    return this.activeService.isBackendRunning();
  }

  // Get user-friendly platform message (only once)
  getPlatformMessage() {
    if (this.platformMessageShown) {
      return null; // Don't show message again
    }

    let message = null;
    switch (this.serviceType) {
      case 'electron-windows':
      case 'electron-macos':
      case 'electron-linux':
        message = null; // No message needed - everything works
        break;
      case 'browser':
        message = '🌐 You\'re in browser mode. Download our desktop app for the full Nox experience!';
        break;
      case 'fallback':
        message = '⚠️ Backend connection failed. Running in demo mode.';
        break;
      default:
        message = '❓ Platform detection incomplete.';
        break;
    }

    if (message) {
      this.platformMessageShown = true; // Mark as shown
    }

    return message;
  }
}

// Create singleton instance
const noxServiceManager = new NoxServiceManager();

export default noxServiceManager;
