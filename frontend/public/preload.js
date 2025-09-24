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
});