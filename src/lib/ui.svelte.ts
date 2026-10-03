import { INLAY_COLORS, INLAY_SHAPES, WOODS } from '#lib/components/fretboard.svelte'
import type { InlayColor, InlayShape, Wood } from '#lib/components/fretboard.svelte'
import { findScale } from '#lib/scales'

/** App-wide UI state that outlives page navigation. */
export const ui = $state({
  /** Whether the sidebar next to the rail is shown. */
  sidebarOpen: true,
  /** What the sidebar shows, picked in the rail: the library, the song's tracks, or scales. */
  sidebarView: 'library' as 'library' | 'tracks' | 'fretboard',
  /** Whether the Settings sheet is open. */
  settingsOpen: false,
  /** Which list the library panel shows. */
  libraryView: 'artists' as 'artists' | 'albums' | 'songs',
  /** Whether the inspector (song/track details) is shown on the right. */
  inspectorOpen: true,
  inspectorTab: 'track' as 'song' | 'track',
  /** Whether the tracks panel under the score is expanded. */
  tracksOpen: true,
  /** What the panel under the score shows: the tracks timeline or a guitar fretboard. */
  tracksView: 'tracks' as 'tracks' | 'fretboard',
  /** Height of the expanded tracks panel's content, in px (drag its top edge to resize). */
  tracksHeight: 260,
  /** Scale drawn on the fretboard under the played notes (picked in the Fretboard sidebar). */
  scaleShown: true,
  /** Root pitch class, 0 = C … 11 = B. */
  scaleRoot: 9,
  /** An id from SCALES (src/lib/scales.ts). */
  scaleId: 'minor-pentatonic',
  /** How fretboard dots are labeled. */
  fretLabels: 'notes' as 'notes' | 'intervals',
  /** Fretboard look (Appearance, in the Fretboard sidebar). */
  fretboardWood: 'ebony' as Wood,
  inlayShape: 'sharkfin' as InlayShape,
  inlayColor: 'pearl' as InlayColor,
  /** Strings drawn on the fretboard: the track's own (`auto`), or a 6/7/8-string neck. */
  fretboardStrings: 'auto' as 'auto' | '6' | '7' | '8'
})

// Preferences that survive restarts, saved in the renderer's localStorage (kept by Electron in
// the app's data folder).
const STORAGE_KEY = 'ui'
const PERSISTED = [
  'tracksView',
  'tracksOpen',
  'tracksHeight',
  'scaleShown',
  'scaleRoot',
  'scaleId',
  'fretLabels',
  'fretboardWood',
  'inlayShape',
  'inlayColor',
  'fretboardStrings'
] as const satisfies (keyof typeof ui)[]

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<typeof ui>
  for (const key of PERSISTED) {
    // Only restore values of the right type, so a stale or hand-edited entry can't break the UI.
    if (typeof saved[key] === typeof ui[key]) Object.assign(ui, { [key]: saved[key] })
  }
  if (!['tracks', 'fretboard'].includes(ui.tracksView)) ui.tracksView = 'tracks'
  if (!findScale(ui.scaleId)) ui.scaleId = 'minor-pentatonic'
  if (!Number.isInteger(ui.scaleRoot) || ui.scaleRoot < 0 || ui.scaleRoot > 11) ui.scaleRoot = 9
  if (!['notes', 'intervals'].includes(ui.fretLabels)) ui.fretLabels = 'notes'
  if (!WOODS.some((w) => w.id === ui.fretboardWood)) ui.fretboardWood = 'ebony'
  if (!INLAY_SHAPES.some((s) => s.id === ui.inlayShape)) ui.inlayShape = 'sharkfin'
  if (!['auto', '6', '7', '8'].includes(ui.fretboardStrings)) ui.fretboardStrings = 'auto'
  if (!INLAY_COLORS.some((c) => c.id === ui.inlayColor)) ui.inlayColor = 'pearl'
} catch {
  // No saved preferences, or storage unavailable: keep the defaults.
}

$effect.root(() => {
  $effect(() => {
    const prefs = Object.fromEntries(PERSISTED.map((key) => [key, ui[key]]))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      // Storage unavailable: preferences just won't be remembered.
    }
  })
})
