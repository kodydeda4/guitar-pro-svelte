import type { LibrarySnapshot, LibrarySong } from '../../shared/library'

export interface ArtistGroup {
  artist: string
  albums: { album: string | null; songs: LibrarySong[] }[]
  songCount: number
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

  readonly filtered = $derived(filterSongs(this.songs, this.query))
  readonly artists = $derived(groupByArtist(this.filtered))

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
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error)
    } finally {
      this.loading = false
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
