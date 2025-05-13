// aw.js
const { execFile } = require('child_process');
const path = require('path');
const axios = require('axios');
const { AWClient } = require('aw-client');

const client = new AWClient('electron-app');

// 🧠 Helper: Start and log a subprocess
function spawnWithLog(name, execPath) {
  const proc = execFile(execPath, (err) => {
    if (err) console.error(`❌ Failed to start ${name}:`, err.message);
  });

  proc.stdout?.on('data', data => console.log(`[${name}]`, data.toString()));
  proc.stderr?.on('data', data => console.error(`[${name} ERROR]`, data.toString()));
}

// 🧠 Helper: Wait until the server is up
async function waitForAWServer(timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await axios.get('http://localhost:5600/api/0/info');
      console.log('✅ aw-server is up and responding');
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('❌ ActivityWatch server did not start in time');
}

// 🧠 Helper: Example aw-client call (safe)
async function getBuckets() {
  try {
    const buckets = await client.getBuckets();
    console.log('📦 Buckets:', buckets);
  } catch (err) {
    console.error('❌ Failed to connect to aw-server:', err.message);
  }
}

async function startActivityWatch() {
    const isWindows = process.platform === 'win32';
    const basePath = path.join(__dirname, 'resources', 'activitywatch', 'win');

    // Adjusted paths with subfolders
    const serverPath = path.join(basePath, 'aw-server', 'aw-server.exe');
    const windowWatcherPath = path.join(basePath, 'aw-watcher-window', 'aw-watcher-window.exe');
    const afkWatcherPath = path.join(basePath, 'aw-watcher-afk', 'aw-watcher-afk.exe');

    spawnWithLog('aw-server', serverPath);
    spawnWithLog('aw-watcher-window', windowWatcherPath);
    spawnWithLog('aw-watcher-afk', afkWatcherPath);

    try {
        await waitForAWServer();
        await getBuckets(); // or do other logic here
    } catch (err) {
        console.error(err.message);
    }
}

module.exports = {
  startActivityWatch,
  getBuckets
};