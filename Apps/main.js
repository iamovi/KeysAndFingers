const { app, BrowserWindow, Menu, ipcMain, net } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const https = require('https');

let mainWindow;
let splashWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    transparent: true,
    icon: path.join(__dirname, 'icon.ico'),
  });

  splashWindow.loadFile(path.join(__dirname, 'public', 'splash.html'));

  // Close splash after 1 second and show main window
  setTimeout(() => {
    splashWindow.close();
    createMainWindow();
  }, 1000);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: __dirname + '/preload.js',
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Remove the default menu bar
  Menu.setApplicationMenu(null);

  // Check internet connection first
  checkConnection((isOnline) => {
    if (isOnline) {
      loadMainsite();
    } else {
      mainWindow.loadFile(path.join(__dirname, 'public', 'offline.html'));
    }
  });

  // Listen for page load completion
  mainWindow.webContents.on('did-finish-load', () => {
    // Page loaded successfully
  });

  // Handle load errors (shows offline page if connection fails)
  mainWindow.webContents.on('did-fail-load', () => {
    if (!mainWindow.webContents.getURL().includes('offline.html')) {
      mainWindow.loadFile(path.join(__dirname, 'public', 'offline.html'));
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function loadMainsite() {
  const url = 'https://iamovi.github.io/KeysAndFingers/';
  mainWindow.loadURL(url);
}

function checkConnection(callback) {
  const request = net.request('https://www.google.com');
  request.on('response', (response) => {
    callback(true);
  });
  request.on('error', (error) => {
    callback(false);
  });
  request.end();
}

// Handle retry connection from offline page
ipcMain.on('retry-connection', (event) => {
  checkConnection((isOnline) => {
    if (isOnline) {
      loadMainsite();
    } else {
      mainWindow.loadFile(path.join(__dirname, 'public', 'offline.html'));
    }
  });
});

app.on('ready', () => {
  createSplashWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});
