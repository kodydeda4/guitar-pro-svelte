import { app } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

// Small JSON settings file in the app's user-data folder
// (~/Library/Application Support/<app>/settings.json on macOS).

export interface Settings {
  libraryRoot: string | null
}

const defaults: Settings = { libraryRoot: null }
const file = (): string => join(app.getPath('userData'), 'settings.json')

export async function loadSettings(): Promise<Settings> {
  try {
    return { ...defaults, ...JSON.parse(await readFile(file(), 'utf8')) }
  } catch {
    return { ...defaults }
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await loadSettings()), ...patch }
  await writeFile(file(), JSON.stringify(next, null, 2))
  return next
}
