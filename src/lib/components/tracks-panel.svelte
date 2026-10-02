<script lang="ts">
  import BookmarkIcon from '@lucide/svelte/icons/bookmark'
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down'
  import DrumIcon from '@lucide/svelte/icons/drum'
  import EyeIcon from '@lucide/svelte/icons/eye'
  import EyeOffIcon from '@lucide/svelte/icons/eye-off'
  import GuitarIcon from '@lucide/svelte/icons/guitar'

  import * as Kbd from '#lib/components/ui/kbd'
  import { Slider } from '#lib/components/ui/slider'
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
  <button
    type="button"
    class="flex h-9 w-full items-center gap-2 px-3 text-sm font-medium hover:bg-muted/50"
    onclick={() => (ui.tracksOpen = !ui.tracksOpen)}
    aria-expanded={ui.tracksOpen}
  >
    <ChevronDownIcon
      class={cn(
        'size-4 text-muted-foreground transition-transform',
        !ui.tracksOpen && '-rotate-90'
      )}
    />
    Tracks
    <span class="text-xs font-normal text-muted-foreground">{score.tracks.length}</span>
    <Kbd.Root class="ml-auto">{isMac ? '⌘⇧Y' : 'Ctrl+Shift+Y'}</Kbd.Root>
  </button>

  {#if ui.tracksOpen}
    <!-- One scroll area; the bar numbers and sections rows stick to the top/bottom and the mixer
         column sticks to the left, so only the track rows scroll. -->
    <div
      bind:this={timeline}
      class="overflow-auto border-t text-sm"
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
            {#each score.sections as section (section.bar)}
              <span
                class="absolute top-1.5 flex items-center gap-1 whitespace-nowrap"
                style:left="{section.bar * CELL + 2}px"
              >
                <BookmarkIcon class="size-3 fill-current" />{section.name}
              </span>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}
</section>
