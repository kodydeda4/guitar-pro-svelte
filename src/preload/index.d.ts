import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppApi } from '../shared/library'

declare global {
  interface Window {
    /** Absent when the UI runs in a plain browser instead of Electron. */
    electron?: ElectronAPI
    api?: AppApi
  }
}
