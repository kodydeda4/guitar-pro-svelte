<script lang="ts">
  import BookmarkIcon from '@lucide/svelte/icons/bookmark'
  import DrumIcon from '@lucide/svelte/icons/drum'
  import GuitarIcon from '@lucide/svelte/icons/guitar'
  import Volume2Icon from '@lucide/svelte/icons/volume-2'

  import * as Tabs from '#lib/components/ui/tabs'
  import { Slider } from '#lib/components/ui/slider'
  import { Toggle } from '#lib/components/ui/toggle'
  import * as Tooltip from '#lib/components/ui/tooltip'
  import { GM_INSTRUMENTS } from '#lib/midi'
  import type { Notation, ScoreInfo } from '#lib/render/types'
  import { session } from '#lib/session.svelte'
  import { ui } from '#lib/ui.svelte'
  import { cn } from '#lib/utils'

  let { score }: { score: ScoreInfo } = $props()

  const track = $derived(score.tracks[session.selectedTrack] ?? score.tracks[0])
  const notation = $derived(session.notation[track.index])
  const mix = $derived(session.mix[track.index])

  const songFields = $derived([
    { label: 'Title', value: score.title },
    { label: 'Subtitle', value: score.subtitle },
    { label: 'Artist', value: score.artist },
    { label: 'Album', value: score.album },
    { label: 'Words', value: score.words },
    { label: 'Music', value: score.music },
    { label: 'Tab by', value: score.tab },
    { label: 'Copyright', value: score.copyright }
  ])

  const notationKinds: { kind: keyof Notation; label: string; glyph: string }[] = [
    { kind: 'standard', label: 'Standard notation', glyph: '𝅘𝅥' },
    { kind: 'tablature', label: 'Tablature', glyph: 'TAB' },
    { kind: 'slash', label: 'Slash notation', glyph: '/' },
    { kind: 'numbered', label: 'Numbered notation', glyph: '1̇' }
  ]
  const shownCount = $derived(notation ? Object.values(notation).filter(Boolean).length : 0)

  const instrument = $derived(
    track.isPercussion ? 'Drum Kit' : (GM_INSTRUMENTS[track.program] ?? `Program ${track.program}`)
  )
</script>

