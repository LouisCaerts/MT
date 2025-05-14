const { app, BrowserWindow, Tray, Menu, screen } = require('electron/main')
const path = require('path');
const { startActivityWatch, getBuckets } = require('./aw');

let win;
let tray = null;

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const windowWidth = 300;
  const windowHeight = 400;

  const x = screenWidth - windowWidth;
  const y = screenHeight - windowHeight;

  win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    alwaysOnTop: true
  })

  win.loadFile('index.html')

  win.on('close', (event) => {
    event.preventDefault();
    win.hide();
  });

  // Setup the tray icon
  tray = new Tray(path.join(__dirname, 'icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open', 
      click: () => {
        win.show();
      }
    },
    {
      label: 'Exit', 
      click: () => {
        app.exit();
      }
    }
  ]);

  tray.setToolTip('Electron App');
  tray.setContextMenu(contextMenu);

  // Optional: Reopen app with double-click on the tray icon
  tray.on('double-click', () => {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const [windowWidth, windowHeight] = win.getSize();
    const x = screenWidth - windowWidth;
    const y = screenHeight - windowHeight;
    win.setBounds({ x, y, width: windowWidth, height: windowHeight });

    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });
}

function bringBackApp() {
  if (win) {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const [windowWidth, windowHeight] = win.getSize();
    const x = screenWidth - windowWidth;
    const y = screenHeight - windowHeight;
    win.setBounds({ x, y, width: windowWidth, height: windowHeight });

    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
}

getBuckets().then(buckets => console.log(buckets));

app.whenReady().then(() => {
  startActivityWatch();
  createWindow();

  // Simulate an automatic popup after 5 seconds (pop up test)
  /*
  setTimeout(() => {
    console.log('🔔 Bringing app back up!');
    bringBackApp();
  }, 10000);
  */
});

// Ensures app stays running even with no windows visible
app.on('window-all-closed', (event) => {
  event.preventDefault();
});

// For macOS, handle activation (Dock click)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    win.show();
  }
});