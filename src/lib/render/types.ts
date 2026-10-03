// The app talks to score rendering and playback only through these interfaces, so alphaTab
// can later be replaced by a custom renderer/player without touching the rest of the UI.

export interface ScoreInfo {
  title: string
  subtitle: string
  artist: string
  album: string
  words: string
  music: string
  /** Who transcribed the tab. */
  tab: string
  copyright: string
  tempo: number
  barCount: number
  tracks: TrackInfo[]
  /** Section markers ("Intro", "Main Riff", …) by 0-based bar index. */
  sections: { bar: number; name: string }[]
}

export interface TrackInfo {
  index: number
  name: string
  /** Abbreviated name, e.g. "s.guit.". */
  shortName: string
  /** CSS color from the file (Guitar Pro assigns one per track). */
  color: string
  isPercussion: boolean
  /** Has strings and frets, so it can be shown as tablature. */
  isStringed: boolean
  /** General MIDI program number (0–127). */
  program: number
  /** Open-string MIDI notes, lowest string first (standard guitar: 40 45 50 55 59 64); empty if not stringed. */
  tuning: number[]
  /** Name of a known tuning ("Drop D"), or empty. */
  tuningName: string
  /** Fret the capo is on; 0 for none. */
  capo: number
  /** Pan from the file: -1 (left) … 0 (center) … 1 (right). */
  pan: number
  /** How the track is drawn, as saved in the file. */
  notation: Notation
  /** Per bar: whether this track plays anything there. */
  activeBars: boolean[]
}

/** Which kinds of staff a track is drawn with; at least one is always on. */
export interface Notation {
  standard: boolean
  tablature: boolean
  slash: boolean
  numbered: boolean
}

export interface ScoreRenderer {
  /** Parses a Guitar Pro file and renders its first track. */
  load(data: Uint8Array): Promise<ScoreInfo>
  /** Re-renders showing only the given tracks (in score order). */
  showTracks(indices: number[]): void
  /** Sets how each track (by index) is drawn; re-renders only if something changed. */
  setNotation(notation: Notation[]): void
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

/** A note on a fretted instrument. */
export interface FrettedNote {
  /** Track index. */
  track: number
  /** 0 = lowest string. */
  string: number
  /** As written in the tab (0 = open), not counting a capo. */
  fret: number
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
  /** -1 (left) … 0 (center) … 1 (right). */
  setTrackPan(index: number, pan: number): void
  /** Called whenever the notes at the playback position change; returns an unsubscribe function. */
  onNotesChange(listener: (notes: FrettedNote[]) => void): () => void
  /** Called whenever playback state changes; returns an unsubscribe function. */
  onPlaybackChange(listener: (state: PlaybackState) => void): () => void
}
