const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  retry: () => ipcRenderer.send('retry-connection'),
  onSiteReady: (callback) => ipcRenderer.on('site-ready', callback),
  splashFinished: () => ipcRenderer.send('splash-finished'),
});
