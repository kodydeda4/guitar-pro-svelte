import {
  AlphaTabApi,
  FontFileFormat,
  LayoutMode,
  PlayerMode,
  Settings,
  synth,
  type model
} from '@coderline/alphatab'
import bravuraWoff from '@coderline/alphatab/font/Bravura.woff?url'
import bravuraWoff2 from '@coderline/alphatab/font/Bravura.woff2?url'
import soundFont from '@coderline/alphatab/soundfont/sonivox.sf2?url'
import type { PlaybackState, ScoreInfo, ScorePlayer, ScoreRenderer } from '../types'

/** Renders and plays scores with alphaTab inside `element`. */
export class AlphaTabScore implements ScoreRenderer, ScorePlayer {
  readonly #api: AlphaTabApi
  #score: model.Score | null = null
  #state: PlaybackState = { ready: false, playing: false, currentTime: 0, endTime: 0, currentBar: 1 }
  readonly #listeners = new Set<(state: PlaybackState) => void>()

  /** `scrollElement` is the scroll container the cursor keeps in view during playback. */
  constructor(element: HTMLElement, scrollElement: HTMLElement) {
    const settings = new Settings()
    settings.core.enableLazyLoading = true
    settings.core.smuflFontSources = new Map([
      [FontFileFormat.Woff2, bravuraWoff2],
      [FontFileFormat.Woff, bravuraWoff]
    ])
    settings.display.layoutMode = LayoutMode.Page
    settings.player.playerMode = PlayerMode.EnabledSynthesizer
    settings.player.soundFont = soundFont
    settings.player.enableCursor = true
    settings.player.enableAnimatedBeatCursor = true
    settings.player.enableUserInteraction = true
    settings.player.scrollElement = scrollElement
    settings.player.scrollOffsetY = -40
    this.#api = new AlphaTabApi(element, settings)

    this.#api.playerReady.on(() => this.#update({ ready: true }))
    // After switching songs the synth may already be warm; ready again once the new midi is in.
    this.#api.midiLoaded.on(() => {
      if (this.#api.isReadyForPlayback) this.#update({ ready: true })
    })
    this.#api.playerStateChanged.on((e) =>
      this.#update({ playing: e.state === synth.PlayerState.Playing })
    )
    this.#api.playerPositionChanged.on((e) =>
      this.#update({ currentTime: e.currentTime, endTime: e.endTime })
    )
    this.#api.playedBeatChanged.on((beat) =>
      this.#update({ currentBar: beat.voice.bar.index + 1 })
    )
  }

  load(data: Uint8Array): Promise<ScoreInfo> {
    this.#api.stop()
    this.#update({ ready: false, playing: false, currentTime: 0, endTime: 0, currentBar: 1 })
    return new Promise((resolve, reject) => {
      const offLoaded = this.#api.scoreLoaded.on((score) => {
        cleanup()
        this.#score = score
        resolve(toScoreInfo(score))
      })
      const offError = this.#api.error.on((error) => {
        cleanup()
        reject(error)
      })
      const cleanup = (): void => {
        offLoaded()
        offError()
      }
      if (!this.#api.load(data, [0])) {
        cleanup()
        reject(new Error('Unsupported file format'))
      }
    })
  }

  showTrack(index: number): void {
    const track = this.#score?.tracks[index]
    if (track) this.#api.renderTracks([track])
  }

  playPause(): void {
    this.#api.playPause()
  }

  stop(): void {
    this.#api.stop()
  }

  setSpeed(speed: number): void {
    this.#api.playbackSpeed = speed
  }

  setLooping(looping: boolean): void {
    this.#api.isLooping = looping
  }

  setMetronome(enabled: boolean): void {
    this.#api.metronomeVolume = enabled ? 1 : 0
  }

  setCountIn(enabled: boolean): void {
    this.#api.countInVolume = enabled ? 1 : 0
  }

  onPlaybackChange(listener: (state: PlaybackState) => void): () => void {
    this.#listeners.add(listener)
    listener(this.#state)
    return () => this.#listeners.delete(listener)
  }

  destroy(): void {
    this.#listeners.clear()
    this.#api.destroy()
  }

  #update(patch: Partial<PlaybackState>): void {
    this.#state = { ...this.#state, ...patch }
    for (const listener of this.#listeners) listener(this.#state)
  }
}

function toScoreInfo(score: model.Score): ScoreInfo {
  return {
    title: score.title,
    artist: score.artist,
    album: score.album,
    tempo: score.tempo,
    barCount: score.masterBars.length,
    tracks: score.tracks.map((track) => ({ index: track.index, name: track.name }))
  }
}
