import { app, BrowserWindow, nativeImage, Tray, Menu, screen, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

let mainWindow;
const additionalData = { myKey: 'myValue' }
const gotTheLock = app.requestSingleInstanceLock(additionalData)
let mainTray;
const mainTrayIcon = nativeImage.createFromDataURL('data:image/png;base64,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');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
    // Print out data received from the second instance.
    console.log(additionalData)

    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

const createWindow = () => {
  // Get screen size to display app in bottom left
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const appWindowWidth = 800;
  const appWindowHeight = 400;
  const x = screenWidth - appWindowWidth;
  const y = screenHeight - appWindowHeight;

  // Create the browser window.
  const mainWindow = new BrowserWindow({
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

    frame: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    titleBarOverlay: {
      color: '#775892',
      symbolColor: 'white'
    },
    
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  ipcMain.on("win:minimize", () => mainWindow.minimize());
  ipcMain.on("win:close", () => mainWindow.close());
  ipcMain.handle("app:platform", () => process.platform);

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  
  // Setup the tray icon
  mainTray = new Tray(mainTrayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open', 
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Exit', 
      click: () => {
        app.exit();
      }
    }
  ]);

  mainTray.setToolTip('Storytimer');
  mainTray.setContextMenu(contextMenu);
  
  // Reopen app with double-click on the tray icon
  mainTray.on('double-click', () => {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const [windowWidth, windowHeight] = mainWindow.getSize();
    const x = screenWidth - windowWidth;
    const y = screenHeight - windowHeight;
    mainWindow.setBounds({ x, y, width: windowWidth, height: windowHeight });

    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Keep app alive when window is closed
app.on('window-all-closed', (event) => {
  event.preventDefault();
});
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
