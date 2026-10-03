import { app, net, protocol } from 'electron'
import { createHash } from 'crypto'
import { access, mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { loadSettings } from './settings'

// Artist and album thumbnails for the library, served to the UI as
//   artwork://artist/<artist>?album=<any album by them>
//   artwork://album/<artist>/<album>
// Images placed in the tabs folder win; otherwise they're looked up on Deezer's public API,
// falling back to MusicBrainz + the Cover Art Archive for album covers Deezer doesn't have
// (common for underground metal), and cached in <userData>/artwork so each one is downloaded
// only once. Only real "not found" answers are cached; rate limits and network errors aren't,
// so those images are retried on the next request.

const SCHEME = 'artwork'
const IMAGE_NAMES = {
  album: ['cover', 'folder', 'front', 'album'],
  artist: ['artist', 'folder', 'cover']
}
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
/** How long to wait before retrying a lookup that found nothing. */
const MISS_TTL = 7 * 24 * 60 * 60 * 1000
/**
 * Bumped when lookups get better, so misses recorded by older versions are retried. (Version 1
 * cached Deezer rate-limit errors as misses, and had no MusicBrainz fallback.)
 */
const LOOKUP_VERSION = 2

/** Must run before the app is ready. */
export function registerArtworkScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } }
  ])
}

/** Must run after the app is ready. */
export function handleArtworkRequests(): void {
  protocol.handle(SCHEME, async (request) => {
    try {
      const file = await resolve(parseRequest(new URL(request.url)))
      return file ? net.fetch(pathToFileURL(file).toString()) : notFound()
    } catch {
      return notFound()
    }
  })
}

type Query =
  | { kind: 'artist'; artist: string; albumHint: string | null }
  | { kind: 'album'; artist: string; album: string }

function parseRequest(url: URL): Query {
  const [artist, album] = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
  if (url.hostname === 'album' && artist && album) return { kind: 'album', artist, album }
  if (url.hostname === 'artist' && artist) {
    return { kind: 'artist', artist, albumHint: url.searchParams.get('album') }
  }
  throw new Error(`Bad artwork URL: ${url}`)
}

const notFound = (): Response => new Response(null, { status: 404 })

// --- resolution: local folder → disk cache → Deezer -------------------------------------

const inFlight = new Map<string, Promise<string | null>>()

function resolve(query: Query): Promise<string | null> {
  const key =
    query.kind === 'album' ? `album:${query.artist}/${query.album}` : `artist:${query.artist}`
  let pending = inFlight.get(key)
  if (!pending) {
    pending = resolveUncached(key, query).finally(() => inFlight.delete(key))
    inFlight.set(key, pending)
  }
  return pending
}

async function resolveUncached(key: string, query: Query): Promise<string | null> {
  const local = await findLocalImage(query)
  if (local) return local

  const index = await loadIndex()
  const entry = index[key]
  if (entry?.file) return join(cacheDir(), entry.file)
  if (entry?.version === LOOKUP_VERSION && Date.now() - entry.checkedAt < MISS_TTL) return null

  // Throws on rate limits and network errors, which then aren't recorded as misses.
  const imageUrl =
    query.kind === 'album'
      ? await findAlbumCover(query.artist, query.album)
      : await findArtistPicture(query)
  const file = imageUrl ? await limit(() => download(key, imageUrl)) : null
  if (imageUrl && !file) throw new Error(`Couldn't download ${imageUrl}`)
  index[key] = { file, checkedAt: Date.now(), version: LOOKUP_VERSION }
  await saveIndex(index)
  return file ? join(cacheDir(), file) : null
}

async function findLocalImage(query: Query): Promise<string | null> {
  const { libraryRoot } = await loadSettings()
  if (!libraryRoot) return null
  const dir =
    query.kind === 'album'
      ? join(libraryRoot, query.artist, query.album)
      : join(libraryRoot, query.artist)
  for (const name of IMAGE_NAMES[query.kind]) {
    for (const ext of IMAGE_EXTENSIONS) {
      const path = join(dir, `${name}.${ext}`)
      if (await exists(path)) return path
    }
  }
  return null
}

// --- Deezer ------------------------------------------------------------------------------

interface DeezerArtist {
  name: string
  nb_fan?: number
  picture_medium: string
}
interface DeezerAlbum {
  title: string
  cover_medium: string
  artist: DeezerArtist
}

async function findAlbumCover(artist: string, album: string): Promise<string | null> {
  const deezerCover = (await searchAlbum(artist, album))?.cover_medium
  if (deezerCover && hasImage(deezerCover)) return deezerCover
  return coverArtArchive(artist, album)
}

/** Artist names are ambiguous ("Emperor" has several), so identify them by one of their albums. */
async function findArtistPicture(
  query: Extract<Query, { kind: 'artist' }>
): Promise<string | null> {
  if (query.albumHint) {
    const album = await searchAlbum(query.artist, query.albumHint)
    if (album && hasImage(album.artist.picture_medium)) return album.artist.picture_medium
  }
  const results = await deezer<DeezerArtist>('search/artist', query.artist)
  const best = results
    .filter((a) => similar(a.name, query.artist) && hasImage(a.picture_medium))
    .sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0))[0]
  if (best) return best.picture_medium
  // No photo anywhere (small bands): show one of their album covers instead of an icon.
  return query.albumHint ? coverArtArchive(query.artist, query.albumHint) : null
}

/** Deezer returns a URL with an empty image hash ("…/artist//250x250…") when it has no image. */
const hasImage = (url: string | undefined): url is string =>
  !!url && !/\/(artist|cover)\/\//.test(url)

