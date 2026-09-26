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
 * Loopback port the production build is served from. It is fixed because the port is part of the page
 * origin, and localStorage (sign-in, dashboard layout, preferences) is keyed by origin -- a port picked
 * by the OS gave every launch a new, empty origin. A stable origin is also one the API can allow for CORS.
 */
const APP_PORT = 29317;

/**
 * Creates an HTTP server for `distDir`. Absolute asset paths (e.g. /_expo/static/…)
 * resolve correctly under http:// whereas file:// would break them.
 * @param {string} distDir
 * @returns {http.Server}
 */
function createFileServer(distDir) {
  return http.createServer((req, res) => {
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
}

/**
 * @param {http.Server} server
 * @param {number} port
 * @returns {Promise<number>} the bound port
 */
function listenOnLoopback(server, port) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve(/** @type {import('net').AddressInfo} */ (server.address()).port);
    });
  });
}

/**
 * Serves `distDir` on APP_PORT, bound to loopback only. If another program holds that port the app
 * still starts on an OS-picked port, but that session sees none of the data stored under the usual origin.
 * @param {string} distDir
 * @returns {Promise<{ server: http.Server, port: number }>}
 */
async function startLocalServer(distDir) {
  const server = createFileServer(distDir);
  try {
    return { server, port: await listenOnLoopback(server, APP_PORT) };
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'EADDRINUSE') {
      throw error;
    }
    console.warn(`Port ${APP_PORT} is in use by another program; using a random port. Data saved in earlier sessions is unavailable until it is freed.`);
    const fallbackServer = createFileServer(distDir);
    return { server: fallbackServer, port: await listenOnLoopback(fallbackServer, 0) };
  }
}

const isDev = !app.isPackaged;

/**
 * Renderer settings kept in a JSON file under userData as well as localStorage, so they survive even a
 * launch that could not get APP_PORT (a different origin, so none of the usual localStorage). The server
 * URL is one of them: signing in to the wrong server is worse than signing in again.
 */
const PERSISTED_SETTING_KEYS = new Set(['baseUrl']);
const MAX_SETTING_LENGTH = 2048;

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

/** @returns {Record<string, string>} */
function readSettings() {
  try {
    const parsed = JSON.parse(fs.readFileSync(getSettingsPath(), 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** @param {Record<string, string>} settings */
function writeSettings(settings) {
  const filePath = getSettingsPath();
  const tempPath = `${filePath}.tmp`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  // Write-then-rename so a crash mid-write never leaves a truncated settings file behind
  fs.writeFileSync(tempPath, JSON.stringify(settings, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

/**
 * Only the app itself may touch settings. The server URL decides where credentials are sent, so any
 * other page that ended up in the window -- remote, or another server on loopback -- must not change it.
 * @param {Electron.IpcMainEvent} event
 */
function isTrustedSender(event) {
  try {
    return appOrigin !== null && new URL(event.senderFrame?.url ?? '').origin === appOrigin;
  } catch {
    return false;
  }
}

function registerSettingsIpc() {
  // Synchronous so the renderer can read the server URL while its modules are still loading --
  // the API client resolves its base URL at import time.
  ipcMain.on('settings:get', (event, key) => {
    if (!isTrustedSender(event) || !PERSISTED_SETTING_KEYS.has(key)) {
      event.returnValue = null;
      return;
    }
    const value = readSettings()[key];
    event.returnValue = typeof value === 'string' ? value : null;
  });

  ipcMain.on('settings:set', (event, key, value) => {
    const isValidValue = value === null || (typeof value === 'string' && value.length <= MAX_SETTING_LENGTH);
    if (!isTrustedSender(event) || !PERSISTED_SETTING_KEYS.has(key) || !isValidValue) {
      event.returnValue = false;
      return;
    }
    try {
      const settings = readSettings();
      if (value === null) {
        delete settings[key];
      } else {
        settings[key] = value;
      }
      writeSettings(settings);
      event.returnValue = true;
    } catch (error) {
      console.error(`Failed to persist setting "${key}":`, error);
      event.returnValue = false;
    }
  });
}

/** @type {http.Server | null} */
let fileServer = null;

/**
 * Origin the renderer is loaded from; null until the app server is up.
 * @type {string | null}
 */
let appOrigin = null;

/**
 * Starts the app server on first use and reuses it for every later window (macOS re-creates the
 * window from the dock), so all windows share one origin and its storage.
 * @returns {Promise<string>}
 */
async function getAppOrigin() {
  if (appOrigin) {
    return appOrigin;
  }
  if (isDev) {
    // Development: load from Expo dev server
    appOrigin = 'http://localhost:8081';
  } else {
    // Production: serve built web export via local HTTP server so that
    // absolute asset paths (/_expo/static/…) resolve correctly.
    // Using loadFile() under file:// breaks those root-relative references.
    const { server, port } = await startLocalServer(path.join(__dirname, '..', 'dist'));
    fileServer = server;
    appOrigin = `http://127.0.0.1:${port}`;
  }
  return appOrigin;
}

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
  mainWindow.loadURL(await getAppOrigin());
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Open external links in default browser (http/https only)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url).catch((error) => {
        console.error(`Failed to open external URL "${url}":`, error);
      });
    }
    return { action: 'deny' };
  });

  return mainWindow;
}

function startApp() {
  // Create window when Electron is ready
  app
    .whenReady()
    .then(async () => {
      // Before the window exists: the renderer reads settings synchronously during its first load
      registerSettingsIpc();

      await createWindow();

      // IPC handlers — registered after BrowserWindow is created
      ipcMain.handle('get-version', () => app.getVersion());

      ipcMain.on('window-minimize', (event) => {
        BrowserWindow.fromWebContents(event.sender)?.minimize();
      });

      ipcMain.on('window-maximize', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) {
          if (win.isMaximized()) {
            win.unmaximize();
          } else {
            win.maximize();
          }
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
    })
    .catch((err) => {
      console.error('Failed to initialize app:', err);
      app.quit();
    });
}

// One instance at a time: a second would find APP_PORT taken and fall back to an origin with none of the
// saved data, while also sharing the first instance's profile directory on disk. Focus the running one.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [existingWindow] = BrowserWindow.getAllWindows();
    if (!existingWindow) {
      if (app.isReady()) {
        createWindow().catch((err) => console.error('Failed to create window for second instance:', err));
      }
      return;
    }
    if (existingWindow.isMinimized()) {
      existingWindow.restore();
    }
    existingWindow.focus();
  });

  startApp();
}

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
