import { app, BrowserWindow, screen, ipcMain, Tray, Menu } from 'electron';
import { uIOhook, UiohookKey } from 'uiohook-napi';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Explicitly declare Node.js globals to resolve type errors
declare const require: any;
declare const process: any;

// Import our custom C++ addon
const cursorUtils = require('bindings')('cursor_utils');

let mainWindow: BrowserWindow | null = null;
let isCursorHidden = false;

// 1. WebSocket Server for CLI Communication
const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on('connection', (socket) => {
  socket.on('set-mode', (mode) => {
    mainWindow?.webContents.send('change-mode', mode);
  });
  
  socket.on('stop', () => {
    app.quit();
  });
});

httpServer.listen(3123); // Local port for CLI

// 2. Global Mouse Hook
uIOhook.on('mousemove', (e) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Send raw coordinates to React for rendering
    // High-frequency IPC
    mainWindow.webContents.send('mouse-move', { x: e.x, y: e.y });
  }
});

// Safety hatch: Press ESC to show system cursor and quit
uIOhook.on('keydown', (e) => {
  if (e.keycode === UiohookKey.Escape) {
    cursorUtils.show();
    app.quit();
  }
});

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For speed in this specific system utility use-case
      backgroundThrottling: false // Important for 120fps
    }
  });

  // Make window click-through
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Load React App
  // In production: mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  // In dev: 
  const devUrl = 'http://localhost:5173';
  mainWindow.loadURL(devUrl);

  // Hide system cursor globally
  cursorUtils.hide();
  isCursorHidden = true;

  uIOhook.start();
}

app.whenReady().then(() => {
  // macOS Accessibility Permission Check
  if (process.platform === 'darwin') {
      // Logic to prompt accessibility would go here
  }
  createWindow();
});

app.on('will-quit', () => {
  if (isCursorHidden) cursorUtils.show();
  uIOhook.stop();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});