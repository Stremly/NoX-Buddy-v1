const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let noxBackendProcess = null;
let tray = null;
let isQuitting = false;
let hasShownTrayNotification = false;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 400,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    frame: false,
    resizable: false,
    movable: true,
    show: false,
    icon: path.join(__dirname, '../favicon.ico')
  });

  // Load the app
  const startUrl = isDev 
    ? process.env.ELECTRON_START_URL || 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window close (minimize to tray on Windows)
  mainWindow.on('close', (event) => {
    if (process.platform === 'win32' && !isQuitting) {
      event.preventDefault();
      hideWindow();
      return false;
    } else {
      mainWindow = null;
    }
  });
}

// Create system tray (Windows only)
function createTray() {
  if (process.platform !== 'win32') return;

  // Use a simple icon - you can replace with your own
  const iconPath = path.join(__dirname, '../favicon.ico');
  
  try {
    tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Nox-Buddy',
        click: () => {
          showWindow();
        },
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit Completely',
        click: async () => {
          const result = await dialog.showMessageBox(mainWindow, {
            type: 'question',
            buttons: ['Yes', 'No'],
            defaultId: 1,
            title: 'Quit Nox-Buddy',
            message: 'Are you sure you want to quit Nox-Buddy completely?',
            detail: 'This will stop the background AI service.'
          });

          if (result.response === 0) {
            isQuitting = true;
            app.quit();
          }
        },
      },
    ]);

    tray.setToolTip('Nox-Buddy - Your Desktop AI Companion');
    tray.setContextMenu(contextMenu);

    // Double-click to show window
    tray.on('double-click', () => {
      showWindow();
    });

    // Single click to show window (Windows behavior)
    tray.on('click', () => {
      showWindow();
    });

  } catch (error) {
    console.error('Failed to create tray:', error);
  }
}

// Hide window with smooth animation
function hideWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Smooth fade out animation
    mainWindow.setOpacity(0.8);
    setTimeout(() => {
      mainWindow.setOpacity(0.6);
      setTimeout(() => {
        mainWindow.setOpacity(0.3);
        setTimeout(() => {
          mainWindow.hide();
          mainWindow.setOpacity(1);

          // Show tray notification (only once)
          if (tray && !hasShownTrayNotification) {
            hasShownTrayNotification = true;
            setTimeout(() => {
              tray.displayBalloon({
                title: 'Nox-Buddy is running in background',
                content: 'Click the tray icon to restore the window. Right-click for options.',
                icon: path.join(__dirname, '../favicon.ico')
              });
            }, 200);
          }
        }, 50);
      }, 50);
    }, 50);
  }
}

// Show window with smooth animation
function showWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Center window if it's off-screen
    const currentBounds = mainWindow.getBounds();
    if (currentBounds.x < 0 || currentBounds.y < 0) {
      mainWindow.center();
    }

    // Smooth fade in animation
    mainWindow.setOpacity(0);
    mainWindow.show();
    mainWindow.setSkipTaskbar(false);

    let opacity = 0;
    const fadeInterval = setInterval(() => {
      opacity += 0.1;
      mainWindow.setOpacity(opacity);
      if (opacity >= 1) {
        clearInterval(fadeInterval);
        mainWindow.focus();
      }
    }, 16);
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', (event) => {
  if (process.platform === 'win32') {
    // On Windows, keep app running in tray
    event.preventDefault();
  } else if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// Nox Backend Management
