const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onInstallProgress: (callback) => {
    ipcRenderer.on("install-progress", (_event, value) => callback(value));
    // Return a cleanup function that removes the listener
    return () => ipcRenderer.removeListener("install-progress", callback);
  },

  onInstallDone: (callback) => {
    ipcRenderer.on("install-done", () => callback());
    // Return a cleanup function that removes the listener
    return () => ipcRenderer.removeListener("install-done", callback);
  },

  setAutoStart: (enabled) =>
    ipcRenderer.send("set-auto-start", enabled),

  getNotificationSound: () => ipcRenderer.invoke('get-notification-sound'),
  setNotificationSound: (filePath) => ipcRenderer.invoke('set-notification-sound', filePath),
  resetNotificationSound: () => ipcRenderer.invoke('reset-notification-sound'),
  selectSoundFile: () => ipcRenderer.invoke('select-sound-file'),
  testNotificationSound: () => ipcRenderer.invoke('test-notification-sound'),
  onBackgroundNotification: (cb) => {
    ipcRenderer.on('show-background-notification', (event, ...args) => cb(...args));
  },
  
});