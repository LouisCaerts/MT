// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => ipcRenderer.send("win:minimize"),
  close: () => ipcRenderer.send("win:close"),
  platform: () => ipcRenderer.invoke("app:platform"),
});

contextBridge.exposeInMainWorld('timerBridge', {
  arm: (deadline) => ipcRenderer.invoke('timer:arm', deadline),
  cancel: () => ipcRenderer.invoke('timer:cancel'),
  onComplete: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('timer:complete', handler);
    return () => ipcRenderer.removeListener('timer:complete', handler);
  },
});