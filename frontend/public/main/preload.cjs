const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Nox Backend Management
  startNoxBackend: () => ipcRenderer.invoke('start-nox-backend'),
  stopNoxBackend: () => ipcRenderer.invoke('stop-nox-backend'),
  sendNoxMessage: (message) => ipcRenderer.invoke('send-nox-message', message),
  getNoxBackendStatus: () => ipcRenderer.invoke('nox-backend-status'),

  // Event listeners
  onNoxResponse: (callback) => {
    ipcRenderer.on('nox-response', (event, response) => callback(response));
  },
  onNoxStatus: (callback) => {
    ipcRenderer.on('nox-status', (event, status) => callback(status));
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Tray functionality
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  showFromTray: () => ipcRenderer.invoke('show-from-tray'),

  // Window resize functionality for minimize
  resizeWindowForMinimize: () => {
    console.log('🔽 Preload: Calling resize-window-for-minimize');
    return ipcRenderer.invoke('resize-window-for-minimize');
  },
  restoreWindowFromMinimize: () => {
    console.log('🔼 Preload: Calling restore-window-from-minimize');
    return ipcRenderer.invoke('restore-window-from-minimize');
  },
  expandWindowForConversation: (height) => {
    console.log('🔼 Preload: Calling expand-window-for-conversation with height:', height);
    return ipcRenderer.invoke('expand-window-for-conversation', height);
  },
  collapseWindowToSearchbar: () => {
    console.log('🔽 Preload: Calling collapse-window-to-searchbar');
    return ipcRenderer.invoke('collapse-window-to-searchbar');
  },

  // Debug function to test API availability
  testAPI: () => {
    console.log('🧪 Testing Electron API availability');
    return { success: true, message: 'Electron API is working' };
  },

  // Auto-start functionality
  setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
  getAutoStart: () => ipcRenderer.invoke('get-auto-start')
});
