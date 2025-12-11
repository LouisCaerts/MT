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

contextBridge.exposeInMainWorld('notes', {
	add: (text) => ipcRenderer.invoke('notes:add', text),
	list: (limit = 20, offset = 0) =>
		ipcRenderer.invoke('notes:list', { limit, offset }),
});

contextBridge.exposeInMainWorld('sessions', {
	start: ({ duration_target_sec }) =>
		ipcRenderer.invoke('session:start', { duration_target_sec }),

	finish: ({ id, outcome, duration_actual_sec }) =>
		ipcRenderer.invoke('session:finish', { id, outcome, duration_actual_sec }),

	list: (limit = 20, offset = 0) =>
		ipcRenderer.invoke('session:list', { limit, offset }),

	sumByRange: ({ fromMs, toMs }) =>
		ipcRenderer.invoke('session:sumByRange', { fromMs, toMs }),
});

contextBridge.exposeInMainWorld('days', {
    ensure: ({ date, goal_min }) =>
        ipcRenderer.invoke('day:ensure', { date, goal_min }),
    addFocus: ({ date, minutes }) =>
        ipcRenderer.invoke('day:addFocus', { date, minutes }),
    list: () =>
        ipcRenderer.invoke('day:list'),
    setGoal: ({ date, goal_min }) =>
        ipcRenderer.invoke('day:setGoal', { date, goal_min }),
});

contextBridge.exposeInMainWorld('daily', {
    get:    (dateKey)        => ipcRenderer.invoke('daily:get', dateKey),
    getAll: ()               => ipcRenderer.invoke('daily:getAll'),
    set:    (dateKey, vals)  => ipcRenderer.invoke('daily:set', dateKey, vals),
    update: (patch = {})     => ipcRenderer.invoke('daily:update', patch),
});