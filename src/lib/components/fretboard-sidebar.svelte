<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check'
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left'
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right'
  import PanelBottomIcon from '@lucide/svelte/icons/panel-bottom'
  import { cubicOut } from 'svelte/easing'
  import { fly } from 'svelte/transition'

  import FretLabelsToggle from '#lib/components/fret-labels-toggle.svelte'
  import Fretboard, {
    INLAY_COLORS,
    INLAY_SHAPES,
    WOODS,
    type FretMarker
  } from '#lib/components/fretboard.svelte'
  import * as Sidebar from '#lib/components/ui/sidebar'
  import { Switch } from '#lib/components/ui/switch'
  import { noteName } from '#lib/midi'
  import { SCALES, degreeName, findScale, formula, type Scale } from '#lib/scales'
  import { ui } from '#lib/ui.svelte'
  import { cn } from '#lib/utils'

  const ROOTS = Array.from({ length: 12 }, (_, pc) => pc)
  const GROUPS: Scale['group'][] = ['Common', 'Modes', 'More']
  /** Sharps and flats, drawn darker like the black keys of a piano. */
  const ACCIDENTALS = new Set([1, 3, 6, 8, 10])

  /** Swatch fills, matching the fretboard's inlay materials. */
  /** The preset inlay materials; `custom` gets its own color-picker swatch. */
  const INLAY_PRESETS = INLAY_COLORS.filter((c) => c.id !== 'custom')
  const INLAY_SWATCH: Record<(typeof INLAY_PRESETS)[number]['id'], string> = {
    pearl: 'linear-gradient(125deg, #f3efe6, #c9d4da 35%, #ece2ef 60%, #b4c1c7 85%, #e6ede8)',
    abalone: 'linear-gradient(135deg, #2bb59b, #3d6fd1 40%, #7b4fc9 70%, #2aa5a0)',
    white: 'linear-gradient(180deg, #f6f4ee, #e4e0d6)',
    black: 'linear-gradient(180deg, #1b1b1d, #050505)'
  }
  const STRING_COUNTS = [
    { id: 'auto', label: 'Track' },
    { id: '6', label: '6' },
    { id: '7', label: '7' },
    { id: '8', label: '8' }
  ] as const

  let content = $state<HTMLElement | null>(null)

  /** Switches between the scale picker and Appearance (drilled into), from the top. */
  function go(to: typeof ui.fretboardPage): void {
    ui.fretboardPage = to
    content?.scrollTo({ top: 0 })
  }

  const scale = $derived(findScale(ui.scaleId))
  const scaleName = $derived(`${noteName(ui.scaleRoot)} ${scale?.name ?? ''}`)
  const fretboardVisible = $derived(ui.tracksOpen && ui.tracksView === 'fretboard')

  const appearanceSummary = $derived(
    [
      WOODS.find((w) => w.id === ui.fretboardWood)?.label,
      INLAY_SHAPES.find((s) => s.id === ui.inlayShape)?.label,
      ui.inlayShape === 'none' ? undefined : INLAY_COLORS.find((c) => c.id === ui.inlayColor)?.label
    ]
      .filter(Boolean)
      .join(' · ')
  )

  /** The previews show a guitar in standard tuning (extended for a 7- or 8-string neck). */
  const previewTuning = $derived.by(() => {
    const extra = ui.fretboardStrings === 'auto' ? 0 : Number(ui.fretboardStrings) - 6
    const lower = Array.from({ length: extra }, (_, i) => 40 - 5 * (extra - i))
    return [...lower, 40, 45, 50, 55, 59, 64]
  })

  /** The scale across the first 12 frets: the root in the accent color, the rest gray. */
  const previewMarkers = $derived.by((): FretMarker[] => {
    if (!ui.scaleShown || !scale) return []
    const tones = new Set(scale.intervals.map((i) => (ui.scaleRoot + i) % 12))
    return previewTuning.flatMap((open, string) =>
      Array.from({ length: 12 }, (_, i) => i + 1)
        .filter((fret) => tones.has((open + fret) % 12))
        .map((fret) => ({
          string,
          fret,
          color: (open + fret) % 12 === ui.scaleRoot ? undefined : '#94a3b8'
        }))
    )
  })

  function showFretboard(): void {
    ui.tracksView = 'fretboard'
    ui.tracksOpen = true
  }

  function onkeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && ui.fretboardPage === 'appearance') go('main')
  }
</script>

<svelte:window {onkeydown} />

