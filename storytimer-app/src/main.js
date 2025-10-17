import { app, BrowserWindow, nativeImage, Tray, Menu, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

let mainWindow;
let mainTray = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Load app icon
  const appIcon = nativeImage.createFromPath('./src/images/icon.png');

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
    x: x,
    y: y,
    alwaysOnTop: true,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // hide app on close instead of exiting
  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
  
  // Setup the tray icon
  const mainTrayIcon = nativeImage.createFromPath('./src/images/icon.png');
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

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
