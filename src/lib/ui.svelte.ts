/** App-wide UI state that outlives page navigation. */
export const ui = $state({
  /** Whether the sidebar next to the rail is shown. */
  sidebarOpen: true,
  /** What the sidebar shows, picked in the rail: the song library or the open song's tracks. */
  sidebarView: 'library' as 'library' | 'tracks',
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
  tracksHeight: 260
})
