// The app talks to score rendering and playback only through these interfaces, so alphaTab
// can later be replaced by a custom renderer/player without touching the rest of the UI.

export interface ScoreInfo {
  title: string
  artist: string
  album: string
  tempo: number
  barCount: number
  tracks: TrackInfo[]
  /** Section markers ("Intro", "Main Riff", …) by 0-based bar index. */
  sections: { bar: number; name: string }[]
}

export interface TrackInfo {
  index: number
  name: string
  /** CSS color from the file (Guitar Pro assigns one per track). */
  color: string
  isPercussion: boolean
  /** Per bar: whether this track plays anything there. */
  activeBars: boolean[]
}

export interface ScoreRenderer {
  /** Parses a Guitar Pro file and renders its first track. */
  load(data: Uint8Array): Promise<ScoreInfo>
  /** Re-renders showing only the given tracks (in score order). */
  showTracks(indices: number[]): void
  destroy(): void
}

export interface PlaybackState {
  /** The sound bank is loaded and the current score can be played. */
  ready: boolean
  playing: boolean
  /** Milliseconds. */
  currentTime: number
  endTime: number
  /** 1-based bar number of the beat being played. */
  currentBar: number
}

export interface ScorePlayer {
  playPause(): void
  /** Stops and rewinds to the start. */
  stop(): void
  /** 1 = normal speed. */
  setSpeed(speed: number): void
  setLooping(looping: boolean): void
  setMetronome(enabled: boolean): void
  setCountIn(enabled: boolean): void
  /** Moves playback to the start of a 0-based bar. */
  seekToBar(bar: number): void
  setTrackMute(index: number, muted: boolean): void
  setTrackSolo(index: number, solo: boolean): void
  /** 0–1, relative to the track's own volume in the file. */
  setTrackVolume(index: number, volume: number): void
  /** Called whenever playback state changes; returns an unsubscribe function. */
  onPlaybackChange(listener: (state: PlaybackState) => void): () => void
}