/**
 * Tries progressively looser searches, but only accepts albums by (nearly) the same artist:
 * a placeholder icon beats a tribute album's cover.
 */
async function searchAlbum(artist: string, album: string): Promise<DeezerAlbum | null> {
  for (const q of [`artist:"${artist}" album:"${album}"`, `${artist} ${album}`, album]) {
    const matches = (await deezer<DeezerAlbum>('search/album', q)).filter((a) =>
      similar(a.artist.name, artist)
    )
    if (matches.length > 0) {
      return matches.find((a) => normalize(a.title) === normalize(album)) ?? matches[0]
    }
  }
  return null
}

/**
 * Deezer answers rate-limited requests with HTTP 200 and an error body, so check the body:
 * back off and retry on "quota exceeded" (code 4), and throw on any other error rather than
 * treating it as "no results".
 */
async function deezer<T>(endpoint: string, q: string): Promise<T[]> {
  const url = `https://api.deezer.com/${endpoint}?limit=10&q=${encodeURIComponent(q)}`
  for (let attempt = 0; ; attempt++) {
    const response = await limit(() => net.fetch(url))
    if (!response.ok) throw new Error(`Deezer ${endpoint}: HTTP ${response.status}`)
    const body = (await response.json()) as {
      data?: T[]
      error?: { code: number; message: string }
    }
    if (!body.error) return body.data ?? []
    if (body.error.code !== 4 || attempt >= 4) {
      throw new Error(`Deezer ${endpoint}: ${body.error.message}`)
    }
    await sleep(1000 * 2 ** attempt)
  }
}

// --- MusicBrainz + Cover Art Archive -----------------------------------------------------

const MUSICBRAINZ_HEADERS = {
  // MusicBrainz asks every client to identify itself.
  'User-Agent': `guitar-pro-svelte/${app.getVersion()} ( https://github.com/kodydeda4 )`,
  Accept: 'application/json'
}

interface ReleaseGroup {
  id: string
  title: string
  score: number
  'artist-credit'?: { name: string }[]
}

/** The front cover of the matching release group, or null if MusicBrainz has none. */
async function coverArtArchive(artist: string, album: string): Promise<string | null> {
  const query = `releasegroup:"${luceneEscape(album)}" AND artist:"${luceneEscape(artist)}"`
  const url = `https://musicbrainz.org/ws/2/release-group?fmt=json&limit=5&query=${encodeURIComponent(query)}`
  const response = await musicBrainzLimit(() => net.fetch(url, { headers: MUSICBRAINZ_HEADERS }))
  if (response.status === 503) throw new Error('MusicBrainz rate limit')
  if (!response.ok) throw new Error(`MusicBrainz: HTTP ${response.status}`)
  const body = (await response.json()) as { 'release-groups'?: ReleaseGroup[] }
  const match = (body['release-groups'] ?? []).find(
    (group) =>
      group.score >= 90 &&
      (group['artist-credit'] ?? []).some((credit) => similar(credit.name, artist))
  )
  if (!match) return null
  // Redirects to the image on archive.org; 404 when the release group has no cover.
  const cover = `https://coverartarchive.org/release-group/${match.id}/front-250`
  const head = await net.fetch(cover, { method: 'HEAD' })
  if (head.status === 404) return null
  if (!head.ok) throw new Error(`Cover Art Archive: HTTP ${head.status}`)
  return cover
}

const luceneEscape = (s: string): string => s.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, '\\$&')

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '')

/** Same name, allowing small typos ("Ynwgwie" vs "Yngwie Malmsteen"). */
function similar(a: string, b: string): boolean {
  const x = normalize(a)
  const y = normalize(b)
  if (x === y) return true
  return editDistance(x, y) <= Math.floor(Math.max(x.length, y.length) * 0.2)
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    previous = current
  }
  return previous[b.length]
}

// --- disk cache --------------------------------------------------------------------------

type Index = Record<string, { file: string | null; checkedAt: number; version?: number }>

const cacheDir = (): string => join(app.getPath('userData'), 'artwork')
const indexFile = (): string => join(cacheDir(), 'index.json')
let indexCache: Index | null = null

async function loadIndex(): Promise<Index> {
  if (!indexCache) {
    try {
      indexCache = JSON.parse(await readFile(indexFile(), 'utf8')) as Index
    } catch {
      indexCache = {}
    }
  }
  return indexCache
}

async function saveIndex(index: Index): Promise<void> {
  await mkdir(cacheDir(), { recursive: true })
  await writeFile(indexFile(), JSON.stringify(index))
}

async function download(key: string, url: string): Promise<string | null> {
  const response = await net.fetch(url)
  if (!response.ok) return null
  const file = `${createHash('sha1').update(key).digest('hex')}.jpg`
  await mkdir(cacheDir(), { recursive: true })
  await writeFile(join(cacheDir(), file), Buffer.from(await response.arrayBuffer()))
  return file
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

// --- rate limits -------------------------------------------------------------------------

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** MusicBrainz allows one request per second per client. */
let musicBrainzQueue: Promise<unknown> = Promise.resolve()
function musicBrainzLimit<T>(task: () => Promise<T>): Promise<T> {
  const run = musicBrainzQueue.then(task)
  musicBrainzQueue = run.catch(() => {}).then(() => sleep(1100))
  return run
}

// Deezer allows ~50 requests / 5s, so keep only a few in flight.

const MAX_CONCURRENT = 4
let running = 0
const waiting: (() => void)[] = []

async function limit<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) await new Promise<void>((r) => waiting.push(r))
  running++
  try {
    return await task()
  } finally {
    running--
    waiting.shift()?.()
  }
}