{#snippet heading(text: string)}
  <h3 class="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">{text}</h3>
{/snippet}

{#snippet field(label: string, value: string)}
  <div class="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-2 py-1 text-sm">
    <span class="text-muted-foreground">{label}</span>
    <span class={cn('truncate', !value && 'text-muted-foreground/50')} title={value}>
      {value || '—'}
    </span>
  </div>
{/snippet}

<!-- Guitar Pro-style inspector: details of the open song and of the selected track. -->
<aside class="flex w-72 shrink-0 flex-col border-l bg-sidebar text-sidebar-foreground">
  <Tabs.Root bind:value={ui.inspectorTab} class="min-h-0 flex-1 gap-0">
    <div class="border-b p-3">
      <Tabs.List class="w-full">
        <Tabs.Trigger value="song">Song</Tabs.Trigger>
        <Tabs.Trigger value="track">Track</Tabs.Trigger>
      </Tabs.List>
    </div>

    <Tabs.Content value="song" class="min-h-0 overflow-y-auto">
      <section class="border-b p-4">
        {@render heading('Information')}
        {#each songFields as f (f.label)}
          {@render field(f.label, f.value)}
        {/each}
      </section>

      <section class="border-b p-4">
        {@render heading('Score')}
        {@render field('Tempo', `♩ = ${score.tempo}`)}
        {@render field('Bars', String(score.barCount))}
        {@render field('Tracks', String(score.tracks.length))}
      </section>

      {#if score.sections.length > 0}
        <section class="p-4">
          {@render heading('Sections')}
          <div class="-mx-2 flex flex-col">
            {#each score.sections as section (section.bar)}
              <button
                type="button"
                class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-sidebar-accent"
                onclick={() => session.player?.seekToBar(section.bar)}
              >
                <BookmarkIcon class="size-3.5 shrink-0 fill-current text-muted-foreground" />
                <span class="min-w-0 flex-1 truncate">{section.name}</span>
                <span class="text-xs text-muted-foreground tabular-nums">{section.bar + 1}</span>
              </button>
            {/each}
          </div>
        </section>
      {/if}
    </Tabs.Content>

    <Tabs.Content value="track" class="min-h-0 overflow-y-auto">
      <section class="border-b p-4">
        {@render heading('Information')}
        <div class="flex items-center gap-2">
          <span class="size-8 shrink-0 rounded-md" style:background={track.color}></span>
          <div class="min-w-0 flex-1 leading-tight">
            <div class="truncate text-sm font-semibold">
              {track.name || `Track ${track.index + 1}`}
            </div>
            <div class="truncate text-xs text-muted-foreground">
              Track {track.index + 1}{track.shortName ? ` · ${track.shortName}` : ''}
            </div>
          </div>
        </div>
      </section>

      {#if notation}
        <section class="border-b p-4">
          {@render heading('Musical notation')}
          <div class="flex gap-1">
            {#each notationKinds as n (n.kind)}
              {@const on = notation[n.kind]}
              {@const unavailable = n.kind === 'tablature' && !track.isStringed}
              <Tooltip.Root>
                <Tooltip.Trigger>
                  {#snippet child({ props })}
                    <!-- The last notation shown can't be turned off, so it's disabled. -->
                    <Toggle
                      {...props}
                      variant="outline"
                      size="sm"
                      class="h-8 flex-1 font-semibold data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      pressed={on}
                      disabled={unavailable || (on && shownCount === 1)}
                      onPressedChange={(v) => session.setNotation(track.index, n.kind, v)}
                      aria-label={n.label}
                    >
                      <span class={n.kind === 'tablature' ? 'text-[10px]' : 'text-base'}>
                        {n.glyph}
                      </span>
                    </Toggle>
                  {/snippet}
                </Tooltip.Trigger>
                <Tooltip.Content>
                  {unavailable ? `${n.label} (needs a stringed instrument)` : n.label}
                </Tooltip.Content>
              </Tooltip.Root>
            {/each}
          </div>

          {#if track.tuning.length > 0}
            <div class="mt-4 flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Tuning</span>
              {#if track.tuningName}
                <span class="text-xs text-muted-foreground">{track.tuningName}</span>
              {/if}
            </div>
            <div class="mt-1.5 flex gap-1">
              {#each track.tuning as note, i (i)}
                <span
                  class="flex h-8 flex-1 items-center justify-center rounded-md bg-secondary text-sm font-semibold"
                >
                  {note}
                </span>
              {/each}
            </div>
          {/if}
          {#if track.capo > 0}
            {@render field('Capo', `Fret ${track.capo}`)}
          {/if}
        </section>
      {/if}

      <section class="p-4">
        {@render heading('Sound')}
        <div class="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm">
          {#if track.isPercussion}
            <DrumIcon class="size-4 shrink-0 text-muted-foreground" />
          {:else}
            <GuitarIcon class="size-4 shrink-0 text-muted-foreground" />
          {/if}
          <span class="min-w-0 flex-1 truncate font-medium">{instrument}</span>
        </div>

        {#if mix}
          <div class="mt-3 flex items-center gap-1.5">
            <Toggle
              size="sm"
              class="size-8 min-w-8 px-0 text-xs font-semibold data-[state=on]:bg-destructive/15 data-[state=on]:text-destructive"
              pressed={mix.muted}
              onPressedChange={(v) => session.setMute(track.index, v)}
              aria-label="Mute"
            >
              M
            </Toggle>
            <Toggle
              size="sm"
              class="size-8 min-w-8 px-0 text-xs font-semibold data-[state=on]:bg-amber-500/20 data-[state=on]:text-amber-600 dark:data-[state=on]:text-amber-400"
              pressed={mix.solo}
              onPressedChange={(v) => session.setSolo(track.index, v)}
              aria-label="Solo"
            >
              S
            </Toggle>
            <Volume2Icon class="ml-1 size-4 shrink-0 text-muted-foreground" />
            <Slider
              type="single"
              class="flex-1"
              min={0}
              max={100}
              step={1}
              value={Math.round(mix.volume * 100)}
              onValueChange={(v) => session.setVolume(track.index, v / 100)}
              aria-label="Volume"
            />
          </div>
        {/if}
      </section>
    </Tabs.Content>
  </Tabs.Root>
</aside>
