const { app, BrowserWindow, Menu, shell, dialog, nativeImage } = require('electron');
const path = require('path');

const WEB_APP_URL = 'https://odoo-x-sns-final-gb9t.vercel.app';

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'SIDAZ - Subscription Management',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
    show: false,
    backgroundColor: '#F0EEEF',
  });

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the web app
  mainWindow.loadURL(WEB_APP_URL);

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Handle navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(WEB_APP_URL) && !url.startsWith('http://localhost')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [{
          label: 'SIDAZ',
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        }]
      : []),
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow?.webContents.loadURL(`${WEB_APP_URL}/dashboard`),
        },
        {
          label: 'Subscriptions',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow?.webContents.loadURL(`${WEB_APP_URL}/subscriptions`),
        },
        {
          label: 'Invoices',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow?.webContents.loadURL(`${WEB_APP_URL}/invoices`),
        },
        {
          label: 'Products',
          accelerator: 'CmdOrCtrl+4',
          click: () => mainWindow?.webContents.loadURL(`${WEB_APP_URL}/products`),
        },
        { type: 'separator' },
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+Left',
          click: () => mainWindow?.webContents.goBack(),
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+Right',
          click: () => mainWindow?.webContents.goForward(),
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
            ]
          : [{ role: 'close' }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About SIDAZ',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About SIDAZ',
              message: 'SIDAZ - Subscription Management System',
              detail: 'Version 1.0.0\nDesktop application for managing subscriptions, invoices, and payments.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App lifecycle
app.whenReady().then(() => {
  // Set dock icon on macOS
  if (process.platform === 'darwin') {
    const dockIcon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png'));
    app.dock.setIcon(dockIcon);
  }

  createMenu();
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
