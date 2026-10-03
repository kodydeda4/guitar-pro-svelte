<script lang="ts">
  import BookmarkIcon from '@lucide/svelte/icons/bookmark'
  import DrumIcon from '@lucide/svelte/icons/drum'
  import EyeIcon from '@lucide/svelte/icons/eye'
  import EyeOffIcon from '@lucide/svelte/icons/eye-off'
  import GuitarIcon from '@lucide/svelte/icons/guitar'
  import ListMusicIcon from '@lucide/svelte/icons/list-music'

  import Fretboard from '#lib/components/fretboard.svelte'
  import PanKnob from '#lib/components/pan-knob.svelte'
  import * as Kbd from '#lib/components/ui/kbd'
  import { noteName } from '#lib/midi'
  import { Slider } from '#lib/components/ui/slider'
  import * as Tabs from '#lib/components/ui/tabs'
  import { Toggle } from '#lib/components/ui/toggle'
  import * as Tooltip from '#lib/components/ui/tooltip'
  import type { ScoreInfo } from '#lib/render/types'
  import { session } from '#lib/session.svelte'
  import { ui } from '#lib/ui.svelte'
  import { cn } from '#lib/utils'

  let { score }: { score: ScoreInfo } = $props()

  /** Width of one bar in the timeline, in px. */
  const CELL = 20
  /** Width of the track headers column, in px. */
  const MIXER_WIDTH = 344
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

  function startResize(event: PointerEvent): void {
    event.preventDefault()
    const handle = event.currentTarget as HTMLElement
    handle.setPointerCapture(event.pointerId)
    const startY = event.clientY
    const startHeight = ui.tracksHeight
    // Never let the panel take more than ~70% of the window, so the score stays visible.
    const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight * 0.7)
    const onMove = (e: PointerEvent): void => {
      const next = startHeight + (startY - e.clientY)
      ui.tracksHeight = Math.round(Math.min(maxHeight, Math.max(MIN_HEIGHT, next)))
    }
    const onUp = (): void => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
  }

  const anySolo = $derived(session.mix.some((m) => m.solo))
  const audible = (index: number): boolean => {
    const mix = session.mix[index]
    return !!mix && (anySolo ? mix.solo : !mix.muted)
  }
  /** The fretboard shows the selected track (the first one drawn in the score). */
  const fretboardTrack = $derived(score.tracks[session.selectedTrack])

  const timelineWidth = $derived(score.barCount * CELL)
  /** Bar numbers at the start of each 4-bar group: 1, 5, 9… */
  const barNumbers = $derived(
    Array.from({ length: score.barCount }, (_, i) => i + 1).filter((n) => (n - 1) % 4 === 0)
  )
  /** The playhead sits at the start of the bar being played. */
  const playheadX = $derived((currentBar - 1) * CELL)

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
    const bar = Math.min(
      score.barCount - 1,
      Math.max(0, Math.floor((event.clientX - rect.left) / CELL))
    )
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
  <!-- Header: collapse toggle, the Tracks | Fretboard picker (picking a view also expands the
       panel), then details for the current view. -->
  <div class="flex h-10 items-center gap-3 px-3 text-sm">
    <Tabs.Root
      value={ui.tracksView}
      onValueChange={(view) => (ui.tracksView = view as typeof ui.tracksView)}
    >
      <Tabs.List variant="line" class="h-10 gap-5 p-0">
        <Tabs.Trigger
          value="tracks"
          class="flex-none gap-1.5 px-0"
          onclick={() => (ui.tracksOpen = true)}
        >
          <ListMusicIcon />
          Tracks
          <span
            class="rounded-full bg-muted px-1.5 text-[11px] leading-4 font-medium text-muted-foreground tabular-nums"
          >
            {score.tracks.length}
          </span>
        </Tabs.Trigger>
        <Tabs.Trigger
          value="fretboard"
          class="flex-none gap-1.5 px-0"
          onclick={() => (ui.tracksOpen = true)}
        >
          <GuitarIcon />
          Fretboard
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>

    <!-- Details for the current view. -->
    <div class="ml-auto flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
      {#if ui.tracksView === 'tracks'}
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
      {#if fretboardTrack && fretboardTrack.tuning.length > 0}
        <Fretboard tuning={fretboardTrack.tuning} />
      {:else}
        <div class="flex h-full items-center justify-center text-sm text-muted-foreground">
          Select a stringed track to see its fretboard.
        </div>
      {/if}
    </div>
  {:else if ui.tracksOpen}
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
          <div class="group/row flex h-10 border-b border-border/50">
            <!-- Track header -->
            <div
              class={cn(
                'sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r bg-sidebar pr-2 pl-2',
                selected && 'track-selected'
              )}
              style:width="{MIXER_WIDTH}px"
            >
              <button
                type="button"
                class="flex h-full min-w-0 flex-1 items-center gap-2.5 text-left"
                onclick={() => session.showOnly(track.index)}
                title="Show this track"
              >
                <span
                  class="track-tile flex size-7 shrink-0 items-center justify-center rounded-md text-white"
                  style:--track={track.color}
                >
                  {#if track.isPercussion}
                    <DrumIcon class="size-4" />
                  {:else}
                    <GuitarIcon class="size-4" />
                  {/if}
                </span>
                <span
                  class={cn(
                    'min-w-0 flex-1 truncate text-[13px]',
                    visible ? 'font-semibold' : 'font-medium',
                    !audible(track.index) && 'text-muted-foreground'
                  )}
                >
                  {track.name || `Track ${track.index + 1}`}
                </span>
              </button>

              <Tooltip.Root>
                <Tooltip.Trigger
                  class={cn(
                    'flex size-6 items-center justify-center rounded-md hover:bg-foreground/10 [&_svg]:size-3.5',
                    visible
                      ? 'text-foreground'
                      : 'text-muted-foreground/70 opacity-0 group-hover/row:opacity-100'
                  )}
                  onclick={() => session.toggleVisible(track.index)}
                  aria-label={visible ? 'Hide in score' : 'Show in score'}
                >
                  {#if visible}<EyeIcon />{:else}<EyeOffIcon />{/if}
                </Tooltip.Trigger>
                <Tooltip.Content>{visible ? 'Hide in score' : 'Show in score'}</Tooltip.Content>
              </Tooltip.Root>

              {#if mix}
                <Toggle
                  size="sm"
                  class="track-button h-5 min-w-6 rounded-[5px] px-0 text-[10px] font-bold data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  pressed={mix.muted}
                  onPressedChange={(v) => session.setMute(track.index, v)}
                  aria-label="Mute"
                >
                  M
                </Toggle>
                <Toggle
                  size="sm"
                  class="track-button h-5 min-w-6 rounded-[5px] px-0 text-[10px] font-bold data-[state=on]:border-transparent data-[state=on]:bg-amber-400 data-[state=on]:text-black"
                  pressed={mix.solo}
                  onPressedChange={(v) => session.setSolo(track.index, v)}
                  aria-label="Solo"
                >
                  S
                </Toggle>
                <PanKnob
                  value={mix.pan}
                  onchange={(v) => session.setPan(track.index, v)}
                  label="Pan"
                />
                <Slider
                  type="single"
                  class="track-volume w-16"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(mix.volume * 100)}
                  onValueChange={(v) => session.setVolume(track.index, v / 100)}
                  aria-label="Volume"
                />
              {/if}
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
                    {region.length * CELL > 56 ? track.name || `Track ${track.index + 1}` : ''}
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
  .track-tile {
    background: linear-gradient(180deg, color-mix(in oklab, var(--track) 85%, white), var(--track));
    box-shadow:
      inset 0 0 0 1px rgb(0 0 0 / 0.12),
      0 1px 2px rgb(0 0 0 / 0.25);
  }
  /* M / S: small bordered keys, like Logic's track header buttons. */
  :global(.track-button) {
    border: 1px solid color-mix(in oklab, var(--foreground) 18%, transparent);
    color: var(--muted-foreground);
  }
  /* A slimmer volume slider than the default. */
  :global(.track-volume [data-slot='slider-thumb']) {
    width: 0.75rem;
    height: 0.75rem;
    border-color: transparent;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
  }
  :global(.track-volume [data-slot='slider-range']) {
    background: color-mix(in oklab, var(--foreground) 55%, transparent);
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
