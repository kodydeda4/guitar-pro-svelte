<script lang="ts">
  import BookmarkIcon from '@lucide/svelte/icons/bookmark'
  import DrumIcon from '@lucide/svelte/icons/drum'
  import EyeIcon from '@lucide/svelte/icons/eye'
  import GuitarIcon from '@lucide/svelte/icons/guitar'
  import KeyboardMusicIcon from '@lucide/svelte/icons/keyboard-music'
  import MicVocalIcon from '@lucide/svelte/icons/mic-vocal'
  import MusicIcon from '@lucide/svelte/icons/music'
  import PianoIcon from '@lucide/svelte/icons/piano'
  import type { Component } from 'svelte'
  import ListMusicIcon from '@lucide/svelte/icons/list-music'

  import Fretboard, { type FretMarker } from '#lib/components/fretboard.svelte'
  import PanKnob from '#lib/components/pan-knob.svelte'
  import * as Kbd from '#lib/components/ui/kbd'
  import { GM_INSTRUMENTS, noteName } from '#lib/midi'
  import { degreeName, findScale } from '#lib/scales'
  import { Slider } from '#lib/components/ui/slider'
  import * as Tabs from '#lib/components/ui/tabs'
  import type { FrettedNote, ScoreInfo, TrackInfo } from '#lib/render/types'
  import { session } from '#lib/session.svelte'
  import { ui } from '#lib/ui.svelte'
  import { cn } from '#lib/utils'

  /** The open song, or `null` when none is: the panel still shows, just empty. */
  let { score }: { score: ScoreInfo | null } = $props()

  /** Width of one bar in the timeline, in px. */
  const CELL = 20
  /** Width of the track headers column, in px. */
  const MIXER_WIDTH = 320
  const isMac = window.electron?.process.platform === 'darwin'

  let currentBar = $state(1)
  let timeline = $state<HTMLDivElement>()

  $effect(() => session.player?.onPlaybackChange((s) => (currentBar = s.currentBar)))

  // Keep the playing bar in view as playback moves along the timeline.
  $effect(() => {
    if (!timeline) return
    // The mixer column covers the left of the scroll area, so measure from its edge.
    const left = (currentBar - 1) * CELL
    const visibleWidth = timeline.clientWidth - MIXER_WIDTH
    const { scrollLeft } = timeline
    if (left < scrollLeft || left + CELL > scrollLeft + visibleWidth) {
      timeline.scrollTo({ left: Math.max(0, left - visibleWidth / 3), behavior: 'smooth' })
    }
  })

  const MIN_HEIGHT = 80
  /** Dragging this far past the minimum height collapses the panel instead. */
  const COLLAPSE_OVERSHOOT = 40

  function startResize(event: PointerEvent): void {
    event.preventDefault()
    const startY = event.clientY
    const startHeight = ui.tracksHeight
    // From collapsed, the panel grows out of the header bar: it opens once dragged up past the
    // same threshold that collapses it.
    const base = ui.tracksOpen ? startHeight : 0
    // Never let the panel take more than ~70% of the window, so the score stays visible.
    const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight * 0.7)
    // Listen on the window: the top-edge handle disappears while the panel is collapsed.
    const onMove = (e: PointerEvent): void => {
      const next = base + (startY - e.clientY)
      // Clearly dragged past the bottom: collapse (dragging back up reopens it).
      ui.tracksOpen = next >= MIN_HEIGHT - COLLAPSE_OVERSHOOT
      if (ui.tracksOpen)
        ui.tracksHeight = Math.round(Math.min(maxHeight, Math.max(MIN_HEIGHT, next)))
    }
    const onUp = (): void => {
      // Ended collapsed: reopen later at the size it had before the drag.
      if (!ui.tracksOpen) ui.tracksHeight = startHeight
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const anySolo = $derived(session.mix.some((m) => m.solo))
  const audible = (index: number): boolean => {
    const mix = session.mix[index]
    return !!mix && (anySolo ? mix.solo : !mix.muted)
  }
  /** The fretboard shows the selected track (the first one drawn in the score). */
  const fretboardTrack = $derived(score?.tracks[session.selectedTrack])
  /** With no song open, the fretboard shows a guitar in standard tuning (E A D G B E). */
  const STANDARD_TUNING = [40, 45, 50, 55, 59, 64]

  let notes = $state<FrettedNote[]>([])
  $effect(() => session.player?.onNotesChange((n) => (notes = n)))

  /** Frets drawn on the fretboard (its default). */
  const FRETS = 24
  /** Scale tones that aren't being played (played notes use the accent color). */
  const IDLE_COLOR = '#94a3b8'

  /**
   * The strings drawn on the fretboard, lowest first: the track's own, or (when a string count is
   * picked in Appearance) extended with lower strings a fourth apart, B then F♯ below standard
   * tuning, or with its lowest strings left off. `offset` maps a track string onto these.
   */
  const fretboardStrings = $derived.by((): { tuning: number[]; offset: number } => {
    const tuning = score ? (fretboardTrack?.tuning ?? []) : STANDARD_TUNING
    if (ui.fretboardStrings === 'auto' || tuning.length === 0) return { tuning, offset: 0 }
    const count = Number(ui.fretboardStrings)
    const offset = count - tuning.length
    if (offset <= 0) return { tuning: tuning.slice(-offset), offset }
    const lower = Array.from({ length: offset }, (_, i) => tuning[0] - 5 * (offset - i))
    return { tuning: [...lower, ...tuning], offset }
  })

  const scale = $derived(ui.scaleShown ? findScale(ui.scaleId) : undefined)
  /** Pitch classes in the scale (0 = C). */
  const scaleTones = $derived(new Set(scale?.intervals.map((i) => (ui.scaleRoot + i) % 12) ?? []))

  /**
   * The selected scale on every string and fret (quiet dots), with the selected track's notes at
   * the playback position on top in the accent color.
   */
  const fretboardMarkers = $derived.by((): FretMarker[] => {
    const track = fretboardTrack
    const { tuning, offset } = fretboardStrings
    const pitchClass = (midi: number): number => ((midi % 12) + 12) % 12
    const label = (midi: number): string =>
      scale && ui.fretLabels === 'intervals'
        ? degreeName(pitchClass(midi) - ui.scaleRoot)
        : noteName(midi)

    const played: FretMarker[] = !track
      ? []
      : notes
          .filter(
            (n) =>
              n.track === track.index && n.string < track.tuning.length && n.string + offset >= 0
          )
          .map((n): FretMarker => {
            // Tabs write frets relative to the capo; the fretboard shows the real position.
            const fret = n.fret + track.capo
            const midi = track.tuning[n.string] + fret
            return { string: n.string + offset, fret, label: label(midi), active: true }
          })
    if (!scale) return played

    const taken = new Set(played.map((m) => `${m.string}:${m.fret}`))
    const tones: FretMarker[] = []
    tuning.forEach((open, string) => {
      for (let fret = 0; fret <= FRETS; fret++) {
        const midi = open + fret
        if (!scaleTones.has(pitchClass(midi)) || taken.has(`${string}:${fret}`)) continue
        tones.push({
          string,
          fret,
          label: label(midi),
          color: IDLE_COLOR
        })
      }
    })
    return [...tones, ...played]
  })

  const barCount = $derived(score?.barCount ?? 0)
  const timelineWidth = $derived(barCount * CELL)
  /** Bar numbers at the start of each 4-bar group: 1, 5, 9… */
  const barNumbers = $derived(
    Array.from({ length: barCount }, (_, i) => i + 1).filter((n) => (n - 1) % 4 === 0)
  )
  /** The playhead sits at the start of the bar being played. */
  const playheadX = $derived((currentBar - 1) * CELL)

  /**
   * Guitar Pro names tracks like "Tom Keifer | Lead Vocals": show the part, with the musician
   * underneath. Other names get the instrument underneath instead.
   */
  function trackLabel(track: TrackInfo): { title: string; subtitle: string } {
    const name = track.name.trim() || `Track ${track.index + 1}`
    const [who, ...part] = name.split('|').map((s) => s.trim())
    if (part.length > 0 && part.join(' | ')) return { title: part.join(' | '), subtitle: who }
    return { title: name, subtitle: instrumentName(track) }
  }

  const instrumentName = (track: TrackInfo): string =>
    track.isPercussion ? 'Drum Kit' : (GM_INSTRUMENTS[track.program] ?? 'Instrument')

  /** An icon for the track's General MIDI instrument family. */
  function instrumentIcon(track: TrackInfo): Component {
    const p = track.program
    if (track.isPercussion) return DrumIcon
    if (p <= 7) return PianoIcon
    if (p >= 16 && p <= 23) return KeyboardMusicIcon
    if (p >= 24 && p <= 39) return GuitarIcon
    if (p >= 52 && p <= 54) return MicVocalIcon
    return MusicIcon
  }

  /** Runs of consecutive bars where a track plays, drawn as one region each. */
  function regions(activeBars: boolean[]): { start: number; length: number }[] {
    const runs: { start: number; length: number }[] = []
    activeBars.forEach((active, bar) => {
      const last = runs.at(-1)
      if (!active) return
      if (last && last.start + last.length === bar) last.length++
      else runs.push({ start: bar, length: 1 })
    })
    return runs
  }

  /** Moves playback to the clicked bar (and shows the track, when a track lane was clicked). */
  function seekTo(event: MouseEvent, track?: number): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const bar = Math.min(barCount - 1, Math.max(0, Math.floor((event.clientX - rect.left) / CELL)))
    if (track !== undefined) session.showOnly(track)
    session.player?.seekToBar(bar)
  }
