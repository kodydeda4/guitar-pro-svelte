import {
  AlphaTabApi,
  FontFileFormat,
  LayoutMode,
  PlayerMode,
  Settings,
  model,
  synth,
  type IScrollHandler
} from '@coderline/alphatab'
import bravuraWoff from '@coderline/alphatab/font/Bravura.woff?url'
import bravuraWoff2 from '@coderline/alphatab/font/Bravura.woff2?url'
import soundFont from '@coderline/alphatab/soundfont/sonivox.sf2?url'
import type { Notation, PlaybackState, ScoreInfo, ScorePlayer, ScoreRenderer } from '../types'

/** Renders and plays scores with alphaTab inside `element`. */
export class AlphaTabScore implements ScoreRenderer, ScorePlayer {
  readonly #api: AlphaTabApi
  #score: model.Score | null = null
  #state: PlaybackState = {
    ready: false,
    playing: false,
    currentTime: 0,
    endTime: 0,
    currentBar: 1
  }
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

    this.#api.customScrollHandler = new TopAwareScrollHandler(this.#api)

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
    this.#api.playedBeatChanged.on((beat) => this.#update({ currentBar: beat.voice.bar.index + 1 }))
  }

  load(data: Uint8Array): Promise<ScoreInfo> {
    this.#api.stop()
    this.#update({ ready: false, playing: false, currentTime: 0, endTime: 0, currentBar: 1 })
    return new Promise((resolve, reject) => {
      // `scoreLoaded` replays the already-loaded score as soon as a listener registers; ignore
      // anything that arrives before this load has actually started.
      let started = false
      const offLoaded = this.#api.scoreLoaded.on((score) => {
        if (!started) return
        cleanup()
        this.#score = score
        resolve(toScoreInfo(score))
      })
      const offError = this.#api.error.on((error) => {
        if (!started) return
        cleanup()
        reject(error)
      })
      const cleanup = (): void => {
        offLoaded()
        offError()
      }
      started = true
      if (!this.#api.load(data, [0])) {
        cleanup()
        reject(new Error('Unsupported file format'))
      }
    })
  }

  showTracks(indices: number[]): void {
    const tracks = this.#tracks(indices)
    if (tracks.length > 0) this.#api.renderTracks(tracks)
  }

  setNotation(notation: Notation[]): void {
    let changed = false
    for (const track of this.#score?.tracks ?? []) {
      const n = notation[track.index]
      if (!n) continue
      for (const staff of track.staves) {
        // Tablature needs strings; leave it off for drums and other unstringed staves.
        const tablature = n.tablature && staff.isStringed
        if (
          staff.showStandardNotation !== n.standard ||
          staff.showTablature !== tablature ||
          staff.showSlash !== n.slash ||
          staff.showNumbered !== n.numbered
        ) {
          staff.showStandardNotation = n.standard
          staff.showTablature = tablature
          staff.showSlash = n.slash
          staff.showNumbered = n.numbered
          changed = true
        }
      }
    }
    if (changed) this.#api.render()
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

  seekToBar(bar: number): void {
    const masterBar = this.#score?.masterBars[bar]
    const ticks = this.#api.tickCache
    if (masterBar && ticks) this.#api.tickPosition = ticks.getMasterBarStart(masterBar)
  }

  setTrackMute(index: number, muted: boolean): void {
    this.#api.changeTrackMute(this.#tracks([index]), muted)
  }

  setTrackSolo(index: number, solo: boolean): void {
    this.#api.changeTrackSolo(this.#tracks([index]), solo)
  }

  setTrackVolume(index: number, volume: number): void {
    this.#api.changeTrackVolume(this.#tracks([index]), volume)
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

  #tracks(indices: number[]): model.Track[] {
    const all = this.#score?.tracks ?? []
    return indices.map((i) => all[i]).filter((t): t is model.Track => t !== undefined)
  }

  #update(patch: Partial<PlaybackState>): void {
    this.#state = { ...this.#state, ...patch }
    for (const listener of this.#listeners) listener(this.#state)
  }
}

type BeatBounds = Parameters<IScrollHandler['forceScrollTo']>[0]

/**
 * Like alphaTab's default vertical scrolling (scroll to a line of music whenever the cursor
 * moves to it), except the first line scrolls to the very top so the song's title and the
 * page's top edge stay visible. alphaTab scrolls to the cursor after every render, pause and
 * seek, so this is what keeps a freshly opened song at the top.
 */
class TopAwareScrollHandler implements IScrollHandler {
  readonly #api: AlphaTabApi
  #lastY = -1

  constructor(api: AlphaTabApi) {
    this.#api = api
  }

  forceScrollTo(beat: BeatBounds): void {
    this.#scrollTo(beat, true)
    this.#lastY = -1
  }

  onBeatCursorUpdating(beat: BeatBounds): void {
    this.#scrollTo(beat, false)
  }

  [Symbol.dispose](): void {}

  #scrollTo(beat: BeatBounds, force: boolean): void {
    const masterBar = beat.barBounds.masterBarBounds
    const y = masterBar.realBounds.y
    if (y === this.#lastY && !force) return
    this.#lastY = y

    const ui = this.#api.uiFacade
    const scroll = ui.getScrollContainer()
    const firstSystem = this.#api.boundsLookup?.staffSystems[0]
    const top =
      masterBar.staffSystemBounds === firstSystem
        ? 0
        : ui.getOffset(scroll, this.#api.container).y + y + this.#api.settings.player.scrollOffsetY
    ui.scrollToY(scroll, top, this.#api.settings.player.scrollSpeed)
  }
}

function toScoreInfo(score: model.Score): ScoreInfo {
  return {
    title: score.title,
    subtitle: score.subTitle,
    artist: score.artist,
    album: score.album,
    words: score.words,
    music: score.music,
    tab: score.tab,
    copyright: score.copyright,
    tempo: score.tempo,
    barCount: score.masterBars.length,
    tracks: score.tracks.map((track) => {
      const staff = track.staves[0]
      return {
        index: track.index,
        name: track.name,
        shortName: track.shortName,
        color: track.color.rgba,
        isPercussion: track.staves.some((s) => s.isPercussion),
        isStringed: staff.isStringed,
        program: track.playbackInfo.program,
        // alphaTab lists strings highest first; guitarists read tunings lowest first.
        tuning: staff.isStringed
          ? [...staff.tuning].reverse().map((note) => model.Tuning.getTextForTuning(note, false))
          : [],
        tuningName: staff.isStringed ? staff.tuningName : '',
        capo: staff.capo,
        notation: {
          standard: staff.showStandardNotation,
          tablature: staff.isStringed && staff.showTablature,
          slash: staff.showSlash,
          numbered: staff.showNumbered
        },
        activeBars: score.masterBars.map((_, bar) =>
          track.staves.some((s) => s.bars[bar] && !s.bars[bar].isRestOnly)
        )
      }
    }),
    sections: score.masterBars.flatMap((masterBar, bar) =>
      masterBar.section ? [{ bar, name: masterBar.section.text }] : []
    )
  }
}
