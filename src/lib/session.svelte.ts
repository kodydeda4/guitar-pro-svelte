import type { Notation, ScoreInfo, ScorePlayer } from '#lib/render/types'

export interface TrackMix {
  muted: boolean
  solo: boolean
  /** 0–1, relative to the track's volume in the file. */
  volume: number
  /** -1 (left) … 0 (center) … 1 (right). */
  pan: number
}

/** The open song: written by the library page's score view, shown in the header and panels. */
class Session {
  score = $state<ScoreInfo | null>(null)
  player = $state<ScorePlayer | null>(null)
  /** Indices of the tracks drawn in the score. */
  visibleTracks = $state<number[]>([0])
  /** Mixer settings per track index. */
  mix = $state<TrackMix[]>([])
  /** How each track is drawn, by track index. */
  notation = $state<Notation[]>([])
  loading = $state(false)
  /** The library id of the song being shown (or loaded), for remembering its settings. */
  songId = $state<string | null>(null)
  /** The bar being played, 1-based. */
  bar = $state(1)
  /** Saved mixer settings and position, waiting for the player to be ready for them. */
  pendingRestore: { mix: boolean; bar: number } | null = null

  /**
   * A new song started loading. The previous score is kept until the new one arrives so the
   * tracks panel doesn't disappear and reappear on every switch.
   */
  startLoading(songId: string): void {
    this.loading = true
    this.songId = songId
  }

  loaded(score: ScoreInfo): void {
    this.score = score
    this.visibleTracks = [0]
    this.mix = score.tracks.map((t) => ({ muted: false, solo: false, volume: 1, pan: t.pan }))
    this.notation = score.tracks.map((t) => ({ ...t.notation }))
    this.bar = 1
    // Bring back how this song was left: tracks shown, mixer, notation and position.
    const saved = this.songId ? readSongState(this.songId, score.tracks.length) : null
    if (saved) {
      this.visibleTracks = saved.visibleTracks
      this.mix = saved.mix
      this.notation = saved.notation
    }
    this.pendingRestore = saved ? { mix: true, bar: saved.bar } : null
    this.loading = false
  }

  /** The song couldn't be opened, so nothing about the previous one applies any more. */
  failed(): void {
    this.score = null
    this.visibleTracks = [0]
    this.mix = []
    this.notation = []
    this.loading = false
  }

  showOnly(index: number): void {
    this.visibleTracks = [index]
  }

  /** Toggles a track in the score; at least one track always stays visible. */
  toggleVisible(index: number): void {
    const visible = this.visibleTracks.includes(index)
    if (visible && this.visibleTracks.length === 1) return
    this.visibleTracks = visible
      ? this.visibleTracks.filter((i) => i !== index)
      : [...this.visibleTracks, index].sort((a, b) => a - b)
  }

  /** The track the inspector describes: the first one drawn in the score. */
  get selectedTrack(): number {
    return this.visibleTracks[0]
  }

  /** Turns one kind of staff on or off for a track; the last one shown can't be turned off. */
  setNotation(index: number, kind: keyof Notation, on: boolean): void {
    const notation = this.notation[index]
    if (!notation) return
    const next = { ...notation, [kind]: on }
    if (!Object.values(next).some(Boolean)) return
    this.notation[index] = next
  }

  setMute(index: number, muted: boolean): void {
    this.mix[index].muted = muted
    this.player?.setTrackMute(index, muted)
  }

  setSolo(index: number, solo: boolean): void {
    this.mix[index].solo = solo
    this.player?.setTrackSolo(index, solo)
  }

  setVolume(index: number, volume: number): void {
    this.mix[index].volume = volume
    this.player?.setTrackVolume(index, volume)
  }

  setPan(index: number, pan: number): void {
    this.mix[index].pan = pan
    this.player?.setTrackPan(index, pan)
  }
}

export const session = new Session()

/** What's remembered about each song between sessions. */
interface SongState {
  visibleTracks: number[]
  mix: TrackMix[]
  notation: Notation[]
  bar: number
}

const songKey = (id: string): string => `song:${id}`

/** A song's saved state, if it still fits the file (same number of tracks). */
function readSongState(id: string, trackCount: number): SongState | null {
  try {
    const saved = JSON.parse(localStorage.getItem(songKey(id)) ?? 'null') as SongState | null
    if (
      !saved ||
      !Array.isArray(saved.visibleTracks) ||
      saved.visibleTracks.length === 0 ||
      saved.visibleTracks.some((i) => !Number.isInteger(i) || i < 0 || i >= trackCount) ||
      saved.mix?.length !== trackCount ||
      saved.notation?.length !== trackCount ||
      !Number.isInteger(saved.bar)
    ) {
      return null
    }
    return saved
  } catch {
    return null
  }
}

$effect.root(() => {
  // Save the open song's state whenever it changes.
  $effect(() => {
    const { songId, score, loading } = session
    if (!songId || !score || loading) return
    const state: SongState = {
      visibleTracks: session.visibleTracks,
      mix: session.mix,
      notation: session.notation,
      bar: session.bar
    }
    try {
      localStorage.setItem(songKey(songId), JSON.stringify(state))
    } catch {
      // Storage unavailable: this song's settings just won't be remembered.
    }
  })

  // Follow the playback position, and once the player is ready for a restored song, give it the
  // saved mixer settings and move to the saved bar.
  $effect(() => {
    const player = session.player
    if (!player) return
    return player.onPlaybackChange((state) => {
      session.bar = state.currentBar
      const pending = session.pendingRestore
      if (!state.ready || !pending) return
      session.pendingRestore = null
      if (pending.mix) {
        session.mix.forEach((m, i) => {
          player.setTrackMute(i, m.muted)
          player.setTrackSolo(i, m.solo)
          player.setTrackVolume(i, m.volume)
          player.setTrackPan(i, m.pan)
        })
      }
      if (pending.bar > 1) player.seekToBar(pending.bar - 1)
    })
  })
})
