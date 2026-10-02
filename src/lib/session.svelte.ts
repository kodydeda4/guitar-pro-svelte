import type { ScoreInfo, ScorePlayer } from '#lib/render/types'

/** The open song: written by the library page's score view, shown in the title bar. */
class Session {
  score = $state<ScoreInfo | null>(null)
  player = $state<ScorePlayer | null>(null)
  /** Index of the track being displayed. */
  track = $state(0)
  loading = $state(false)
}

export const session = new Session()
