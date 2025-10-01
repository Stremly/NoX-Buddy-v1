const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  quitApp: () => ipcRenderer.send("quit-app"),

  toggleView: () => ipcRenderer.send("toggle-view"),
});
