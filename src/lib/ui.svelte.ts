/** App-wide UI state that outlives page navigation. */
export const ui = $state({
  /** Whether the library panel next to the rail is shown. */
  libraryOpen: true,
  /** Which list the library panel shows. */
  libraryView: 'artists' as 'artists' | 'albums' | 'songs',
  /** Whether the inspector (song/track details) is shown on the right. */
  inspectorOpen: true,
  inspectorTab: 'track' as 'song' | 'track',
  /** Whether the tracks panel under the score is expanded. */
  tracksOpen: true,
  /** Height of the expanded tracks panel's content, in px (drag its top edge to resize). */
  tracksHeight: 260
})
