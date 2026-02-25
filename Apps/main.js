const { app, BrowserWindow, Menu, ipcMain, net } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const https = require('https');

let isSiteLoaded = false;
let isAnimationFinished = false;

function showMainWindow() {
  if (isSiteLoaded && isAnimationFinished) {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    if (mainWindow) {
      mainWindow.show();
    }
  }
}

// Handle splash screen animation completion
ipcMain.on('splash-finished', () => {
  isAnimationFinished = true;
  showMainWindow();
});

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 450,
    height: 450,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'icon.ico'), // Added icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'public', 'splash.html'));

  // Create main window in background
  createMainWindow();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  Menu.setApplicationMenu(null);

  const setSiteReady = () => {
    isSiteLoaded = true;
    if (splashWindow) {
      splashWindow.webContents.send('site-ready');
    }
  };

  checkConnection((isOnline) => {
    if (isOnline) {
      loadMainsite();
    } else {
      mainWindow.loadFile(path.join(__dirname, 'public', 'offline.html'));
      setSiteReady();
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    setSiteReady();
  });

  mainWindow.webContents.on('did-fail-load', () => {
    if (!mainWindow.webContents.getURL().includes('offline.html')) {
      mainWindow.loadFile(path.join(__dirname, 'public', 'offline.html'));
      setSiteReady();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function loadMainsite() {
  const url = 'https://keysandfingers.pages.dev';
  mainWindow.loadURL(url);
}

function checkConnection(callback) {
  const request = net.request('https://keysandfingers.pages.dev');
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
