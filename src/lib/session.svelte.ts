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
    this.mix = score.tracks.map((t) => ({ muted: false, solo: false, volume: 1, pan: t.pan }))
    this.notation = score.tracks.map((t) => ({ ...t.notation }))
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