function startNoxBackend() {
  return new Promise((resolve, reject) => {
    try {
      console.log('🚀 Starting Nox Backend...');
      
      // Path to the backend executable (handle different environments)
      let backendPath;
      if (isDev) {
        // Development: relative to project root
        backendPath = path.join(__dirname, '../../../backend/NoX_Backend 1.exe');
      } else {
        // Production: relative to app resources
        backendPath = path.join(process.resourcesPath, 'backend/NoX_Backend 1.exe');
      }
      
      console.log('Backend path:', backendPath);
      
      // Check if backend file exists
      const fs = require('fs');
      if (!fs.existsSync(backendPath)) {
        throw new Error(`Backend executable not found at: ${backendPath}`);
      }

      // Start the process with Windows-specific options
      noxBackendProcess = spawn(backendPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
        cwd: path.dirname(backendPath),
        windowsHide: true, // Hide console window on Windows
        detached: false
      });

      // Handle process startup
      noxBackendProcess.on('spawn', () => {
        console.log('✅ Nox Backend started successfully');
        if (mainWindow) {
          mainWindow.webContents.send('nox-status', { running: true, message: 'Backend started' });
        }
        resolve({ success: true });
      });

      // Handle stdout (responses from Nox)
      noxBackendProcess.stdout.on('data', (data) => {
        const response = data.toString().trim();
        console.log('📨 Nox Response:', response);
        if (mainWindow) {
          mainWindow.webContents.send('nox-response', response);
        }
      });

      // Handle stderr (errors)
      noxBackendProcess.stderr.on('data', (data) => {
        console.error('❌ Nox Backend Error:', data.toString());
      });

      // Handle process exit
      noxBackendProcess.on('exit', (code) => {
        console.log(`🔄 Nox Backend exited with code ${code}`);
        noxBackendProcess = null;
        if (mainWindow) {
          mainWindow.webContents.send('nox-status', { running: false, message: 'Backend stopped' });
        }
      });

      // Handle process errors
      noxBackendProcess.on('error', (error) => {
        console.error('❌ Failed to start Nox Backend:', error);
        noxBackendProcess = null;
        if (mainWindow) {
          mainWindow.webContents.send('nox-status', { running: false, error: error.message });
        }
        reject({ success: false, error: error.message });
      });

      // Timeout after 5 seconds if not started
      setTimeout(() => {
        if (!noxBackendProcess) {
          reject({ success: false, error: 'Backend startup timeout' });
        }
      }, 5000);

    } catch (error) {
      console.error('❌ Error starting backend:', error);
      reject({ success: false, error: error.message });
    }
  });
}

function stopNoxBackend() {
  if (noxBackendProcess) {
    console.log('🛑 Stopping Nox Backend...');
    noxBackendProcess.kill();
    noxBackendProcess = null;
  }
}

function sendMessageToNox(message) {
  if (noxBackendProcess && noxBackendProcess.stdin && !noxBackendProcess.stdin.destroyed) {
    try {
      // Prepare message for backend
      let messageStr;
      if (typeof message === 'object' && message.text) {
        // Extract just the text if it's a message object
        messageStr = message.text;
      } else if (typeof message === 'string') {
        messageStr = message;
      } else {
        messageStr = JSON.stringify(message);
      }
      
      // Send message to backend stdin
      noxBackendProcess.stdin.write(messageStr + '\n');
      console.log('📤 Sent to Nox:', messageStr);
      
      return true;
    } catch (error) {
      console.error('❌ Error sending message to Nox:', error);
      return false;
    }
  } else {
    console.warn('⚠️ Nox backend not running or stdin not available');
    return false;
  }
}

// IPC Handlers
ipcMain.handle('start-nox-backend', async () => {
  return await startNoxBackend();
});

ipcMain.handle('stop-nox-backend', () => {
  stopNoxBackend();
  return { success: true };
});

ipcMain.handle('send-nox-message', (event, message) => {
  sendMessageToNox(message);
  return { success: true };
});

ipcMain.handle('nox-backend-status', () => {
  return { running: noxBackendProcess !== null };
});

// Tray control handlers
ipcMain.handle('minimize-to-tray', () => {
  if (process.platform === 'win32') {
    hideWindow();
    return { success: true };
  }
  return { success: false, error: 'Tray not supported on this platform' };
});

ipcMain.handle('show-from-tray', () => {
  showWindow();
  return { success: true };
});

// Auto-start functionality
ipcMain.handle('set-auto-start', (event, enabled) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe')
    });
    console.log('Auto-start set to:', enabled);
    return { success: true, enabled };
  } catch (error) {
    console.error('Failed to set auto-start:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-auto-start', () => {
  try {
    const loginItemSettings = app.getLoginItemSettings();
    return { success: true, enabled: loginItemSettings.openAtLogin };
  } catch (error) {
    console.error('Failed to get auto-start status:', error);
    return { success: false, enabled: false };
  }
});

// Handle before quit with confirmation
app.on('before-quit', (event) => {
  if (process.platform === 'win32' && !isQuitting) {
    event.preventDefault();
    dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Yes', 'No'],
      defaultId: 1,
      title: 'Quit Nox-Buddy',
      message: 'Are you sure you want to quit Nox-Buddy completely?',
      detail: 'This will stop the background AI service and remove the tray icon.'
    }).then((result) => {
      if (result.response === 0) {
        isQuitting = true;
        stopNoxBackend();
        app.quit();
      }
    });
  } else {
    stopNoxBackend();
  }
});
