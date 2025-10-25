const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, globalShortcut  } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let isBackendStarting = false;
let noxBackendProcess = null;
let tray = null;
let isQuitting = false;
let hasShownTrayNotification = false;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    titleBarStyle: 'customButtonsOnHover',
    frame: false,
    resizable: false,
    movable: true,
    show: false,
    transparent: true,
    hasShadow: false, // Disable native shadow to prevent white background
    vibrancy: false,
    backgroundColor: '#00000000',
    icon: path.join(__dirname, '../favicon.ico')
  });

  // Load the app
  const startUrl = isDev 
    ? process.env.ELECTRON_START_URL || 'http://localhost:5173'
    : `file://${path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  //Key Shortcut logic - DEMO
  mainWindow.on('focus', () => {
    globalShortcut.register('CommandOrControl+Shift+M', () => {
      console.log('🟢 Shortcut pressed: Ctrl+Shift+M');
      mainWindow.webContents.send('trigger-minimize-shortcut');
    });
  });

    mainWindow.on('blur', () => {
    globalShortcut.unregister('CommandOrControl+Shift+M');
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  //Key Shortcut logic - DEMO End

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
    if (isBackendStarting) {
      console.log('⚠️ Backend already starting, skipping duplicate');
      return resolve({ success: true, message: 'Backend already starting' });
    }

    if (noxBackendProcess) {
      console.log('⚠️ Backend already running');
      return resolve({ success: false, error: 'Backend already running' });
    }

    isBackendStarting = true;

    try {
      console.log('🚀 Starting Nox Backend...');

      let backendPath;
      let exePath;
      let args = [];

      if (isDev) {
        // ✅ DEV MODE: Run FastAPI directly with Python
        backendPath = path.join(__dirname, '..', '..', '..', 'backend'); // adjust if needed
        exePath = process.platform === 'win32' ? 'python' : 'python3';
        const scriptPath = path.join(backendPath, 'main.py');
        args = [scriptPath];

        console.log('🧠 Dev mode detected — starting FastAPI backend via Python source');
        console.log('📂 Backend path:', backendPath);
        console.log('🐍 Command:', exePath, args.join(' '));

        // Spawn Python process (no file existence check)
        noxBackendProcess = spawn(exePath, args, {
          cwd: backendPath,
          stdio: ['pipe', 'pipe', 'pipe'],
          
        });

      } else {
        // ✅ PROD MODE: Run backend.exe
        backendPath = path.join(process.resourcesPath, 'backend');
        exePath = process.platform === 'win32'
          ? path.join(backendPath, 'backend.exe')
          : path.join(backendPath, 'backend'); // Linux/Mac

        if (!fs.existsSync(exePath)) {
          throw new Error(`Backend executable not found at: ${exePath}`);
        }

        noxBackendProcess = spawn(exePath, [], {
          cwd: backendPath,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: process.platform === 'win32',
          windowsHide: true,
        });
      }

      console.log(`🚀 Backend started: ${exePath}`);

      let backendStarted = false;

      // ---------------- STDOUT ----------------
      noxBackendProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log('📨 Backend Output:', output);

        if (!backendStarted && output.includes('Uvicorn running on')) {
          backendStarted = true;
          isBackendStarting = false;
          console.log('✅ Backend started successfully');

          if (mainWindow) {
            mainWindow.webContents.send('nox-status', {
              running: true,
              message: 'Backend started on http://localhost:8000'
            });
          }

          resolve({ success: true, url: 'http://localhost:8000' });
        }

        if (mainWindow) {
          mainWindow.webContents.send('nox-response', output);
        }
      });

      // ---------------- STDERR ----------------
      noxBackendProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        console.error('❌ Backend Error:', error);
        if (mainWindow) {
          mainWindow.webContents.send('nox-response', `ERROR: ${error}`);
        }
      });

      // ---------------- EXIT ----------------
      noxBackendProcess.on('exit', (code) => {
        console.log(`🔄 Backend exited with code ${code}`);
        noxBackendProcess = null;
        backendStarted = false;
        if (mainWindow) {
          mainWindow.webContents.send('nox-status', {
            running: false,
            message: `Backend stopped (code: ${code})`
          });
        }
      });

      // ---------------- ERROR ----------------
      noxBackendProcess.on('error', (error) => {
        console.error('❌ Failed to start Backend:', error);
        noxBackendProcess = null;
        isBackendStarting = false;
        if (mainWindow) {
          mainWindow.webContents.send('nox-status', {
            running: false,
            error: error.message
          });
        }
        reject({ success: false, error: error.message });
      });

      // ---------------- TIMEOUT ----------------
      setTimeout(() => {
        if (!backendStarted) {
          console.warn('❌ Backend startup timeout - continuing anyway');
          isBackendStarting = false;
          resolve({ success: true, url: 'http://localhost:8000', warning: 'Startup timeout' });
        }
      }, 15000);

    } catch (error) {
      console.error('❌ Error starting backend:', error);
      isBackendStarting = false;
      reject({ success: false, error: error.message });
    }
  });
}



function stopNoxBackend() {
  if (noxBackendProcess) {
    console.log('🛑 Stopping Nox Backend...');
    
    // Use different methods to ensure process is killed
    if (process.platform === 'win32') {
      // On Windows, use taskkill to ensure process tree is terminated
      spawn('taskkill', ['/pid', noxBackendProcess.pid, '/f', '/t']);
    } else {
      // On Unix systems
      noxBackendProcess.kill('SIGTERM');
    }
    
    noxBackendProcess = null;
    console.log('✅ Backend stopped');
  }
}

// Add backend health check function


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



// Window resize handlers for minimize functionality
ipcMain.handle('resize-window-for-minimize', () => {
  console.log('🔽 Received resize-window-for-minimize IPC call');
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      // Store original size for restoration
      const currentBounds = mainWindow.getBounds();
      console.log('📏 Current window bounds:', currentBounds);
      mainWindow.originalBounds = currentBounds;
      
      // Calculate new position (bottom-right of screen, not current window)
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      
      // Spotlight-like dimensions - optimized for single unified search bar
      const newWidth = 600;  // Perfect width for unified search bar
      const newHeight = 64;  // Slightly taller for better visual balance
      
      // Center horizontally, position in upper third like Spotlight
      const newX = Math.round((screenWidth - newWidth) / 2);
      const newY = Math.round(screenHeight * 0.25); // 25% from top like Spotlight
      
      console.log('📐 New window size and position:', { width: newWidth, height: newHeight, x: newX, y: newY });
      console.log('📺 Screen dimensions:', { screenWidth, screenHeight });
      
      // Hide window first to avoid visible resize animation
      mainWindow.hide();
      
      // Resize to floating window size (no animation)
      mainWindow.setSize(newWidth, newHeight, false);
      mainWindow.setPosition(newX, newY, false);
      mainWindow.setResizable(false); // Disable manual resizing
      mainWindow.setAlwaysOnTop(true);
      
      // Show window after resize is complete
      setTimeout(() => {
        mainWindow.show();
      }, 50);
      
      console.log('✅ Window resized successfully for minimize');
      return { success: true };
    } catch (error) {
      console.error('❌ Error resizing window:', error);
      return { success: false, error: error.message };
    }
  }
  
  console.error('❌ Main window not available');
  return { success: false, error: 'Window not available' };
});

// Dynamic resize for conversation expansion
ipcMain.handle('expand-window-for-conversation', (event, messageCount = 1) => {
  console.log('🔼 Received expand-window-for-conversation IPC call with messageCount:', messageCount);
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      const currentBounds = mainWindow.getBounds();
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      
      // Calculate optimal height based on message count
      const baseHeight = 120; // Header + input area
      const messageHeight = 70; // Average height per message (including spacing)
      const calculatedHeight = baseHeight + (messageCount * messageHeight);
      const maxHeight = Math.round(Math.min(calculatedHeight, screenHeight * 0.7)); // Max 70% of screen
      const minHeight = 200; // Minimum conversation height
      const maxScrollHeight = 500; // Maximum height before scrolling kicks in
      
      // Use scroll height limit for better UX
      const finalHeight = Math.max(minHeight, Math.min(calculatedHeight, maxScrollHeight));
      const newWidth = Math.max(currentBounds.width, 600); // Ensure minimum width
      
      // Recalculate position to keep centered
      const newX = Math.round((screenWidth - newWidth) / 2);
      const newY = Math.round(screenHeight * 0.25); // Keep same Y position as search bar
      
      console.log('📐 Expanding to:', { width: newWidth, height: finalHeight, x: newX, y: newY });
      
      // Animate to new size
      mainWindow.setSize(newWidth, finalHeight, true);
      mainWindow.setPosition(newX, newY, true);
      mainWindow.setResizable(false); // Ensure no resizing after expansion
      
      console.log('✅ Window expanded for conversation');
      return { success: true, width: newWidth, height: finalHeight };
    } catch (error) {
      console.error('❌ Error expanding window:', error);
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, error: 'Window not available' };
});

// Collapse back to search bar
ipcMain.handle('collapse-window-to-searchbar', () => {
  console.log('🔽 Received collapse-window-to-searchbar IPC call');
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      const currentBounds = mainWindow.getBounds();
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      
      // Return to search bar dimensions
      const searchBarWidth = 600; // Same as minimize width
      const searchBarHeight = 64; // Same as minimize height
      
      // Recalculate center position
      const newX = Math.round((screenWidth - searchBarWidth) / 2);
      const newY = Math.round(screenHeight * 0.25); // Same as minimize position
      
      console.log('📐 Collapsing to:', { width: searchBarWidth, height: searchBarHeight, x: newX, y: newY });
      
      // Animate back to search bar size
      mainWindow.setSize(searchBarWidth, searchBarHeight, true);
      mainWindow.setPosition(newX, newY, true);
      mainWindow.setResizable(false); // Ensure no resizing after collapse
      
      console.log('✅ Window collapsed to search bar');
      return { success: true };
    } catch (error) {
      console.error('❌ Error collapsing window:', error);
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, error: 'Window not available' };
});

ipcMain.handle('restore-window-from-minimize', () => {
  console.log('🔼 Received restore-window-from-minimize IPC call');
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      // Hide window first to avoid visible resize animation
      mainWindow.hide();
      
      // Restore original size and position (no animation)
      if (mainWindow.originalBounds) {
        console.log('📏 Restoring to original bounds:', mainWindow.originalBounds);
        mainWindow.setBounds(mainWindow.originalBounds, false);
      } else {
        // Fallback to default size
        console.log('📏 No original bounds, using default size');
        mainWindow.setSize(1200, 800, false);
        mainWindow.center();
      }
      
      mainWindow.setResizable(false); // Keep resizable false as per original config
      mainWindow.setAlwaysOnTop(false);
      
      // Show window after resize is complete
      setTimeout(() => {
        mainWindow.show();
      }, 50);
      
      console.log('✅ Window restored successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error restoring window:', error);
      return { success: false, error: error.message };
    }
  }
  
  console.error('❌ Main window not available');
  return { success: false, error: 'Window not available' };
});

// Resize window for floating circle mode
ipcMain.handle('resize-window-for-floating-circle', (event, position = { x: 50, y: 50 }) => {
  console.log('🔵 Received resize-window-for-floating-circle IPC call with position:', position);
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      
      // Floating circle dimensions - wider to accommodate hover expansion
      const circleWidth = 260; // Wide enough for expanded state with 3 larger buttons
      const circleHeight = 80; // Height remains the same
      
      // Convert percentage position to pixel position
      const newX = Math.round((screenWidth * position.x / 100) - (circleWidth / 2));
      const newY = Math.round((screenHeight * position.y / 100) - (circleHeight / 2));
      
      // Ensure circle stays within screen bounds
      const finalX = Math.max(0, Math.min(screenWidth - circleWidth, newX));
      const finalY = Math.max(0, Math.min(screenHeight - circleHeight, newY));
      
      console.log('📐 Floating circle size and position:', { width: circleWidth, height: circleHeight, x: finalX, y: finalY });
      
      // Hide window first to avoid visible resize animation
      mainWindow.hide();
      
      // Resize to floating circle size
      mainWindow.setSize(circleWidth, circleHeight, false);
      mainWindow.setPosition(finalX, finalY, false);
      mainWindow.setResizable(false);
      mainWindow.setAlwaysOnTop(true);
      mainWindow.setMovable(true); // Enable dragging for floating circle
      
      // Make window frameless for floating circle with rounded background
      mainWindow.setWindowButtonVisibility(false); // Hide traffic light buttons on macOS
      mainWindow.setMenuBarVisibility(false); // Hide menu bar
      
      
      // Note: Removed window move listener to prevent infinite loop
      // The drag functionality works with native Electron dragging
      
      // Show window after resize is complete
      setTimeout(() => {
        mainWindow.show();
      }, 50);
      
      console.log('✅ Window resized successfully for floating circle');
      return { success: true };
    } catch (error) {
      console.error('❌ Error resizing window for floating circle:', error);
      return { success: false, error: error.message };
    }
  }
  
  console.error('❌ Main window not available');
  return { success: false, error: 'Window not available' };
});

// Update floating circle position
ipcMain.handle('update-floating-circle-position', (event, position) => {
  console.log('🔄 Received update-floating-circle-position IPC call with position:', position);
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      
      const circleWidth = 260;
      const circleHeight = 80;
      
      // Convert percentage position to pixel position
      const newX = Math.round((screenWidth * position.x / 100) - (circleWidth / 2));
      const newY = Math.round((screenHeight * position.y / 100) - (circleHeight / 2));
      
      // Ensure circle stays within screen bounds
      const finalX = Math.max(0, Math.min(screenWidth - circleWidth, newX));
      const finalY = Math.max(0, Math.min(screenHeight - circleHeight, newY));
      
      mainWindow.setPosition(finalX, finalY, true);
      
      console.log('✅ Floating circle position updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating floating circle position:', error);
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, error: 'Window not available' };
});

// Return from floating circle to spotlight
ipcMain.handle('resize-window-from-floating-circle', () => {
  console.log('🔍 Received resize-window-from-floating-circle IPC call');
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      
      // Hide window first to avoid visible resize animation
      mainWindow.hide();
      
      // Return to spotlight dimensions
      const spotlightWidth = 600;
      const spotlightHeight = 64;
      
      // Center horizontally, position in upper third like Spotlight
      const newX = Math.round((screenWidth - spotlightWidth) / 2);
      const newY = Math.round(screenHeight * 0.25);
      
      // Remove any custom shape
      mainWindow.setShape([]);
      
      // Note: No window move listener to remove
      
      // Restore window controls for spotlight mode
      mainWindow.setWindowButtonVisibility(false); // Keep hidden for spotlight too
      mainWindow.setMenuBarVisibility(false); // Keep menu bar hidden
      
      // Resize back to spotlight size
      mainWindow.setSize(spotlightWidth, spotlightHeight, false);
      mainWindow.setPosition(newX, newY, false);
      mainWindow.setResizable(false);
      mainWindow.setAlwaysOnTop(true);
      
      // Show window after resize is complete
      setTimeout(() => {
        mainWindow.show();
      }, 50);
      
      console.log('✅ Window resized successfully from floating circle to spotlight');
      return { success: true };
    } catch (error) {
      console.error('❌ Error resizing window from floating circle:', error);
      return { success: false, error: error.message };
    }
  }
  
  console.error('❌ Main window not available');
  return { success: false, error: 'Window not available' };
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
