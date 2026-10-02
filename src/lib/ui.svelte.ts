/** App-wide UI state that outlives page navigation. */
export const ui = $state({
  /** Whether the library panel next to the rail is shown. */
  libraryOpen: true,
  /** Whether the tracks panel under the score is expanded. */
  tracksOpen: true
})
