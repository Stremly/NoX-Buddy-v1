const { app, BrowserWindow, Tray, Menu, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const configPath = path.join(__dirname, "settings.json");

let win;
let tray = null;
let isQuitting = false;
let hasShownTrayNotification = false;

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
    console.log("Page loaded:", currentURL); // Debug log
    
    // Only run installation simulation on the installer page and only once
    if (currentURL.includes("/installer") && !installationCompleted) {
      // Give the React component a moment to set up its listeners
      setTimeout(() => {
        let progress = 0;
        const interval = setInterval(() => {
          // Check if we should stop (in case navigation happened)
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
            installationCompleted = true; // Mark as completed
            clearInterval(interval);
            console.log("Installation complete");
            win.webContents.send("install-done");

            setTimeout(() => {
              // Only navigate if we're still on the installer page
              if (win && !win.isDestroyed() && win.webContents.getURL().includes("/installer")) {
                win.loadURL("http://localhost:3000/signin");
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
              tray.displayBalloon({
                title: "NoX Buddy is running in background",
                content: "Click the tray icon to restore the window.",
              });
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

// Handle auto-start toggle
ipcMain.on("set-auto-start", (event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: app.getPath("exe"),
  });
  let config = { autoStart: enabled };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Auto-start set to:", enabled);
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", (event) => {
  event.preventDefault(); // App stays in tray
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
