const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const axios = require("axios");
require("dotenv").config();

let mainWindow;
let backendProcess;


const isDev = !app.isPackaged;
const backendURL = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const backendPort = process.env.BACKEND_PORT || 8000;
const reactDevURL = process.env.ELECTRON_START_URL || "http://localhost:3000";
const backendPath = path.join(__dirname, "backend", "dist", "backend.exe");

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

const startURL = isDev
  ? reactDevURL
  : `file://${path.join(__dirname, 'frontend', 'build', 'index.html').replace(/\\/g, '/')}`;


  mainWindow.loadURL(startURL);
  mainWindow.on("closed", () => (mainWindow = null));
}

async function startBackend() {
  console.log("Starting backend...");

  if (isDev) {
    
    backendProcess = spawn("python", [path.join(__dirname, "backend/main.py")], {
      stdio: "inherit",
    });
  } else {
    const backendExe = path.join(process.resourcesPath, "backend", "backend.exe");
    backendProcess = spawn(backendExe, [], { stdio: "inherit" });
  }

  let ready = false;
  while (!ready) {
    try {
      const res = await axios.get(`${backendURL}/ready`);
      if (res.status === 200 && res.data.status === "ready") {
        console.log("Backend is ready!");
        ready = true;
      }
    } catch (err) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// Quit app cleanly
ipcMain.on("quit-app", () => {
  if (backendProcess) backendProcess.kill();
  app.quit();
});

app.on("ready", async () => {
  await startBackend();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (backendProcess) backendProcess.kill();
    app.quit();
  }
});

app.on("activate", () => {
  if (!mainWindow) createWindow();
});
