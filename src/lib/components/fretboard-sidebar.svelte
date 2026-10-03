<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check'
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right'
  import PanelBottomIcon from '@lucide/svelte/icons/panel-bottom'

  import FretLabelsToggle from '#lib/components/fret-labels-toggle.svelte'
  import { INLAY_COLORS, INLAY_SHAPES, WOODS } from '#lib/components/fretboard.svelte'
  import * as Collapsible from '#lib/components/ui/collapsible'
  import * as Sidebar from '#lib/components/ui/sidebar'
  import { Switch } from '#lib/components/ui/switch'
  import { noteName } from '#lib/midi'
  import { SCALES, degreeName, findScale, formula, type Scale } from '#lib/scales'
  import { ui } from '#lib/ui.svelte'
  import { cn } from '#lib/utils'

  const ROOTS = Array.from({ length: 12 }, (_, pc) => pc)
  const GROUPS: Scale['group'][] = ['Common', 'Modes', 'More']

  const scale = $derived(findScale(ui.scaleId))
  const scaleName = $derived(`${noteName(ui.scaleRoot)} ${scale?.name ?? ''}`)
  /** Swatch fills for the Appearance pickers, matching the fretboard's woods and inlays. */
  const WOOD_SWATCH: Record<(typeof WOODS)[number]['id'], string> = {
    ebony: 'linear-gradient(180deg, #040404, #1a191c 50%, #040404)',
    rosewood: 'linear-gradient(180deg, #1a0e09, #452c21 50%, #1a0e09)',
    maple: 'linear-gradient(180deg, #b88f58, #e8c994 50%, #b88f58)'
  }
  const INLAY_SWATCH: Record<(typeof INLAY_COLORS)[number]['id'], string> = {
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

  let appearanceOpen = $state(false)

  const fretboardVisible = $derived(ui.tracksOpen && ui.tracksView === 'fretboard')

  function showFretboard(): void {
    ui.tracksView = 'fretboard'
    ui.tracksOpen = true
  }
</script>

{#snippet heading(text: string)}
  <h3 class="mb-2 px-1 text-xs font-semibold text-muted-foreground">{text}</h3>
{/snippet}

<!-- A row of options, each a swatch (when given) and a label; the selected one is ringed. -->
{#snippet picker(
  label: string,
  options: readonly { id: string; label: string }[],
  selected: string,
  pick: (id: string) => void,
  swatch?: (id: string) => string
)}
  <div class="flex flex-col gap-1.5">
    <span class="px-1 text-[11px] font-medium text-muted-foreground">{label}</span>
    <div
      class="grid gap-1"
      style:grid-template-columns="repeat({Math.min(options.length, 4)}, minmax(0, 1fr))"
    >
      {#each options as option (option.id)}
        {@const active = option.id === selected}
        <button
          type="button"
          class={cn(
            'flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[11px] font-medium transition-colors',
            active
              ? 'bg-primary/12 text-primary ring-1 ring-primary'
              : 'bg-foreground/6 text-foreground/80 hover:bg-foreground/12'
          )}
          aria-pressed={active}
          onclick={() => pick(option.id)}
        >
          {#if swatch}
            <span
              class="h-4 w-full rounded-sm ring-1 ring-foreground/15 ring-inset"
              style:background={swatch(option.id)}
            ></span>
          {/if}
          {option.label}
        </button>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet dot(kind: 'idle' | 'playing')}
  <span
    class={cn(
      'size-3 shrink-0 rounded-full',
      kind === 'idle' && 'bg-[#94a3b8]',
      kind === 'playing' && 'bg-primary'
    )}
  ></span>
{/snippet}

<!-- Pick a scale to draw on the fretboard (bottom panel), under the notes being played, to see
     how the music lines up with it. -->
<Sidebar.Root collapsible="none" class="border-r">
  <Sidebar.Content class="gap-0">
    <div class="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
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
    </div>

    {#if !fretboardVisible}
      <button
        type="button"
        class="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-primary/12 px-3 py-2 text-left text-[13px] font-medium text-primary hover:bg-primary/18"
        onclick={showFretboard}
      >
        <PanelBottomIcon class="size-4 shrink-0" />
        Show the fretboard panel
      </button>
    {/if}

    <!-- How the fretboard looks: its wood, the inlay shape and the inlay material. -->
    <Collapsible.Root bind:open={appearanceOpen} class="px-3 pb-4">
      <Collapsible.Trigger
        class="flex w-full items-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronRightIcon
          class={cn('size-3.5 transition-transform', appearanceOpen && 'rotate-90')}
        />
        Appearance
      </Collapsible.Trigger>
      <Collapsible.Content class="flex flex-col gap-3 pt-2">
        {@render picker(
          'Fretboard',
          WOODS,
          ui.fretboardWood,
          (id) => (ui.fretboardWood = id as typeof ui.fretboardWood),
          (id) => WOOD_SWATCH[id as keyof typeof WOOD_SWATCH]
        )}
        {@render picker(
          'Strings',
          STRING_COUNTS,
          ui.fretboardStrings,
          (id) => (ui.fretboardStrings = id as typeof ui.fretboardStrings)
        )}
        {@render picker(
          'Inlays',
          INLAY_SHAPES,
          ui.inlayShape,
          (id) => (ui.inlayShape = id as typeof ui.inlayShape)
        )}
        <div class={cn(ui.inlayShape === 'none' && 'pointer-events-none opacity-50')}>
          {@render picker(
            'Inlay color',
            INLAY_COLORS,
            ui.inlayColor,
            (id) => (ui.inlayColor = id as typeof ui.inlayColor),
            (id) => INLAY_SWATCH[id as keyof typeof INLAY_SWATCH]
          )}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>

    <section class="px-3 pb-4">
      {@render heading('Show notes as')}
      <FretLabelsToggle />
      {#if ui.fretLabels === 'intervals' && !ui.scaleShown}
        <p class="mt-1.5 px-1 text-[11px] text-muted-foreground">
          Intervals are counted from the scale's root, so turn the scale on to see them.
        </p>
      {/if}
    </section>

    <div class={cn('flex flex-col gap-5 px-3 pb-6', !ui.scaleShown && 'opacity-50')}>
      <section>
        {@render heading('Root')}
        <div class="grid grid-cols-6 gap-1">
          {#each ROOTS as pc (pc)}
            <button
              type="button"
              class={cn(
                'h-8 rounded-md text-[13px] font-semibold transition-colors',
                ui.scaleRoot === pc
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-foreground/6 text-foreground/80 hover:bg-foreground/12'
              )}
              aria-pressed={ui.scaleRoot === pc}
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

      {#each GROUPS as group (group)}
        <section>
          {@render heading(group === 'More' ? 'More scales' : group)}
          <div class="flex flex-col">
            {#each SCALES.filter((s) => s.group === group) as s (s.id)}
              {@const selected = ui.scaleId === s.id}
              <button
                type="button"
                class={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent',
                  selected && 'bg-sidebar-accent'
                )}
                aria-pressed={selected}
                onclick={() => {
                  ui.scaleId = s.id
                  ui.scaleShown = true
                }}
              >
                <span class="min-w-0 flex-1">
                  <span class={cn('block truncate text-[13px]', selected && 'font-semibold')}>
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

      {#if scale}
        <section>
          {@render heading('Notes in scale')}
          <div class="flex flex-wrap gap-1">
            {#each scale.intervals as interval (interval)}
              {@const root = interval === 0}
              <span
                class={cn(
                  'flex min-w-10 flex-col items-center rounded-md px-1.5 py-1 leading-tight',
                  root ? 'bg-[#f59e0b]/18 text-[#f59e0b]' : 'bg-foreground/6'
                )}
              >
                <span class="text-[13px] font-semibold">{noteName(ui.scaleRoot + interval)}</span>
                <span class="text-[10px] text-muted-foreground">{degreeName(interval)}</span>
              </span>
            {/each}
          </div>
        </section>
      {/if}

      <section>
        {@render heading('Legend')}
        <ul class="flex flex-col gap-1.5 px-1 text-[13px] text-muted-foreground">
          <li class="flex items-center gap-2">{@render dot('idle')} Scale tone</li>
          <li class="flex items-center gap-2">{@render dot('playing')} Playing</li>
        </ul>
      </section>
    </div>
  </Sidebar.Content>
</Sidebar.Root>
