/* eslint-env node */
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

/**
 * Starts a local HTTP server serving `distDir` on a random loopback port.
 * Absolute asset paths (e.g. /_expo/static/…) resolve correctly under http://
 * whereas file:// would break them.
 * @param {string} distDir
 * @returns {Promise<{ server: http.Server, port: number }>}
 */
function startLocalServer(distDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // Strip query string and hash fragment, then decode percent-encoding
      let urlPath = (req.url || '/').split('?')[0].split('#')[0];
      let decodedPath;
      try {
        decodedPath = decodeURIComponent(urlPath);
      } catch {
        res.writeHead(400);
        res.end('Bad Request');
        return;
      }
      if (decodedPath === '/') decodedPath = '/index.html';

      // Resolve and normalize; verify the result stays inside distDir
      const filePath = path.normalize(path.join(distDir, decodedPath));
      const safeRoot = distDir.endsWith(path.sep) ? distDir : distDir + path.sep;
      if (filePath !== distDir && !filePath.startsWith(safeRoot)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // SPA fallback: only serve index.html when the file is missing and the
          // request looks like a navigation route (no file extension).
          if (err.code === 'ENOENT' && path.extname(req.url) === '') {
            fs.readFile(path.join(distDir, 'index.html'), (fallbackErr, fallbackData) => {
              if (fallbackErr) {
                res.writeHead(fallbackErr.code === 'ENOENT' ? 404 : 500);
                res.end(fallbackErr.message);
              } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(fallbackData);
              }
            });
          } else if (err.code === 'ENOENT') {
            res.writeHead(404);
            res.end('Not found');
          } else {
            res.writeHead(500);
            res.end(err.message);
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        }
      });
    });

    server.once('error', reject);
    // Port 0 lets the OS pick a free port; bind to loopback only
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: /** @type {import('net').AddressInfo} */ (server.address()).port });
    });
  });
}

const isDev = !app.isPackaged;

/** @type {http.Server | null} */
let fileServer = null;

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    title: 'BigBoard',
    show: false,
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  if (isDev) {
    // Development: load from Expo dev server
    mainWindow.loadURL('http://localhost:8081');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: serve built web export via local HTTP server so that
    // absolute asset paths (/_expo/static/…) resolve correctly.
    // Using loadFile() under file:// breaks those root-relative references.
    if (fileServer) {
      fileServer.close();
      fileServer = null;
    }
    const distDir = path.join(__dirname, '..', 'dist');
    const { server, port } = await startLocalServer(distDir);
    fileServer = server;
    mainWindow.loadURL(`http://127.0.0.1:${port}`);
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

// Create window when Electron is ready
app.whenReady().then(async () => {
  await createWindow();

  // IPC handlers — registered after BrowserWindow is created
  ipcMain.handle('get-version', () => app.getVersion());

  ipcMain.on('window-minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize();
    }
  });

  ipcMain.on('window-close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  // macOS: recreate window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((err) => console.error('Failed to create window on activate:', err));
    }
  });
}).catch((err) => {
  console.error('Failed to initialize app:', err);
  app.quit();
});

// Quit when all windows closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up the local file server on exit
app.on('before-quit', () => {
  if (fileServer) {
    fileServer.close();
    fileServer = null;
  }
});
