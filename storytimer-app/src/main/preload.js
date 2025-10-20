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

contextBridge.exposeInMainWorld('api', {
	preferences: {
		get:   (key) 	  => ipcRenderer.invoke('preferences:get', key),
		getAll:()     	  => ipcRenderer.invoke('preferences:getAll'),
		set:   (key, val) => ipcRenderer.invoke('preferences:set', key, val),
		update:(patch)    => ipcRenderer.invoke('preferences:update', patch),
	}
});