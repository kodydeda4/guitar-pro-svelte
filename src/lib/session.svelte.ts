import type { ScoreInfo, ScorePlayer } from '#lib/render/types'

export interface TrackMix {
  muted: boolean
  solo: boolean
  /** 0–1, relative to the track's volume in the file. */
  volume: number
}

/** The open song: written by the library page's score view, shown in the header and panels. */
class Session {
  score = $state<ScoreInfo | null>(null)
  player = $state<ScorePlayer | null>(null)
  /** Indices of the tracks drawn in the score. */
  visibleTracks = $state<number[]>([0])
  /** Mixer settings per track index. */
  mix = $state<TrackMix[]>([])
  loading = $state(false)

  /**
   * A new song started loading. The previous score is kept until the new one arrives so the
   * tracks panel doesn't disappear and reappear on every switch.
   */
  startLoading(): void {
    this.loading = true
  }

  loaded(score: ScoreInfo): void {
    this.score = score
    this.visibleTracks = [0]
    this.mix = score.tracks.map(() => ({ muted: false, solo: false, volume: 1 }))
    this.loading = false
  }

  /** The song couldn't be opened, so nothing about the previous one applies any more. */
  failed(): void {
    this.score = null
    this.visibleTracks = [0]
    this.mix = []
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
}

export const session = new Session()
