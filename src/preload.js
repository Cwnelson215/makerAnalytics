const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  submitDates: (startDate, endDate) => ipcRenderer.invoke('generate-report', { startDate, endDate }),
  onStatus: (callback) => ipcRenderer.on('status', (_event, message) => callback(message)),
});
