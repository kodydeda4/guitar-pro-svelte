<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check'
  import PanelBottomIcon from '@lucide/svelte/icons/panel-bottom'

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
  const fretboardVisible = $derived(ui.tracksOpen && ui.tracksView === 'fretboard')

  function showFretboard(): void {
    ui.tracksView = 'fretboard'
    ui.tracksOpen = true
  }
</script>

{#snippet heading(text: string)}
  <h3 class="mb-2 px-1 text-xs font-semibold text-muted-foreground">{text}</h3>
{/snippet}

{#snippet dot(kind: 'root' | 'tone' | 'in' | 'out')}
  <span
    class={cn(
      'size-3 shrink-0 rounded-full',
      kind === 'root' && 'bg-[#f59e0b]/30 ring-[1.5px] ring-[#f59e0b] ring-inset',
      kind === 'tone' && 'bg-[#94a3b8]/30 ring-[1.5px] ring-[#94a3b8] ring-inset',
      kind === 'in' && 'bg-primary',
      kind === 'out' && 'bg-[#ef4444]'
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
        {@render heading('Labels')}
        <div class="grid grid-cols-2 gap-1 rounded-lg bg-foreground/6 p-0.5">
          {#each [{ value: 'notes', label: 'Note names' }, { value: 'intervals', label: 'Intervals' }] as const as option (option.value)}
            <button
              type="button"
              class={cn(
                'h-7 rounded-md text-[13px] font-medium transition-colors',
                ui.fretLabels === option.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-pressed={ui.fretLabels === option.value}
              onclick={() => (ui.fretLabels = option.value)}
            >
              {option.label}
            </button>
          {/each}
        </div>
      </section>

      <section>
        {@render heading('Legend')}
        <ul class="flex flex-col gap-1.5 px-1 text-[13px] text-muted-foreground">
          <li class="flex items-center gap-2">{@render dot('root')} Root</li>
          <li class="flex items-center gap-2">{@render dot('tone')} Scale tone</li>
          <li class="flex items-center gap-2">{@render dot('in')} Playing, in the scale</li>
          <li class="flex items-center gap-2">{@render dot('out')} Playing, outside the scale</li>
        </ul>
      </section>
    </div>
  </Sidebar.Content>
</Sidebar.Root>
