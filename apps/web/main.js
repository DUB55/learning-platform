const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Use app.isPackaged to determine dev mode
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#0f172a',
    show: false,
  });

  win.maximize();

  // IPC Handlers
  ipcMain.on('window-minimize', () => win.minimize());
  ipcMain.on('window-maximize', () => win.maximize());
  ipcMain.on('window-unmaximize', () => win.unmaximize());
  ipcMain.on('window-close', () => win.close());
  ipcMain.handle('is-maximized', () => win.isMaximized());

  win.setMenuBarVisibility(false);
  win.setMenu(null);

  // Try to find the correct port if in dev mode
  const ports = [3000, 3001, 3002, 3003];
  let portIndex = 0;

  const loadApp = () => {
    const url = isDev 
      ? `http://localhost:${ports[portIndex]}` 
      : `file://${path.join(__dirname, 'out/index.html')}`;
    
    console.log('Attempting to load URL:', url);
    win.loadURL(url);
  };

  loadApp();

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load: ${validatedURL} (${errorDescription})`);
    
    if (isDev) {
      // If connection refused or not found, try next port
      if (portIndex < ports.length - 1) {
        portIndex++;
        console.log(`Trying next port: ${ports[portIndex]}`);
        loadApp();
      } else {
        // Retry first port after delay
        portIndex = 0;
        console.log('All ports failed, retrying from port 3000 in 2s...');
        setTimeout(loadApp, 2000);
      }
    }
  });

  if (isDev) {
    // DevTools can be opened manually with Ctrl+Shift+I
    // win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});