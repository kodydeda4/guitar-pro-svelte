// In development the app runs inside node_modules/electron's Electron.app, so macOS shows
// "Electron" in the menu bar and Dock. Rename that bundle to "Guitar Pro" (runs on postinstall).
// Packaged builds get their name from electron-builder.yml instead.
import { execFileSync } from 'child_process'
import { existsSync } from 'fs'
import { createRequire } from 'module'
import { dirname, join } from 'path'

const NAME = 'Guitar Pro'

if (process.platform === 'darwin') {
  const electronDir = dirname(createRequire(import.meta.url).resolve('electron/package.json'))
  const plist = join(electronDir, 'dist/Electron.app/Contents/Info.plist')
  if (existsSync(plist)) {
    for (const key of ['CFBundleName', 'CFBundleDisplayName']) {
      execFileSync('/usr/libexec/PlistBuddy', ['-c', `Set :${key} ${NAME}`, plist])
    }
    console.log(`Renamed the development Electron.app to "${NAME}".`)
  }
}
