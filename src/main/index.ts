import { app, shell, BrowserWindow, dialog, ipcMain } from 'electron'
import { readFile } from 'fs/promises'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import type { LibrarySnapshot } from '../shared/library'
import { handleArtworkRequests, registerArtworkScheme } from './artwork'
import { isInside, scanLibrary } from './library'
import { loadSettings, saveSettings } from './settings'

registerArtworkScheme()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    show: false,
    autoHideMenuBar: true,
    // Hide the native title bar and draw our own header instead.
    // macOS keeps the traffic lights, positioned to sit centered in the 48px title bar.
    // Windows/Linux get native window controls overlaid on the top-right of the header.
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 17 },
    ...(process.platform !== 'darwin'
      ? { titleBarOverlay: { color: '#00000000', symbolColor: '#a1a1aa', height: 48 } }
      : {}),
    backgroundColor: '#0a0a0a',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerLibraryHandlers()
  handleArtworkRequests()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

async function snapshot(root: string | null): Promise<LibrarySnapshot> {
  return { root, songs: root ? await scanLibrary(root) : [] }
}

function registerLibraryHandlers(): void {
  ipcMain.handle('library:get', async () => snapshot((await loadSettings()).libraryRoot))

  ipcMain.handle('library:choose-folder', async (event) => {
    const { libraryRoot } = await loadSettings()
    const window = BrowserWindow.fromWebContents(event.sender)
    const options: Electron.OpenDialogOptions = {
      title: 'Choose your tabs folder',
      buttonLabel: 'Use Folder',
      properties: ['openDirectory'],
      defaultPath: libraryRoot ?? app.getPath('home')
    }
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || !result.filePaths[0]) return null

    const { libraryRoot: root } = await saveSettings({ libraryRoot: result.filePaths[0] })
    return snapshot(root)
  })

  ipcMain.handle('library:read-song', async (_event, path: string) => {
    const { libraryRoot } = await loadSettings()
    if (!libraryRoot || !isInside(libraryRoot, resolve(path))) {
      throw new Error('Song is outside the library folder')
    }
    return new Uint8Array(await readFile(path))
  })
}
