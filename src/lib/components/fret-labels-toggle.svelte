<script lang="ts">
  import { ui } from '#lib/ui.svelte'
  import { cn } from '#lib/utils'

  let { class: className }: { class?: string } = $props()

  const options = [
    { value: 'notes', label: 'Note names' },
    { value: 'intervals', label: 'Intervals' }
  ] as const
</script>

<!-- How fretboard dots are labeled: note names (A, C, D…) or intervals from the scale's root
     (1, ♭3, 4…). Used in the Fretboard sidebar and in Settings. -->
<div
  class={cn('grid grid-cols-2 gap-1 rounded-lg bg-foreground/6 p-0.5', className)}
  role="radiogroup"
  aria-label="Fretboard labels"
>
  {#each options as option (option.value)}
    <button
      type="button"
      role="radio"
      aria-checked={ui.fretLabels === option.value}
      class={cn(
        'h-7 rounded-md px-3 text-[13px] font-medium transition-colors',
        ui.fretLabels === option.value
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
      onclick={() => (ui.fretLabels = option.value)}
    >
      {option.label}
    </button>
  {/each}
</div>
