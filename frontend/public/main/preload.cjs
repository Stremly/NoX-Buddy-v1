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

  // Auto-start functionality
  setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
  getAutoStart: () => ipcRenderer.invoke('get-auto-start')
});
