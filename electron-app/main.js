const { app, BrowserWindow, Tray, Menu } = require('electron/main')
const path = require('path');
const { startActivityWatch, getBuckets } = require('./aw');

let win;
let tray = null;

const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
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
    win.show();
  });
}

getBuckets().then(buckets => console.log(buckets));

app.whenReady().then(() => {
  startActivityWatch();
  createWindow();
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