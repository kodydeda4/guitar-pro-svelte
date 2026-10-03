<script lang="ts" module>
  /** Something drawn at one string/fret position. */
  export interface FretMarker {
    /** 0 = lowest string. */
    string: number
    /** 0 = open string (drawn left of the nut). */
    fret: number
    /** Short text: a note name, interval, finger… */
    label?: string
    /**
     * `dot`: a filled circle (scale tones, played notes). `faint`: just the label, dimmed, sitting
     * on the string (notes outside the scale, for orientation).
     */
    variant?: 'dot' | 'faint'
    /** Dot fill (CSS color); defaults to the accent color. */
    color?: string
    /** Label color on the dot; defaults to white. */
    textColor?: string
    /** A note being played right now: ringed and glowing, drawn above everything else. */
    active?: boolean
  }
</script>

<script lang="ts">
  import { cn } from '#lib/utils'

  let {
    tuning,
    frets = 24,
    markers = []
  }: {
    /** Open-string MIDI notes, lowest string first. */
    tuning: number[]
    frets?: number
    markers?: FretMarker[]
  } = $props()

  const INLAYS = [3, 5, 7, 9, 15, 17, 19, 21]
  const DOUBLE_INLAYS = [12, 24]

  /** Frets are evenly spaced, like a chart (not a real neck): fret `n`'s wire is at n/frets. */
  const wireX = (n: number): string => `${(n / frets) * 100}%`
  /** Middle of the space before fret `n`, where it's pressed; open strings sit left of the nut. */
  const noteX = (n: number): string => (n === 0 ? '-1.75rem' : `${((n - 0.5) / frets) * 100}%`)
  /** Strings are drawn like tab: the highest string on top. */
  const stringY = (string: number): string =>
    `${((tuning.length - 1 - string + 0.5) / tuning.length) * 100}%`

  const fretNumbers = $derived(Array.from({ length: frets }, (_, i) => i + 1))
  const inlaid = (n: number): boolean => INLAYS.includes(n) || DOUBLE_INLAYS.includes(n)
  // Active notes last, so they're drawn on top.
  const ordered = $derived(
    markers
      .filter((m) => m.string < tuning.length && m.fret <= frets)
      .toSorted((a, b) => Number(!!a.active) - Number(!!b.active))
  )
</script>

<!-- A flat fretboard chart for the given tuning: fret numbers on top, open strings left of the
     nut, inlay dots underneath, and markers (scale tones, played notes) on the strings. -->
<div class="fretboard flex h-full min-h-0 flex-col bg-sidebar py-2 pr-5 pl-3 select-none">
  <!-- Fret numbers -->
  <div class="relative ml-14 h-5 shrink-0 text-[11px] font-medium tabular-nums">
    {#each fretNumbers as n (n)}
      <span
        class={cn(
          'absolute -translate-x-1/2',
          inlaid(n) ? 'text-muted-foreground' : 'text-muted-foreground/50'
        )}
        style:left={noteX(n)}
      >
        {n}
      </span>
    {/each}
  </div>

  <div class="relative ml-14 min-h-0 flex-1">
    <div class="board absolute inset-0 bg-background" style:--strings={tuning.length}>
      <span class="nut absolute inset-y-0 left-0"></span>
      {#each fretNumbers as n (n)}
        <span class="wire absolute inset-y-0" style:left={wireX(n)}></span>
      {/each}
      {#each tuning as _, string (string)}
        <span class="string absolute right-0 -left-3.5" style:top={stringY(string)}></span>
      {/each}

      {#each ordered as marker (`${marker.string}:${marker.fret}:${marker.active}`)}
        {#if marker.variant === 'faint'}
          <span
            class={cn('faint absolute', marker.fret === 0 && 'open')}
            style:left={noteX(marker.fret)}
            style:top={stringY(marker.string)}
          >
            {marker.label ?? ''}
          </span>
        {:else}
          <span
            class={cn('dot absolute flex items-center justify-center', marker.active && 'active')}
            style:left={noteX(marker.fret)}
            style:top={stringY(marker.string)}
            style:--dot={marker.color ?? 'var(--primary)'}
            style:--dot-text={marker.textColor ?? 'white'}
          >
            {marker.label ?? ''}
          </span>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Inlay dots, under the board like the side dots on a real neck. -->
  <div class="relative ml-14 h-4 shrink-0">
    {#each fretNumbers as n (n)}
      {#if INLAYS.includes(n)}
        <span class="inlay absolute top-1.5" style:left={noteX(n)}></span>
      {:else if DOUBLE_INLAYS.includes(n)}
        <span class="inlay absolute top-1.5 -ml-1" style:left={noteX(n)}></span>
        <span class="inlay absolute top-1.5 ml-1" style:left={noteX(n)}></span>
      {/if}
    {/each}
  </div>
</div>

<style>
  .board {
    container-type: size;
  }

  .nut {
    width: 4px;
    translate: -50% 0;
    border-radius: 2px;
    background: color-mix(in oklab, var(--foreground) 40%, transparent);
  }
  .wire {
    width: 2px;
    translate: -50% 0;
    background: color-mix(in oklab, var(--foreground) 14%, transparent);
  }
  .string {
    height: 1.5px;
    translate: 0 -50%;
    background: color-mix(in oklab, var(--foreground) 28%, transparent);
  }

  /* Notes outside the scale: a dimmed label that interrupts the string line. */
  .faint {
    translate: -50% -50%;
    padding: 0 3px;
    background: var(--background);
    color: color-mix(in oklab, var(--foreground) 32%, transparent);
    font-size: 10px;
    font-weight: 500;
    line-height: 1;
  }
  /* Open strings sit in the gutter left of the nut, off the board. */
  .faint.open {
    background: var(--sidebar);
  }

  /* Sized to the string spacing so dots on neighbouring strings never overlap. */
  .dot {
    --size: min(1.625rem, calc(100cqh / var(--strings) - 4px));
    width: var(--size);
    height: var(--size);
    translate: -50% -50%;
    border-radius: 9999px;
    background: var(--dot);
    color: var(--dot-text);
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
  }
  /* Being played: bigger, ringed in the foreground color, glowing in its own color. */
  .dot.active {
    z-index: 1;
    scale: 1.18;
    box-shadow:
      0 0 0 2px var(--background),
      0 0 0 4px var(--foreground),
      0 0 14px 4px color-mix(in oklab, var(--dot) 70%, transparent);
  }

  .inlay {
    width: 5px;
    height: 5px;
    translate: -50% 0;
    border-radius: 9999px;
    background: color-mix(in oklab, var(--foreground) 30%, transparent);
  }
</style>
