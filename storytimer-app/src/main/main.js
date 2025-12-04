// imports
import { app, BrowserWindow, nativeImage, Tray, Menu, screen, ipcMain, powerMonitor, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import preferences from './preferences.js';
import { initDb } from './db.js';
import { buildDataApi } from './dbApi.js';

// declarations
let mainWindow      = null;
let mainTray        = null;
let armedTimer      = null;
let armedDeadline   = null;
let quitting        = false;

// definitions
const gotTheLock = app.requestSingleInstanceLock()
const mainTrayIcon = nativeImage.createFromDataURL('data:image/png;base64,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');
const db = initDb();
const api = buildDataApi(db);

const dbPath = path.join(app.getPath('userData'), 'data');
console.log('SQLite DB file is at:', dbPath);
console.log('userData folder is:', app.getPath('userData'));

console.log('Preferences store initialized.');


// exit during Squirrel install/update events
if (started) { app.quit(); }

// single instance lock
if (!gotTheLock) {
    app.quit();
} else {

    //---------------------------------------------
    // Setup clean cross-platform window lifecycle
    //---------------------------------------------

    // macOS: don't quit when last window closes
    app.on('window-all-closed', () => {
        // do nothing on macOS
        // on Windows/Linux we want the tray to keep the app alive
    });

    // need to allow quit
    app.on('before-quit', () => {
        quitting = true;
    });

    // macOS dock click restores window
    app.on('activate', () => {
        if (mainWindow) mainWindow.show();
    });


    //---------------------------------------------
    // Main window creation
    //---------------------------------------------
    const createWindow = () => {

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

        // correct close behavior (hide, unless quitting)
        mainWindow.on('close', (event) => {
            if (!quitting) {
                event.preventDefault();
                mainWindow.hide();
            }
        });

        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            mainWindow.webContents.openDevTools();
        }

        //---------------------------------------------
        // Tray with cross-platform restore behavior
        //---------------------------------------------
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Open', click: () => openMainWindow() },
            { label: 'Exit', click: () => { quitting = true; app.quit(); } }
        ]);

        mainTray = new Tray(mainTrayIcon);
        mainTray.setToolTip('Storytimer');
        mainTray.setContextMenu(contextMenu);

        // Windows native double-click
        mainTray.on('double-click', () => openMainWindow());

        // macOS double-click via clickCount
        mainTray.on('click', (event, bounds, position) => {
            if (position?.clickCount === 2) openMainWindow();
        });

        function openMainWindow() {
            mainWindow.setBounds({ x, y, width: appWindowWidth, height: appWindowHeight });
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    };


    //---------------------------------------------
    // Helper utilities
    //---------------------------------------------
    function clamp(n, min, max) {
        return Math.max(min, Math.min(max, n));
    }


    //---------------------------------------------
    // Timer logic (unchanged)
    //---------------------------------------------
    function armTimer(deadline) {
        if (armedTimer) { clearTimeout(armedTimer); armedTimer = null; }
        armedDeadline = deadline;

        const ms = Math.max(0, deadline - Date.now());
        armedTimer = setTimeout(() => {
            armedTimer = null;
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("timer:complete");
            }
        }, ms);
    }

    function cancelTimer() {
        if (armedTimer) { clearTimeout(armedTimer); armedTimer = null; }
        armedDeadline = null;
    }

    powerMonitor.on("resume", () => {
        if (armedDeadline != null) armTimer(armedDeadline);
    });


    //---------------------------------------------
    // IPC handlers (unchanged)
    //---------------------------------------------
    ipcMain.handle("timer:arm", (_e, deadline) => { armTimer(deadline); return true; });
    ipcMain.handle("timer:cancel", () => { cancelTimer(); return true; });

    ipcMain.on("win:minimize", () => mainWindow.minimize());
    ipcMain.on("win:close", () => mainWindow.close());
    ipcMain.handle("app:platform", () => process.platform);

    ipcMain.handle('preferences:get', (_e, key) => preferences.get(key));
    ipcMain.handle('preferences:getAll', () => preferences.store);
    ipcMain.handle('preferences:set', (_e, key, val) => {
        if (key === 'dailyWorkMinutes') val = clamp(Number(val ?? 0), 0, 1440);
        if (key === 'notificationsPerDay') val = clamp(Number(val ?? 0), 0, 100);
        if (key === 'notificationsEnabled') val = !!val;
        preferences.set(key, val);
        return true;
    });

    ipcMain.handle('preferences:update', (_e, patch = {}) => {
        const next = { ...preferences.store, ...patch };
        next.dailyWorkMinutes = clamp(Number(next.dailyWorkMinutes ?? 0), 0, 1440);
        next.notificationsPerDay = clamp(Number(next.notificationsPerDay ?? 0), 0, 100);
        next.notificationsEnabled = !!next.notificationsEnabled;
        preferences.store = next;
        return preferences.store;
    });

    ipcMain.handle('notes:add', (_e, text) => api.addNote(text));
    ipcMain.handle('notes:list', (_e, { limit = 20, offset = 0 }) => api.getNotes(limit, offset));
    ipcMain.handle('session:start', (_e, payload) => api.startSession(payload));
    ipcMain.handle('session:finish', (_e, payload) => api.finishSession(payload));
    ipcMain.handle('session:list', (_e, payload) => api.getSessions(payload.limit, payload.offset));
    ipcMain.handle('session:sumByRange', (_e, { fromMs, toMs }) => api.getFocusedSecondsInRange(fromMs, toMs));


    //---------------------------------------------
    // Launch app
    //---------------------------------------------
    app.whenReady().then(() => {
        createWindow();
    });
}
