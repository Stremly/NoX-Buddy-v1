const { app, BrowserWindow, Tray, Menu, dialog, ipcMain, nativeImage, Notification } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require('child_process');
const player = require('node-wav-player');

const configPath = path.join(__dirname, "settings.json");

let win;
let tray = null;
let isQuitting = false;
let hasShownTrayNotification = false;


const DEFAULT_SOUND_PATH = path.join(__dirname, "sounds", "default-notification.mp3");
const SOUNDS_DIR = path.join(__dirname, "sounds");


if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}


function loadSettings() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return { autoStart: false, notificationSound: null };
}


function saveSettings(settings) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

let audioWin = null;

function formatFilePath(filePath) {
  return encodeURI(filePath.replace(/\\/g, '/'));
}


function playNotificationSound() {
  const settings = loadSettings();
  const soundPath = settings.notificationSound || DEFAULT_SOUND_PATH;

  if (!fs.existsSync(soundPath)) {
    console.error("Sound file does not exist:", soundPath);
    return;
  }

  player.play({
    path: soundPath,
    sync: false, 
  }).then(() => {
    console.log("Notification sound played successfully");
  }).catch((error) => {
    console.error("Error playing sound:", error);
  });
}


function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load installer first
  win.loadURL("http://localhost:3000/installer");

  // Track if installation has already completed
  let installationCompleted = false;

  // Wait for the page to be fully ready before starting progress
  win.webContents.on('did-finish-load', () => {
    const currentURL = win.webContents.getURL();
    console.log("Page loaded:", currentURL);
    
    if (currentURL.includes("/installer") && !installationCompleted) {
      setTimeout(() => {
        let progress = 0;
        const interval = setInterval(() => {
          if (installationCompleted || !win || win.isDestroyed()) {
            clearInterval(interval);
            return;
          }
          
          progress += 5;
          console.log("Sending progress:", progress);
          
          if (progress <= 100) {
            win.webContents.send("install-progress", progress);
          }
          
          if (progress >= 100) {
            installationCompleted = true;
            clearInterval(interval);
            console.log("Installation complete");
            win.webContents.send("install-done");

            setTimeout(() => {
              if (win && !win.isDestroyed() && win.webContents.getURL().includes("/installer")) {
                win.loadURL("http://localhost:3000/settings");
              }
            }, 1500);
          }
        }, 500);
      }, 1000);
    }
  });

  // Window close event
  win.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      hideWindow();
      return false;
    }
  });
}

function createTray() {
  const iconPath = path.resolve(__dirname, "logo-stremly.png");
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open App",
      click: () => {
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    {
      label: "Quit",
      click: async () => {
        const result = await dialog.showMessageBox(win, {
          type: "question",
          buttons: ["Yes", "No"],
          title: "Confirm Quit",
          message: "Are you sure you want to quit?",
        });

        if (result.response === 0) {
          isQuitting = true;
          app.quit();
        }
      },
    },
  ]);

  tray.setToolTip("NoX Buddy");
  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    if (win) {
      showWindow();
      win.focus();
    }
  });
}

function hideWindow() {
  if (win && !win.isDestroyed()) {
    win.setOpacity(0.8);
    setTimeout(() => {
      win.setOpacity(0.6);
      setTimeout(() => {
        win.setOpacity(0.3);
        setTimeout(() => {
          win.hide();
          win.setOpacity(1);

          if (tray && !hasShownTrayNotification) {
            hasShownTrayNotification = true;

            setTimeout(() => {
              // Play notification sound
              playNotificationSound();
              
              // Windows-specific balloon notification
              const { Notification } = require("electron");
                  if (Notification.isSupported()) {
      const notification = new Notification({
        title: "NoX Buddy is running in background",
        body: "Click the tray icon to restore the window.",
        icon: path.join(__dirname, "logo-stremly.png"), // use your app icon
        silent: true, // we already play custom sound above
      });

      notification.on("click", () => {
        showWindow();
      });

      notification.show();
    }

              // Tell renderer to show notification cross-platform
              if (win && !win.isDestroyed()) {
                win.webContents.send("show-background-notification");
              }
            }, 200);
          }
        }, 50);
      }, 50);
    }, 50);
  }
}

function showWindow() {
  if (win && !win.isDestroyed()) {
    const currentBounds = win.getBounds();
    if (currentBounds.x < 0 || currentBounds.y < 0) {
      win.center();
    }

    win.setOpacity(0);
    win.show();
    win.setSkipTaskbar(false);

    let opacity = 0;
    const fadeInterval = setInterval(() => {
      opacity += 0.1;
      win.setOpacity(opacity);
      if (opacity >= 1) {
        clearInterval(fadeInterval);
        win.focus();
      }
    }, 16);
  }
}

// IPC handlers for sound settings
ipcMain.handle('get-notification-sound', () => {
  const settings = loadSettings();
  return settings.notificationSound;
});

ipcMain.handle('set-notification-sound', async (event, filePath) => {
  const settings = loadSettings();
  settings.notificationSound = filePath;
  saveSettings(settings);
  return { success: true };
});

ipcMain.handle('reset-notification-sound', async () => {
  const settings = loadSettings();
  settings.notificationSound = null;
  saveSettings(settings);
  return { success: true };
});

ipcMain.handle('select-sound-file', async () => {
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Notification Sound',
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('test-notification-sound', () => {
  playNotificationSound();
  return { success: true };
});

// Handle auto-start toggle
ipcMain.on("set-auto-start", (event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: app.getPath("exe"),
  });
  const settings = loadSettings();
  settings.autoStart = enabled;
  saveSettings(settings);
  console.log("Auto-start set to:", enabled);
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  app.setAppUserModelId("NoX Buddy");


  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});

app.on("before-quit", (event) => {
  if (!isQuitting) {
    event.preventDefault();
    dialog
      .showMessageBox(win, {
        type: "question",
        buttons: ["Yes", "No"],
        title: "Confirm Quit",
        message: "Are you sure you want to quit?",
      })
      .then((result) => {
        if (result.response === 0) {
          isQuitting = true;
          app.quit();
        }
      });
  }
});