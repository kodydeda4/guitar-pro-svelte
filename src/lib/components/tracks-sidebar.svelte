<script lang="ts">
  import DrumIcon from '@lucide/svelte/icons/drum'
  import EyeIcon from '@lucide/svelte/icons/eye'
  import GuitarIcon from '@lucide/svelte/icons/guitar'
  import KeyboardMusicIcon from '@lucide/svelte/icons/keyboard-music'
  import MicVocalIcon from '@lucide/svelte/icons/mic-vocal'
  import MusicIcon from '@lucide/svelte/icons/music'
  import PianoIcon from '@lucide/svelte/icons/piano'
  import type { Component } from 'svelte'

  import PanKnob from '#lib/components/pan-knob.svelte'
  import * as Sidebar from '#lib/components/ui/sidebar'
  import { Slider } from '#lib/components/ui/slider'
  import { GM_INSTRUMENTS } from '#lib/midi'
  import type { TrackInfo } from '#lib/render/types'
  import { session } from '#lib/session.svelte'
  import { cn } from '#lib/utils'

  const score = $derived(session.score)

  const anySolo = $derived(session.mix.some((m) => m.solo))
  const audible = (index: number): boolean => {
    const mix = session.mix[index]
    return !!mix && (anySolo ? mix.solo : !mix.muted)
  }

  /**
   * Guitar Pro names tracks like "Tom Keifer | Lead Vocals": show the part, with the musician
   * after it. Other names get the instrument instead.
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
</script>

<!-- The open song's tracks, GarageBand-style, in the left sidebar (switch with Library in the
     rail): pick which tracks the score draws, and mix them. -->
<Sidebar.Root collapsible="none" class="border-r">
  <Sidebar.Content class="gap-0">
    <div class="px-4 pt-4 pb-3">
      <h2 class="text-2xl leading-tight font-bold tracking-tight">Tracks</h2>
      <p class="text-[13px] text-muted-foreground tabular-nums">
        {#if score}
          {score.tracks.length}
          {score.tracks.length === 1 ? 'track' : 'tracks'} · {session.visibleTracks.length} shown in the
          score
        {:else}
          No song open
        {/if}
      </p>
    </div>

    {#if score}
      <div class={cn('border-t', session.loading && 'pointer-events-none opacity-60')}>
        {#each score.tracks as track (track.index)}
          {@const mix = session.mix[track.index]}
          {@const visible = session.visibleTracks.includes(track.index)}
          {@const selected = track.index === session.selectedTrack}
          {@const Icon = instrumentIcon(track)}
          {@const label = trackLabel(track)}
          <!-- Number strip in the track color, instrument icon, name, then M|S, show-in-score
               and volume underneath, and a pan knob. -->
          <div class={cn('flex h-16 border-b border-border/50', selected && 'track-selected')}>
            <button
              type="button"
              class="track-number flex w-7 shrink-0 items-center justify-center text-[13px] font-semibold text-white tabular-nums"
              style:--track={track.color}
              onclick={() => session.showOnly(track.index)}
              aria-label="Show {label.title} in the score"
            >
              {track.index + 1}
            </button>

            <div
              class={cn(
                'flex min-w-0 flex-1 items-center gap-3 pr-2.5 pl-3',
                !audible(track.index) && 'opacity-55'
              )}
            >
              <button
                type="button"
                class="shrink-0"
                style:color={track.color}
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
        {/each}
      </div>
    {:else}
      <p class="px-4 py-2 text-sm text-muted-foreground">
        Pick a song from the library to see its tracks.
      </p>
    {/if}
  </Sidebar.Content>
</Sidebar.Root>

<style>
  .track-selected {
    background: color-mix(in oklab, var(--primary) 16%, var(--sidebar));
  }
  .track-number {
    background: linear-gradient(180deg, color-mix(in oklab, var(--track) 80%, white), var(--track));
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.3);
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
</style>
