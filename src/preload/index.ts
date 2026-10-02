import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppApi } from '../shared/library'

// App APIs for the renderer. Each call goes to an ipcMain.handle(...) in src/main.
const api: AppApi = {
  library: {
    get: () => ipcRenderer.invoke('library:get'),
    chooseFolder: () => ipcRenderer.invoke('library:choose-folder'),
    readSong: (path) => ipcRenderer.invoke('library:read-song', path)
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