</script>

<section class="relative shrink-0 border-t bg-background">
  {#if ui.tracksOpen}
    <!-- Drag the top edge to resize the panel. -->
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize tracks panel"
      class="absolute inset-x-0 -top-1 z-10 h-2 cursor-row-resize transition-colors hover:bg-primary/20 active:bg-primary/30"
      onpointerdown={startResize}
    ></div>
  {/if}
  <!-- Header: the Tracks | Fretboard picker (picking a view also expands the panel), details for
       the current view, and the collapse toggle. Dragging its empty space resizes the panel (and opens it when collapsed). -->
  <!-- svelte-ignore a11y_no_static_element_interactions (the separator above is the accessible
       resize handle; this just makes the whole bar a larger drag target) -->
  <div
    class={cn(
      'flex h-12 items-center gap-3 px-4 text-sm',
      'cursor-row-resize [&_button]:cursor-default'
    )}
    onpointerdown={(e) => {
      // Only the bar's empty space: tabs, buttons and other controls keep their own behavior.
      if ((e.target as Element).closest('button, a, input, [role]')) return
      startResize(e)
    }}
  >
    <Tabs.Root
      value={ui.tracksView}
      onValueChange={(view) => (ui.tracksView = view as typeof ui.tracksView)}
    >
      <Tabs.List variant="line" class="h-12 gap-6 p-0">
        <Tabs.Trigger
          value="tracks"
          class="flex-none gap-2 px-0 text-[15px] [&_svg:not([class*='size-'])]:size-[18px]"
          onclick={() => (ui.tracksOpen = true)}
        >
          <ListMusicIcon />
          Tracks
          <span
            class="rounded-full bg-muted px-1.5 text-xs leading-5 font-medium text-muted-foreground tabular-nums"
          >
            {score?.tracks.length ?? 0}
          </span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="fretboard"
          class="flex-none gap-2 px-0 text-[15px] [&_svg:not([class*='size-'])]:size-[18px]"
          onclick={() => (ui.tracksOpen = true)}
        >
          <GuitarIcon />
          Fretboard
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>

    <!-- Details for the current view. -->
    <div class="ml-auto flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
      {#if !score}
        <span class="whitespace-nowrap">
          {ui.tracksView === 'fretboard'
            ? `Standard tuning · ${fretboardStrings.tuning.length} strings`
            : 'No song open'}
        </span>
      {:else if ui.tracksView === 'tracks'}
        <span class="flex items-center gap-1.5 whitespace-nowrap">
          <EyeIcon class="size-3.5" />
          {session.visibleTracks.length} of {score.tracks.length} shown
        </span>
        <span class="flex items-center gap-1.5 whitespace-nowrap tabular-nums">
          <BookmarkIcon class="size-3.5" />
          {score.sections.length}
          {score.sections.length === 1 ? 'section' : 'sections'}
        </span>
      {:else if fretboardTrack}
        <span class="flex min-w-0 items-center gap-1.5">
          <span class="size-2 shrink-0 rounded-full" style:background={fretboardTrack.color}></span>
          <span class="truncate font-medium text-foreground">
            {fretboardTrack.name || `Track ${fretboardTrack.index + 1}`}
          </span>
        </span>
        {#if fretboardTrack.tuning.length > 0}
          <span class="whitespace-nowrap">
            {fretboardTrack.tuningName ||
              fretboardTrack.tuning.map((note) => noteName(note)).join(' ')}
            · {fretboardTrack.tuning.length} strings{fretboardTrack.capo > 0
              ? ` · Capo ${fretboardTrack.capo}`
              : ''}
          </span>
        {/if}
      {/if}
      <Kbd.Root>{isMac ? '⌘⇧Y' : 'Ctrl+Shift+Y'}</Kbd.Root>
    </div>

    <!-- Show/hide the panel's content: accent-colored while open, gray while collapsed. -->
    <button
      type="button"
      class={cn(
        '-mr-1 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted',
        ui.tracksOpen ? 'text-primary' : 'text-muted-foreground'
      )}
      onclick={() => (ui.tracksOpen = !ui.tracksOpen)}
      aria-expanded={ui.tracksOpen}
      aria-label={ui.tracksOpen ? 'Collapse panel' : 'Expand panel'}
    >
      <svg viewBox="0 0 20 20" class="size-[18px]" aria-hidden="true">
        <rect
          x="2.75"
          y="3.75"
          width="14.5"
          height="12.5"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <rect x="5" y="10.5" width="10" height="3.5" rx="1" fill="currentColor" />
      </svg>
    </button>
  </div>

  {#if ui.tracksOpen && ui.tracksView === 'fretboard'}
    <div class="border-t" style:height="{ui.tracksHeight}px">
      {#if fretboardStrings.tuning.length > 0}
        <Fretboard
          tuning={fretboardStrings.tuning}
          frets={FRETS}
          markers={fretboardMarkers}
          wood={ui.fretboardWood}
          inlays={ui.inlayShape}
          inlayColor={ui.inlayColor}
          inlayCustom={ui.inlayCustom}
        />
      {:else}
        <div class="flex h-full items-center justify-center text-sm text-muted-foreground">
          Select a stringed track to see its fretboard.
        </div>
      {/if}
    </div>
  {:else if ui.tracksOpen && !score}
    <div
      class="flex flex-col items-center justify-center gap-1 border-t text-center"
      style:height="{ui.tracksHeight}px"
    >
      <p class="text-sm font-medium">No song open</p>
      <p class="text-xs text-muted-foreground">
        Pick a song from the library to see its tracks here.
      </p>
    </div>
  {:else if ui.tracksOpen && score}
    <!-- Logic/GarageBand-style arrangement: track headers on the left (sticky), regions where
         each track plays, a sections lane and a ruler (both sticky on top), and a playhead. -->
    <div
      bind:this={timeline}
      class={cn('overflow-auto border-t text-sm', session.loading && 'pointer-events-none')}
      style:height="{ui.tracksHeight}px"
    >
      <div
        class="relative flex min-h-full min-w-full flex-col"
        style:width="{MIXER_WIDTH + timelineWidth}px"
      >
        <!-- Sections lane (pinned on top): each section spans up to the next one. -->
        <div class="sticky top-0 z-20 flex h-7 border-b bg-background text-[11px]">
          <div
            class="sticky left-0 z-10 flex shrink-0 items-center border-r bg-sidebar px-3 font-medium text-muted-foreground"
            style:width="{MIXER_WIDTH}px"
          >
            Sections
          </div>
          <div class="relative shrink-0" style:width="{timelineWidth}px">
            {#each score.sections as section, i (section.bar)}
              {@const end = score.sections[i + 1]?.bar ?? score.barCount}
              <button
                type="button"
                class="section absolute inset-y-1 flex cursor-default items-center gap-1 overflow-hidden rounded-[5px] px-1.5 font-medium"
                style:left="{section.bar * CELL + 1}px"
                style:width="{(end - section.bar) * CELL - 2}px"
                title={section.name}
                onclick={() => session.player?.seekToBar(section.bar)}
              >
                <BookmarkIcon class="size-3 shrink-0 fill-current opacity-60" />
                <span class="truncate">{section.name}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Ruler: click to move the playhead. -->
        <div class="sticky top-7 z-20 flex h-7 border-b bg-background">
          <div
            class="sticky left-0 z-10 flex shrink-0 items-center border-r bg-sidebar px-3 text-[11px] font-medium text-muted-foreground"
            style:width="{MIXER_WIDTH}px"
          >
            {score.tracks.length}
            {score.tracks.length === 1 ? 'track' : 'tracks'}
          </div>
          <button
            type="button"
            class="ruler relative h-full shrink-0 cursor-default text-[10px] font-medium text-muted-foreground tabular-nums"
            style:width="{timelineWidth}px"
            onclick={(e) => seekTo(e)}
            aria-label="Move playhead"
          >
            {#each barNumbers as n (n)}
              <span class="absolute top-1" style:left="{(n - 1) * CELL + 3}px">{n}</span>
            {/each}
            <span
              class="playhead-handle absolute bottom-0 transition-[left] duration-150"
              style:left="{playheadX}px"
            ></span>
          </button>
        </div>

        {#each score.tracks as track (track.index)}
          {@const mix = session.mix[track.index]}
          {@const visible = session.visibleTracks.includes(track.index)}
          {@const selected = track.index === session.selectedTrack}
          {@const Icon = instrumentIcon(track)}
          {@const label = trackLabel(track)}
          <div class="group/row flex h-16 shrink-0 border-b border-border/50">
            <!-- Track header, GarageBand-style: number strip in the track color, instrument
                 icon, name, then M|S, show-in-score and volume underneath, and a pan knob. -->
            <div
              class={cn(
                'sticky left-0 z-10 flex shrink-0 border-r bg-sidebar',
                selected && 'track-selected'
              )}
              style:width="{MIXER_WIDTH}px"
            >
              <button
                type="button"
                class="track-number flex w-7 shrink-0 items-center justify-center text-[13px] font-semibold tabular-nums"
                style:--track={track.color}
                onclick={() => session.showOnly(track.index)}
                aria-label="Show {label.title} in the score"
              >
                {track.index + 1}
              </button>

              <div
                class={cn(
                  'flex min-w-0 flex-1 items-center gap-3 pr-2.5 pl-3',
                  !audible(track.index) && 'inaudible-header'
                )}
              >
                <button
                  type="button"
                  class="track-icon shrink-0"
                  style:--track={track.color}
                  onclick={() => session.showOnly(track.index)}
                  tabindex={-1}
                  aria-hidden="true"
                >
                  <Icon class="size-8" strokeWidth={1.5} />
                </button>

                <div class="flex min-w-0 flex-1 flex-col gap-1.5">
                  <button
                    type="button"
                    class="truncate text-left text-[13px] leading-tight font-semibold"
                    onclick={() => session.showOnly(track.index)}
                    title={track.name}
                  >
                    {label.title}<span class="font-normal text-muted-foreground"
                      >{` | ${label.subtitle}`}</span
                    >
                  </button>

                  {#if mix}
                    <div class="flex items-center gap-2">
                      <div class="segmented">
                        <button
                          type="button"
                          class="mute"
                          aria-pressed={mix.muted}
                          onclick={() => session.setMute(track.index, !mix.muted)}
                          title="Mute"
                        >
                          M
                        </button>
                        <button
                          type="button"
                          class="solo"
                          aria-pressed={mix.solo}
                          onclick={() => session.setSolo(track.index, !mix.solo)}
                          title="Solo"
                        >
                          S
                        </button>
                      </div>
                      <div class="segmented">
                        <button
                          type="button"
                          class="show"
                          aria-pressed={visible}
                          onclick={() => session.toggleVisible(track.index)}
                          title={visible ? 'Hide in score' : 'Show in score'}
                        >
                          <EyeIcon class="size-3.5" />
                        </button>
                      </div>
                      <Slider
                        type="single"
                        class="track-volume min-w-12 flex-1"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.round(mix.volume * 100)}
                        onValueChange={(v) => session.setVolume(track.index, v / 100)}
                        aria-label="Volume"
                      />
                    </div>
                  {/if}
                </div>

                {#if mix}
                  <PanKnob
                    value={mix.pan}
                    size={30}
                    onchange={(v) => session.setPan(track.index, v)}
                    label="Pan"
                  />
                {/if}
              </div>
            </div>

            <!-- Lane: regions where the track plays, on a bar grid. Click to jump there. -->
            <button
              type="button"
              class={cn(
                'lane relative h-full shrink-0 cursor-default',
                !audible(track.index) && 'inaudible'
              )}
              style:width="{timelineWidth}px"
              onclick={(e) => seekTo(e, track.index)}
              aria-label="Jump to a bar in {track.name || `track ${track.index + 1}`}"
            >
              {#each regions(track.activeBars) as region (region.start)}
                <span
                  class="region absolute inset-y-1 flex flex-col overflow-hidden rounded-[5px] text-left"
                  style:--track={track.color}
                  style:left="{region.start * CELL + 1}px"
                  style:width="{region.length * CELL - 2}px"
                >
                  <span class="region-header truncate px-1.5 text-[10px] leading-3.5 font-semibold">
                    {region.length * CELL > 56 ? label.title : ''}
                  </span>
                </span>
              {/each}
            </button>
          </div>
        {/each}

        <!-- Fills the rest of the panel, so the track headers column and the bar grid run all
             the way down instead of ending after the last track. -->
        <div class="flex flex-1">
          <div
            class="sticky left-0 z-10 shrink-0 border-r bg-sidebar"
            style:width="{MIXER_WIDTH}px"
          ></div>
          <div class="lane shrink-0" style:width="{timelineWidth}px"></div>
        </div>

        <!-- Playhead, under the sticky track headers so it hides behind them when scrolled. -->
        <span
          class="pointer-events-none absolute top-14 bottom-0 z-[5] w-px bg-primary transition-[left] duration-150"
          style:left="{MIXER_WIDTH + playheadX}px"
        ></span>
      </div>
    </div>
  {/if}
</section>

<style>
  /* Ruler ticks: a short one per bar, a longer one every 4 bars. */
  .ruler {
    background:
      linear-gradient(90deg, var(--border) 1px, transparent 1px) 0 100% / calc(4 * 20px) 10px
        repeat-x,
      linear-gradient(90deg, var(--border) 1px, transparent 1px) 0 100% / 20px 4px repeat-x;
  }
  .playhead-handle {
    width: 11px;
    height: 7px;
    translate: -5px 0;
    background: var(--primary);
    clip-path: polygon(0 0, 100% 0, 50% 100%);
  }

  .track-selected {
    background: color-mix(in oklab, var(--primary) 16%, var(--sidebar));
  }
  /* Track colors from Guitar Pro files are bright pastels; mute them toward the sidebar so they
     tint the header rather than shout. */
  .track-number {
    background: color-mix(in oklab, var(--track) 75%, var(--sidebar));
    color: white;
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.25);
  }
  .track-icon {
    color: color-mix(in oklab, var(--track) 80%, var(--muted-foreground));
  }
  .inaudible-header {
    opacity: 0.55;
  }

  /* M|S and show-in-score: small segmented keys, like GarageBand's track header buttons. */
  .segmented {
    display: flex;
    height: 1.25rem;
    overflow: hidden;
    border-radius: 5px;
    background: color-mix(in oklab, var(--foreground) 12%, transparent);
    box-shadow:
      inset 0 0 0 1px rgb(0 0 0 / 0.18),
      0 1px 0 rgb(255 255 255 / 0.04);
  }
  .segmented button {
    display: flex;
    width: 1.5rem;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: color-mix(in oklab, var(--foreground) 80%, transparent);
  }
  .segmented button + button {
    border-left: 1px solid rgb(0 0 0 / 0.25);
  }
  .segmented button:hover {
    background: color-mix(in oklab, var(--foreground) 8%, transparent);
  }
  .segmented .mute[aria-pressed='true'] {
    background: var(--primary);
    color: var(--primary-foreground);
  }
  .segmented .solo[aria-pressed='true'] {
    background: #fbbf24;
    color: #000;
  }
  .segmented .show[aria-pressed='true'] {
    background: color-mix(in oklab, var(--foreground) 80%, transparent);
    color: var(--background);
  }

  /* Volume: a recessed pill with a round knob, like GarageBand's track fader. */
  :global(.track-volume [data-slot='slider-track'][data-orientation]) {
    height: 1.25rem;
    background: color-mix(in oklab, var(--foreground) 9%, transparent);
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.18);
  }
  :global(.dark .track-volume [data-slot='slider-track'][data-orientation]) {
    background: rgb(0 0 0 / 0.35);
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.4);
  }
  :global(.track-volume [data-slot='slider-range']) {
    background: color-mix(in oklab, var(--foreground) 10%, transparent);
  }
  :global(.track-volume [data-slot='slider-thumb']) {
    width: 1rem;
    height: 1rem;
    border: none;
    background: linear-gradient(180deg, #d4d4d8, #9b9ba3);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.5);
  }

  /* Bar grid: faint lines per bar, stronger every 4 bars. */
  .lane {
    background:
      linear-gradient(
          90deg,
          color-mix(in oklab, var(--border) 100%, transparent) 1px,
          transparent 1px
        )
        0 0 / calc(4 * 20px) 100%,
      linear-gradient(
          90deg,
          color-mix(in oklab, var(--border) 45%, transparent) 1px,
          transparent 1px
        )
        0 0 / 20px 100%;
  }
  .region {
    background: color-mix(in oklab, var(--track) 42%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--track) 80%, transparent);
  }
  .region-header {
    background: color-mix(in oklab, var(--track) 80%, transparent);
    color: color-mix(in oklab, var(--track) 25%, black);
  }
  .lane.inaudible .region {
    filter: saturate(0.15);
    opacity: 0.45;
  }

  .section {
    background: color-mix(in oklab, var(--foreground) 8%, transparent);
    box-shadow: inset 2px 0 0 color-mix(in oklab, var(--foreground) 35%, transparent);
  }
  .section:hover {
    background: color-mix(in oklab, var(--foreground) 13%, transparent);
  }
</style>
