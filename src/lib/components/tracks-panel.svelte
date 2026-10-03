<script lang="ts">
  import BookmarkIcon from '@lucide/svelte/icons/bookmark'
  import DrumIcon from '@lucide/svelte/icons/drum'
  import EyeIcon from '@lucide/svelte/icons/eye'
  import EyeOffIcon from '@lucide/svelte/icons/eye-off'
  import GuitarIcon from '@lucide/svelte/icons/guitar'
  import ListMusicIcon from '@lucide/svelte/icons/list-music'

  import Fretboard from '#lib/components/fretboard.svelte'
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
  /** Width of the mixer column, in px. */
  const MIXER_WIDTH = 352
  const isMac = window.electron?.process.platform === 'darwin'
  const ROW = 'h-8'

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

  const barNumbers = $derived(
    Array.from({ length: score.barCount }, (_, i) => i + 1).filter((n) => n === 1 || n % 4 === 0)
  )
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
    <!-- One scroll area; the bar numbers and sections rows stick to the top/bottom and the mixer
         column sticks to the left, so only the track rows scroll. -->
    <div
      bind:this={timeline}
      class={cn('overflow-auto border-t text-sm', session.loading && 'pointer-events-none')}
      style:height="{ui.tracksHeight}px"
    >
      <div class="min-w-full" style:width="{MIXER_WIDTH + score.barCount * CELL}px">
        <div class="sticky top-0 z-20 flex h-7 border-b bg-background">
          <div
            class="sticky left-0 z-10 shrink-0 border-r bg-background"
            style:width="{MIXER_WIDTH}px"
          ></div>
          <div class="relative text-[11px] text-muted-foreground tabular-nums">
            {#each barNumbers as n (n)}
              <span class="absolute top-1.5" style:left="{(n - 1) * CELL + 4}px">{n}</span>
            {/each}
          </div>
        </div>

        {#each score.tracks as track (track.index)}
          {@const mix = session.mix[track.index]}
          {@const visible = session.visibleTracks.includes(track.index)}
          <div class={cn(ROW, 'flex border-b')}>
            <!-- Mixer -->
            <div
              class={cn(
                'sticky left-0 z-10 flex shrink-0 items-center gap-1.5 border-r bg-background pr-2',
                visible && 'bg-accent text-accent-foreground'
              )}
              style:width="{MIXER_WIDTH}px"
            >
              <span class="h-full w-1 shrink-0" style:background={track.color}></span>
              <!-- Clicking the track switches the score to it. -->
              <button
                type="button"
                class="flex h-full min-w-0 flex-1 items-center gap-1.5 text-left"
                onclick={() => session.showOnly(track.index)}
                title="Show this track"
              >
                {#if track.isPercussion}
                  <DrumIcon class="size-4 shrink-0 text-muted-foreground" />
                {:else}
                  <GuitarIcon class="size-4 shrink-0 text-muted-foreground" />
                {/if}
                <span
                  class={cn(
                    'min-w-0 flex-1 truncate',
                    visible && 'font-medium',
                    !audible(track.index) && 'text-muted-foreground'
                  )}
                >
                  <span class="text-muted-foreground tabular-nums">{track.index + 1}.</span>
                  {track.name || `Track ${track.index + 1}`}
                </span>
              </button>

              <Tooltip.Root>
                <Tooltip.Trigger
                  class={cn(
                    'flex size-7 items-center justify-center rounded-md hover:bg-muted [&_svg]:size-4',
                    visible ? 'text-foreground' : 'text-muted-foreground/60'
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
                  class="size-7 min-w-7 px-0 text-xs font-semibold data-[state=on]:bg-destructive/15 data-[state=on]:text-destructive"
                  pressed={mix.muted}
                  onPressedChange={(v) => session.setMute(track.index, v)}
                  aria-label="Mute"
                >
                  M
                </Toggle>
                <Toggle
                  size="sm"
                  class="size-7 min-w-7 px-0 text-xs font-semibold data-[state=on]:bg-amber-500/20 data-[state=on]:text-amber-600 dark:data-[state=on]:text-amber-400"
                  pressed={mix.solo}
                  onPressedChange={(v) => session.setSolo(track.index, v)}
                  aria-label="Solo"
                >
                  S
                </Toggle>
                <Slider
                  type="single"
                  class="ml-1 w-20"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(mix.volume * 100)}
                  onValueChange={(v) => session.setVolume(track.index, v / 100)}
                  aria-label="Volume"
                />
              {/if}
            </div>

            <!-- Timeline: one cell per bar, colored where the track plays -->
            <div class={cn('flex', !audible(track.index) && 'opacity-40')}>
              {#each track.activeBars as active, bar (bar)}
                <button
                  type="button"
                  class={cn(
                    'h-full shrink-0 border-r border-background hover:brightness-110',
                    bar === currentBar - 1 && 'rounded-sm ring-2 ring-foreground ring-inset'
                  )}
                  style:width="{CELL}px"
                  style:background={active ? track.color : 'var(--muted)'}
                  onclick={() => {
                    session.showOnly(track.index)
                    session.player?.seekToBar(bar)
                  }}
                  aria-label="Go to bar {bar + 1}"
                ></button>
              {/each}
            </div>
          </div>
        {/each}

        <div class="sticky bottom-0 z-20 flex h-7 border-t bg-background text-xs">
          <div
            class="sticky left-0 z-10 flex shrink-0 items-center border-r bg-background px-3 text-muted-foreground"
            style:width="{MIXER_WIDTH}px"
          >
            Sections
          </div>
          <div class="relative">
            {#each score.sections as section, i (section.bar)}
              <!-- Clipped to the space before the next section so close ones don't overlap. -->
              {@const end = score.sections[i + 1]?.bar ?? score.barCount}
              <span
                class="absolute top-1.5 flex items-center gap-1 overflow-hidden whitespace-nowrap"
                style:left="{section.bar * CELL + 2}px"
                style:max-width="{(end - section.bar) * CELL - 6}px"
                title={section.name}
              >
                <BookmarkIcon class="size-3 shrink-0 fill-current" /><span class="truncate"
                  >{section.name}</span
                >
              </span>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
</section>
