const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// In a packaged app, look for .env next to the executable
const envPath = app.isPackaged
  ? path.join(path.dirname(process.execPath), '.env')
  : path.join(__dirname, '.env');

require('dotenv').config({ path: envPath });
const { generateReport } = require('./src/report');

let mainWindow;

app.whenReady().then(async () => {
  if (!process.env.MONDAY_API_TOKEN) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Missing API Token',
      message: `MONDAY_API_TOKEN is not set.\n\nPlace a .env file next to the application:\n${envPath}\n\nWith the content:\nMONDAY_API_TOKEN=your_token_here`,
    });
    app.quit();
    return;
  }
  mainWindow = new BrowserWindow({
    width: 500,
    height: 320,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

ipcMain.handle('generate-report', async (event, { startDate, endDate }) => {
  try {
    mainWindow.webContents.send('status', 'Generating report…');

    const html = await generateReport(startDate, endDate);
    const tmpFile = path.join(os.tmpdir(), `makerspace-analytics-${Date.now()}.html`);
    fs.writeFileSync(tmpFile, html);

    await shell.openExternal(`file://${tmpFile}`);

    mainWindow.close();
  } catch (err) {
    mainWindow.webContents.send('status', `Error: ${err.message}`);
    throw err;
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
