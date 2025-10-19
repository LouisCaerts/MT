/////////////////////////////////////////////////////////////


// packages
import { app, BrowserWindow, nativeImage, Tray, Menu, screen, ipcMain, powerMonitor } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// declarations
let mainWindow      = null;
let mainTray        = null;
let armedTimer      = null;
let armedDeadline   = null;

// definitions
const gotTheLock = app.requestSingleInstanceLock()
const mainTrayIcon = nativeImage.createFromDataURL('data:image/png;base64,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');


/////////////////////////////////////////////////////////////


// exit during Squirrel install/update events to prevent the app UI from launching
if (started) { app.quit(); }

// Only allow one application instance to run at once
if (!gotTheLock) {
  app.quit();
} 
else {

  // focus primary window when user tries to reopen app while it is already running
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  })

  const createWindow = () => {

    // prepare application size and position (bottom right corner of primary display)
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const appWindowWidth = 800;
    const appWindowHeight = 500;
    const x = screenWidth - appWindowWidth;
    const y = screenHeight - appWindowHeight;

    mainWindow = new BrowserWindow({
      width: appWindowWidth,
      height: appWindowHeight,
      maxWidth: appWindowWidth,
      maxHeight: appWindowHeight,
      minWidth: appWindowWidth,
      minHeight: appWindowHeight,
      x: x,
      y: y,

      alwaysOnTop: true,
      icon: './src/images/icon.png',
      
      // disable native titlebar in favor of custom implementation
      frame: false,
    
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      }
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // hide app on closing instead of fully exiting
    mainWindow.on('close', (event) => {
      event.preventDefault();
      mainWindow.hide();
    });

    // open devtools alongside app (development mode only)
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) { mainWindow.webContents.openDevTools(); }
    
    // setup tray icon and context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open', 
        click: () => { mainWindow.show(); }
      },
      {
        label: 'Exit', 
        click: () => { app.exit(); }
      }
    ]);
    mainTray = new Tray(mainTrayIcon);
    mainTray.setToolTip('Storytimer');
    mainTray.setContextMenu(contextMenu);
  
    // enable app reopening by double-clicking tray icon
    mainTray.on('double-click', () => {
      mainWindow.setBounds({ x, y, width: appWindowWidth, height: appWindowHeight });
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    });
  };

  // sets a backend-side timer based on a Date object to avoid the desyncing of renderer-side intervals
  function armTimer(deadline) {
    if (armedTimer) { clearTimeout(armedTimer); armedTimer = null; }
    armedDeadline = deadline;

    const ms = Math.max(0, deadline - Date.now());
    armedTimer = setTimeout(() => {
      armedTimer = null;
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("timer:complete");
    }, ms);
  }

  // cancels a timer set by armTimer
  function cancelTimer() {
    if (armedTimer) { clearTimeout(armedTimer); armedTimer = null; }
    armedDeadline = null;
  }

  // rearms timer after system resume event
  powerMonitor.on("resume", () => {
    if (armedDeadline != null) armTimer(armedDeadline);
  });

  // main process IPC endpoints for timer controls
  ipcMain.handle("timer:arm", (_e, deadline) => { armTimer(deadline); return true; });
  ipcMain.handle("timer:cancel", () => { cancelTimer(); return true; });

  // main process IPC endpoints for stoplight controls
  ipcMain.on("win:minimize", () => mainWindow.minimize());
  ipcMain.on("win:close", () => mainWindow.close());
  ipcMain.handle("app:platform", () => process.platform);

  // launch app when ready
  app.whenReady().then(() => {
    createWindow();
  });
}
