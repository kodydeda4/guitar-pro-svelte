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
}
