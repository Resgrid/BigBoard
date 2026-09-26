const { contextBridge, ipcRenderer } = require('electron');

// This window is the only writer of these settings, so reads after the first are served from memory
// rather than a synchronous IPC round trip -- the API client reads the server URL on every request.
const settingsCache = new Map();

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform detection
  platform: process.platform,
  isElectron: true,

  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Window controls (can be extended as needed)
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Settings persisted by the main process so they survive restarts (see PERSISTED_SETTING_KEYS in main.js)
  getSetting: (key) => {
    if (!settingsCache.has(key)) {
      settingsCache.set(key, ipcRenderer.sendSync('settings:get', key));
    }
    return settingsCache.get(key);
  },
  setSetting: (key, value) => {
    // Cache even if the write fails so this session still uses the value the user just chose
    settingsCache.set(key, value);
    return ipcRenderer.sendSync('settings:set', key, value);
  },
});
