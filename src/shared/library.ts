// Types shared by the Electron main process, the preload bridge and the UI.

export interface LibrarySong {
  /** Path relative to the library root; stable, so it doubles as the id. */
  id: string
  /** Absolute path on disk. */
  path: string
  artist: string
  album: string | null
  title: string
  trackNumber: number | null
}

export interface LibrarySnapshot {
  /** The chosen tabs folder, or null if none has been chosen yet. */
  root: string | null
  songs: LibrarySong[]
}

/** The API the preload script exposes to the UI as `window.api`. */
export interface AppApi {
  library: {
    /** The saved folder's songs (scans on every call). */
    get(): Promise<LibrarySnapshot>
    /** Shows a folder picker; resolves with the new snapshot, or null if cancelled. */
    chooseFolder(): Promise<LibrarySnapshot | null>
    /** Reads a song's file. Only paths inside the library folder are allowed. */
    readSong(path: string): Promise<Uint8Array>
  }
  /** Makes the window's native parts (the glass behind the rail) follow the app's theme. */
  setTheme(theme: 'light' | 'dark' | 'system'): void
  /** The OS accent color as "#rrggbb", or null where there isn't one (Linux). */
  getAccentColor(): Promise<string | null>
  /** Calls `listener` whenever the user changes the OS accent color; returns an unsubscribe. */
  onAccentColorChange(listener: (color: string | null) => void): () => void
}
