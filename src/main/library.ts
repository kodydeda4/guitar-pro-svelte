import { open, readdir } from 'fs/promises'
import { basename, extname, join, relative, sep } from 'path'
import type { LibrarySong } from '../shared/library'

const GUITAR_PRO_EXTENSIONS = new Set(['.gp', '.gp3', '.gp4', '.gp5', '.gpx'])

/**
 * Recursively finds Guitar Pro files under `root`, inferring artist/album from the folder
 * layout `Artist/Album/NN Title.gp` (or `Artist/Title.gp`).
 */
export async function scanLibrary(root: string): Promise<LibrarySong[]> {
  const songs: LibrarySong[] = []

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    await Promise.all(
      entries.map(async (entry) => {
        if (entry.name.startsWith('.')) return
        const path = join(dir, entry.name)
        if (entry.isDirectory()) return walk(path)
        if (!entry.isFile()) return

        const ext = extname(entry.name)
        const known = GUITAR_PRO_EXTENSIONS.has(ext.toLowerCase())
        // Titles containing dots ("09 Rust In Peace... Polaris") lose their extension when
        // exported, so sniff files whose "extension" isn't really one.
        if (!known && !(looksExtensionless(ext) && (await isGuitarProFile(path)))) return

        songs.push(toSong(root, path, known ? basename(entry.name, ext) : entry.name))
      })
    )
  }

  await walk(root)
  return songs.sort(compareSongs)
}

/** True when `path` is inside `root`, so the UI can't read arbitrary files. */
export function isInside(root: string, path: string): boolean {
  const rel = relative(root, path)
  return rel !== '' && !rel.startsWith('..') && !rel.startsWith(sep)
}

function toSong(root: string, path: string, name: string): LibrarySong {
  const id = relative(root, path)
  const folders = id.split(sep).slice(0, -1)
  const match = name.match(/^(\d{1,3})[\s.\-_]+(.+)$/)
  return {
    id,
    path,
    artist: folders[0] ?? 'Unknown Artist',
    album: folders.length > 1 ? folders.slice(1).join(' / ') : null,
    title: match ? match[2] : name,
    trackNumber: match ? Number(match[1]) : null
  }
}

function looksExtensionless(ext: string): boolean {
  return !/^\.[a-z0-9]{1,5}$/i.test(ext)
}

/** GP6+ files are zip archives; GP3–5 start with a "FICHIER GUITAR PRO" header. */
async function isGuitarProFile(path: string): Promise<boolean> {
  const handle = await open(path, 'r')
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(19), 0, 19, 0)
    if (bytesRead < 4) return false
    const isZip = buffer.readUInt32LE(0) === 0x04034b50
    return isZip || buffer.subarray(1, 19).toString('latin1') === 'FICHIER GUITAR PRO'
  } finally {
    await handle.close()
  }
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function compareSongs(a: LibrarySong, b: LibrarySong): number {
  return (
    collator.compare(a.artist, b.artist) ||
    collator.compare(a.album ?? '', b.album ?? '') ||
    (a.trackNumber ?? Infinity) - (b.trackNumber ?? Infinity) ||
    collator.compare(a.title, b.title)
  )
}
