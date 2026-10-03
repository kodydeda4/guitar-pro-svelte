import type { LibrarySnapshot, LibrarySong } from '../../shared/library'

export interface ArtistGroup {
  artist: string
  albums: { album: string | null; songs: LibrarySong[] }[]
  songCount: number
}

export interface AlbumGroup {
  artist: string
  album: string
  songs: LibrarySong[]
}

/** The tabs library: the chosen folder, its songs, search and the selected song. */
export class Library {
  /** False when running in a plain browser, where there's no file system access. */
  readonly available = typeof window !== 'undefined' && window.api !== undefined

  root = $state<string | null>(null)
  songs = $state<LibrarySong[]>([])
  loading = $state(false)
  error = $state<string | null>(null)
  query = $state('')
  selected = $state<LibrarySong | null>(null)
  /** Whether the library has been read at least once (so `selected` reflects a real choice). */
  ready = $state(false)

  readonly filtered = $derived(filterSongs(this.songs, this.query))
  readonly artists = $derived(groupByArtist(this.filtered))
  /** Every named album, A–Z. Songs without an album only appear under artists and songs. */
  readonly albums = $derived(listAlbums(this.artists))
  /** Every song, A–Z by title. */
  readonly songsByTitle = $derived(
    [...this.filtered].sort((a, b) => a.title.localeCompare(b.title))
  )

  async load(): Promise<void> {
    await this.#run(() => window.api!.library.get())
  }

  async chooseFolder(): Promise<void> {
    await this.#run(() => window.api!.library.chooseFolder())
  }

  readSong(song: LibrarySong): Promise<Uint8Array> {
    return window.api!.library.readSong(song.path)
  }

  async #run(fetch: () => Promise<LibrarySnapshot | null>): Promise<void> {
    if (!this.available) return
    this.loading = true
    this.error = null
    try {
      const snapshot = await fetch()
      if (snapshot) {
        this.root = snapshot.root
        this.songs = snapshot.songs
        if (this.selected && !snapshot.songs.some((s) => s.id === this.selected?.id)) {
          this.selected = null
        }
        // Reopen the song that was open last time (it survives reloads and restarts).
        if (!this.selected) {
          const id = readSavedSelection()
          this.selected = snapshot.songs.find((s) => s.id === id) ?? null
        }
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error)
    } finally {
      this.loading = false
      this.ready = true
    }
  }
}

function filterSongs(songs: LibrarySong[], query: string): LibrarySong[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return songs
  return songs.filter((song) => {
    const haystack = `${song.artist} ${song.album ?? ''} ${song.title}`.toLowerCase()
    return terms.every((term) => haystack.includes(term))
  })
}

/** Songs arrive sorted by artist, album, track, so grouping is a single pass. */
function groupByArtist(songs: LibrarySong[]): ArtistGroup[] {
  const groups: ArtistGroup[] = []
  for (const song of songs) {
    let group = groups.at(-1)
    if (group?.artist !== song.artist) {
      group = { artist: song.artist, albums: [], songCount: 0 }
      groups.push(group)
    }
    let album = group.albums.at(-1)
    if (!album || album.album !== song.album) {
      album = { album: song.album, songs: [] }
      group.albums.push(album)
    }
    album.songs.push(song)
    group.songCount++
  }
  return groups
}

function listAlbums(artists: ArtistGroup[]): AlbumGroup[] {
  return artists
    .flatMap((group) =>
      group.albums.flatMap((a) =>
        a.album ? [{ artist: group.artist, album: a.album, songs: a.songs }] : []
      )
    )
    .sort((a, b) => a.album.localeCompare(b.album))
}

/** The app-wide library, shared by the sidebar and every page. */
export const library = new Library()

// The open song is remembered by id, in the renderer's localStorage.
const SELECTED_KEY = 'library.selected'

function readSavedSelection(): string | null {
  try {
    return localStorage.getItem(SELECTED_KEY)
  } catch {
    return null
  }
}

$effect.root(() => {
  $effect(() => {
    const id = library.selected?.id
    // Not read yet: keep what's saved until the library can check the song still exists.
    if (!library.ready) return
    try {
      if (id) localStorage.setItem(SELECTED_KEY, id)
      else localStorage.removeItem(SELECTED_KEY)
    } catch {
      // Storage unavailable: the open song just won't be remembered.
    }
  })
})