{#snippet heading(text: string)}
  <h3 class="mb-2 px-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
    {text}
  </h3>
{/snippet}

<!-- The neck as it looks right now, in a softly lit well. -->
{#snippet preview(height: string)}
  <div class="preview relative overflow-hidden rounded-xl p-3" style:height>
    <Fretboard
      compact
      tuning={previewTuning}
      frets={12}
      markers={previewMarkers}
      wood={ui.fretboardWood}
      inlays={ui.inlayShape}
      inlayColor={ui.inlayColor}
      inlayCustom={ui.inlayCustom}
    />
  </div>
{/snippet}

<!-- A piece of the wood itself (drawn by the fretboard), with a polished highlight. -->
{#snippet woodSwatch(wood: (typeof WOODS)[number]['id'], className: string)}
  <span class={cn('swatch wood relative block shrink-0 overflow-hidden', className)}>
    <Fretboard compact woodOnly tuning={[]} frets={1} {wood} />
  </span>
{/snippet}

<!-- A segmented control. -->
{#snippet segmented(
  options: readonly { id: string; label: string }[],
  selected: string,
  pick: (id: string) => void
)}
  <div
    class="grid gap-0.5 rounded-lg bg-foreground/6 p-0.5"
    style:grid-template-columns="repeat({options.length}, minmax(0, 1fr))"
  >
    {#each options as option (option.id)}
      <button
        type="button"
        class={cn(
          'h-7 rounded-md text-[13px] font-medium transition-all',
          option.id === selected
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-pressed={option.id === selected}
        onclick={() => pick(option.id)}
      >
        {option.label}
      </button>
    {/each}
  </div>
{/snippet}

<Sidebar.Root collapsible="none" class="overflow-hidden border-r">
  <Sidebar.Content bind:ref={content} class="gap-0 overflow-x-hidden">
    {#if ui.fretboardPage === 'main'}
      <!-- Pick a scale to draw on the fretboard (bottom panel), under the notes being played. -->
      <div in:fly={{ x: -48, duration: 260, easing: cubicOut }} class="flex flex-col pb-8">
        <header class="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div class="min-w-0">
            <h2 class="text-2xl leading-tight font-bold tracking-tight">Fretboard</h2>
            <p class="truncate text-[13px] text-muted-foreground">
              {ui.scaleShown ? scaleName : 'No scale shown'}
            </p>
          </div>
          <Switch
            class="mt-2"
            checked={ui.scaleShown}
            onCheckedChange={(v) => (ui.scaleShown = v)}
            aria-label="Show scale on the fretboard"
          />
        </header>

        <!-- Live preview; clicking it opens Appearance too. -->
        <button
          type="button"
          class="mx-3 text-left"
          onclick={() => go('appearance')}
          aria-label="Change the fretboard's appearance"
        >
          {@render preview('7rem')}
        </button>

        <!-- Drill into Appearance. -->
        <div class="mx-3 mt-3 overflow-hidden rounded-xl bg-foreground/5">
          <button
            type="button"
            class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-foreground/5"
            onclick={() => go('appearance')}
          >
            {@render woodSwatch(ui.fretboardWood, 'size-8 rounded-lg')}
            <span class="min-w-0 flex-1 leading-tight">
              <span class="block text-[13px] font-semibold">Appearance</span>
              <span class="block truncate text-[11px] text-muted-foreground">
                {appearanceSummary}
              </span>
            </span>
            <ChevronRightIcon class="size-4 shrink-0 text-muted-foreground" />
          </button>
          {#if !fretboardVisible}
            <button
              type="button"
              class="flex w-full items-center gap-3 border-t border-foreground/6 px-3 py-2.5 text-left text-primary transition-colors hover:bg-foreground/5"
              onclick={showFretboard}
            >
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15"
              >
                <PanelBottomIcon class="size-4" />
              </span>
              <span class="flex-1 text-[13px] font-medium">Show the fretboard panel</span>
            </button>
          {/if}
        </div>

        <section class="mt-6 px-3">
          {@render heading('Show notes as')}
          <FretLabelsToggle />
          {#if ui.fretLabels === 'intervals' && !ui.scaleShown}
            <p class="mt-1.5 px-1 text-[11px] text-muted-foreground">
              Intervals are counted from the scale's root, so turn the scale on to see them.
            </p>
          {/if}
        </section>

        <div
          class={cn(
            'mt-6 flex flex-col gap-6 px-3 transition-opacity',
            !ui.scaleShown && 'opacity-50'
          )}
        >
          <section>
            {@render heading('Root')}
            <div class="grid grid-cols-6 gap-1">
              {#each ROOTS as pc (pc)}
                {@const selected = ui.scaleRoot === pc}
                <button
                  type="button"
                  class={cn(
                    'h-9 rounded-lg text-[13px] font-semibold transition-all',
                    selected
                      ? 'root-selected bg-primary text-primary-foreground'
                      : ACCIDENTALS.has(pc)
                        ? 'bg-foreground/4 text-foreground/60 hover:bg-foreground/10'
                        : 'bg-foreground/9 text-foreground/90 hover:bg-foreground/15'
                  )}
                  aria-pressed={selected}
                  onclick={() => {
                    ui.scaleRoot = pc
                    ui.scaleShown = true
                  }}
                >
                  {noteName(pc)}
                </button>
              {/each}
            </div>
          </section>

          {#if scale}
            <section>
              {@render heading('Notes in scale')}
              <div class="flex flex-wrap gap-1">
                {#each scale.intervals as interval (interval)}
                  {@const root = interval === 0}
                  <span
                    class={cn(
                      'flex min-w-10 flex-1 flex-col items-center rounded-lg px-1.5 py-1.5 leading-tight',
                      root ? 'bg-primary/15 text-primary' : 'bg-foreground/6'
                    )}
                  >
                    <span class="text-[13px] font-bold">{noteName(ui.scaleRoot + interval)}</span>
                    <span class={cn('text-[10px]', !root && 'text-muted-foreground')}>
                      {degreeName(interval)}
                    </span>
                  </span>
                {/each}
              </div>
            </section>
          {/if}

          {#each GROUPS as group (group)}
            <section>
              {@render heading(group === 'More' ? 'More scales' : group)}
              <div class="overflow-hidden rounded-xl bg-foreground/5">
                {#each SCALES.filter((s) => s.group === group) as s, i (s.id)}
                  {@const selected = ui.scaleId === s.id}
                  <button
                    type="button"
                    class={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-foreground/5',
                      i > 0 && 'border-t border-foreground/6'
                    )}
                    aria-pressed={selected}
                    onclick={() => {
                      ui.scaleId = s.id
                      ui.scaleShown = true
                    }}
                  >
                    <span class="min-w-0 flex-1">
                      <span
                        class={cn(
                          'block truncate text-[13px]',
                          selected ? 'font-semibold text-primary' : 'font-medium'
                        )}
                      >
                        {s.name}
                      </span>
                      <span class="block truncate text-[11px] text-muted-foreground tabular-nums">
                        {formula(s)}
                      </span>
                    </span>
                    {#if selected}<CheckIcon class="size-4 shrink-0 text-primary" />{/if}
                  </button>
                {/each}
              </div>
            </section>
          {/each}

          <section class="flex items-center gap-4 px-1 text-[11px] text-muted-foreground">
            <span class="flex items-center gap-1.5">
              <span class="size-2.5 rounded-full bg-[#94a3b8]"></span> Scale tone
            </span>
            <span class="flex items-center gap-1.5">
              <span class="size-2.5 rounded-full bg-primary"></span> Root / playing
            </span>
          </section>
        </div>
      </div>
    {:else}
      <!-- Appearance: how the neck looks. Back (or Escape) returns to the scale picker. -->
      <div in:fly={{ x: 48, duration: 260, easing: cubicOut }} class="flex flex-col pb-8">
        <header class="px-2 pt-3">
          <button
            type="button"
            class="flex items-center gap-0.5 rounded-md py-1 pr-2 text-[13px] font-medium text-primary hover:bg-primary/10"
            onclick={() => go('main')}
          >
            <ChevronLeftIcon class="size-4" /> Fretboard
          </button>
          <h2 class="px-2 pt-1 pb-3 text-2xl leading-tight font-bold tracking-tight">Appearance</h2>
        </header>

        <div class="px-3">{@render preview('8.5rem')}</div>

        <section class="mt-6 px-3">
          {@render heading('Fretboard')}
          <!-- Polished wood rounds, like a luthier's sample board. -->
          <div class="grid grid-cols-4 gap-x-1 gap-y-3">
            {#each WOODS as wood (wood.id)}
              {@const selected = ui.fretboardWood === wood.id}
              <button
                type="button"
                class="flex flex-col items-center gap-1.5 text-center text-[10.5px] leading-tight font-medium"
                aria-pressed={selected}
                onclick={() => (ui.fretboardWood = wood.id)}
              >
                {@render woodSwatch(
                  wood.id,
                  cn('size-12 rounded-full', selected && 'swatch-selected')
                )}
                <span class={selected ? 'text-primary' : 'text-muted-foreground'}>
                  {wood.label}
                </span>
              </button>
            {/each}
          </div>
        </section>

        <section class="mt-6 px-3">
          {@render heading('Strings')}
          {@render segmented(
            STRING_COUNTS,
            ui.fretboardStrings,
            (id) => (ui.fretboardStrings = id as typeof ui.fretboardStrings)
          )}
          <p class="mt-1.5 px-1 text-[11px] text-muted-foreground">
            Track follows the song. More strings add a low B, then F♯, below its lowest string.
          </p>
        </section>

        <section class="mt-6 px-3">
          {@render heading('Inlays')}
          <div class="grid grid-cols-2 gap-2">
            {#each INLAY_SHAPES as shape (shape.id)}
              {@const selected = ui.inlayShape === shape.id}
              <button
                type="button"
                class={cn(
                  'flex flex-col gap-1.5 rounded-xl p-1.5 text-[12px] font-medium transition-all',
                  selected ? 'option-selected text-primary' : 'hover:bg-foreground/5'
                )}
                aria-pressed={selected}
                onclick={() => (ui.inlayShape = shape.id)}
              >
                <span class="block h-11 w-full overflow-hidden rounded-md">
                  <Fretboard
                    compact
                    tuning={previewTuning}
                    frets={7}
                    wood={ui.fretboardWood}
                    inlays={shape.id}
                    inlayColor={ui.inlayColor}
                    inlayCustom={ui.inlayCustom}
                  />
                </span>
                {shape.label}
              </button>
            {/each}
          </div>
        </section>

        <section
          class={cn(
            'mt-6 px-3 transition-opacity',
            ui.inlayShape === 'none' && 'pointer-events-none opacity-40'
          )}
        >
          {@render heading('Inlay color')}
          <div class="flex flex-wrap justify-between gap-y-3 px-1">
            {#each INLAY_PRESETS as color (color.id)}
              {@const selected = ui.inlayColor === color.id}
              <button
                type="button"
                class="flex w-12 flex-col items-center gap-1.5 text-[11px] font-medium"
                aria-pressed={selected}
                onclick={() => (ui.inlayColor = color.id)}
              >
                <span
                  class={cn('swatch size-10 rounded-full', selected && 'swatch-selected')}
                  style:background={INLAY_SWATCH[color.id]}
                ></span>
                <span class={selected ? 'text-primary' : 'text-muted-foreground'}>
                  {color.label}
                </span>
              </button>
            {/each}
            <!-- Any color: the native color picker, behind a rainbow swatch. -->
            <label
              class="flex w-12 cursor-pointer flex-col items-center gap-1.5 text-[11px] font-medium"
            >
              <span
                class={cn(
                  'swatch custom relative size-10 rounded-full',
                  ui.inlayColor === 'custom' && 'swatch-selected'
                )}
              >
                <span
                  class="absolute inset-[5px] rounded-full ring-2 ring-sidebar"
                  style:background={ui.inlayCustom}
                ></span>
              </span>
              <span class={ui.inlayColor === 'custom' ? 'text-primary' : 'text-muted-foreground'}>
                Custom
              </span>
              <input
                type="color"
                class="sr-only"
                value={ui.inlayCustom}
                oninput={(e) => {
                  ui.inlayCustom = e.currentTarget.value
                  ui.inlayColor = 'custom'
                }}
                onclick={() => (ui.inlayColor = 'custom')}
              />
            </label>
          </div>
        </section>
      </div>
    {/if}
  </Sidebar.Content>
</Sidebar.Root>

<style>
  /* Previews sit in a softly lit well, so the neck's shadow has somewhere to fall. */
  .preview {
    background:
      radial-gradient(
        120% 90% at 50% 0%,
        color-mix(in oklab, var(--primary) 14%, transparent),
        transparent 70%
      ),
      color-mix(in oklab, var(--foreground) 5%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--foreground) 8%, transparent);
    transition: box-shadow 0.2s ease;
  }
  button:hover > .preview {
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--primary) 45%, transparent);
  }

  .root-selected {
    box-shadow: 0 4px 14px color-mix(in oklab, var(--primary) 45%, transparent);
  }

  .option-selected {
    background: color-mix(in oklab, var(--primary) 12%, transparent);
    box-shadow: inset 0 0 0 1.5px var(--primary);
  }

  .swatch {
    box-shadow:
      inset 0 0 0 1px rgb(255 255 255 / 0.12),
      0 2px 6px rgb(0 0 0 / 0.35);
    transition: box-shadow 0.15s ease;
  }
  .swatch-selected {
    box-shadow:
      0 0 0 2px var(--sidebar),
      0 0 0 4px var(--primary),
      0 2px 6px rgb(0 0 0 / 0.35);
  }
  /* A polished dome: a soft highlight across the top of the wood. */
  .swatch.wood::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      70% 45% at 50% 22%,
      rgb(255 255 255 / 0.32),
      rgb(255 255 255 / 0.06) 70%,
      transparent
    );
    box-shadow: inset 0 -6px 12px rgb(0 0 0 / 0.35);
    pointer-events: none;
  }
  .swatch.custom {
    background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red);
  }
</style>
