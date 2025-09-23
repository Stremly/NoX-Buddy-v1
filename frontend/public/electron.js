const { app, BrowserWindow, Tray, Menu, dialog } = require("electron");
const path = require("path");

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
      contextIsolation: true
    },
  });

  //window close event
  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      hideWindow();
      return false;
    }
  });

  win.loadURL("http://localhost:3000");
}




function createTray() {
  // Create tray icon (you'll need to add tray icons to your project)
  console.log('Current directory:', __dirname);
  const iconPath = path.resolve(__dirname, 'logo-stremly.png');
  console.log('Tray icon path:', iconPath);

  
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open App',
      click: () => {
        if (win) {
          win.show();
          win.focus();
        }
      }
    },
    {
      label: 'Quit',
      click: async () => {
        const result = await dialog.showMessageBox(win, {
          type: 'question',
          buttons: ['Yes', 'No'],
          title: 'Confirm Quit',
          message: 'Are you sure you want to quit?'
        });
        
        if (result.response === 0) { 
          isQuitting = true;
          app.quit();
        }
      }
    }
  ]);

  tray.setToolTip('NoX Buddy');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
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
          
          // Show notification
          if (tray && !hasShownTrayNotification) {
            hasShownTrayNotification = true;
            setTimeout(() => { 
              tray.displayBalloon({
                title: 'NoX Buddy is running in background',
                content: 'Click the tray icon to restore the window.'
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

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});


app.on("window-all-closed", (event) => {
  event.preventDefault(); 
  // App will stay running in tray
});


app.on('before-quit', (event) => {
  if (!isQuitting) {
    event.preventDefault();
    
    //confirmation dialog
    dialog.showMessageBox(win, {
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm Quit',
      message: 'Are you sure you want to quit?'
    }).then((result) => {
      if (result.response === 0) {
        isQuitting = true;
        app.quit();
      }
    });
  }
});