import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppApi } from '../shared/library'

// App APIs for the renderer. Each call goes to an ipcMain.handle(...) in src/main.
const api: AppApi = {
  library: {
    get: () => ipcRenderer.invoke('library:get'),
    chooseFolder: () => ipcRenderer.invoke('library:choose-folder'),
    readSong: (path) => ipcRenderer.invoke('library:read-song', path)
  },
  setTheme: (theme) => ipcRenderer.send('theme:set', theme),
  getAccentColor: () => ipcRenderer.invoke('system:accent-color'),
  onAccentColorChange: (listener) => {
    const handler = (_event: unknown, color: string | null): void => listener(color)
    ipcRenderer.on('system:accent-color-changed', handler)
    return () => ipcRenderer.removeListener('system:accent-color-changed', handler)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
