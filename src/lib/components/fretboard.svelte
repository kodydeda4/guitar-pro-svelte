<script lang="ts" module>
  /** A dot drawn on the neck, e.g. one note of a scale. */
  export interface FretMarker {
    /** 0 = lowest string. */
    string: number
    /** 0 = open string. */
    fret: number
    /** Short text inside the dot (a note name, interval, finger…). */
    label?: string
    /** CSS color; defaults to the accent color. */
    color?: string
  }
</script>

<script lang="ts">
  import { noteName } from '#lib/midi'
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
  /** The board runs a little past the last fret, like a real neck. */
  const LAST_FRET_AT = 98.5

  /** Distance of a fret from the nut, as a % of the board: frets get closer toward the body. */
  const fretX = (n: number): number =>
    ((1 - 2 ** (-n / 12)) / (1 - 2 ** (-frets / 12))) * LAST_FRET_AT
  /** Middle of the space before fret `n` (where you'd press it); open strings sit left of the nut. */
  const noteX = (n: number): string => (n === 0 ? '-1.125rem' : `${(fretX(n - 1) + fretX(n)) / 2}%`)
  /** Strings are drawn like tab: the highest string on top. */
  const stringY = (string: number): number =>
    ((tuning.length - 1 - string + 0.5) / tuning.length) * 100
  /** Low strings are thicker. */
  const gauge = (string: number): number =>
    3 - (string / Math.max(1, tuning.length - 1)) * (tuning.length <= 4 ? 1 : 2)
  /** Guitars' two highest strings are plain steel; everything else (and all bass strings) is wound. */
  const wound = (string: number): boolean => tuning.length <= 4 || string < tuning.length - 2

  const fretNumbers = $derived(Array.from({ length: frets }, (_, i) => i + 1))
  const inlaid = (n: number): boolean => INLAYS.includes(n) || DOUBLE_INLAYS.includes(n)
</script>

<!-- A guitar neck for the given tuning: ebony/rosewood in dark mode, maple in light, with real
     fret spacing. Markers (scale notes etc.) are drawn on top. -->
<div class="fretboard flex h-full min-h-0 flex-col gap-1.5 py-4 pr-5 pl-3 select-none">
  <div class="flex min-h-0 flex-1">
    <!-- String names, then room for open-string markers left of the nut. -->
    <div class="relative w-14 shrink-0">
      {#each tuning as note, string (string)}
        <span
          class="absolute left-0 flex h-5 w-7 -translate-y-1/2 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground"
          style:top="{stringY(string)}%"
        >
          {noteName(note)}
        </span>
      {/each}
    </div>

    <div class="board relative flex-1 rounded-r-md" style:--strings={tuning.length}>
      <div class="grain absolute inset-0 rounded-r-md"></div>

      {#each INLAYS as n (n)}
        {#if n <= frets}
          <span class="inlay absolute top-1/2" style:left={noteX(n)}></span>
        {/if}
      {/each}
      {#each DOUBLE_INLAYS as n (n)}
        {#if n <= frets}
          <span class="inlay absolute top-1/4" style:left={noteX(n)}></span>
          <span class="inlay absolute top-3/4" style:left={noteX(n)}></span>
        {/if}
      {/each}

      <span class="nut absolute -inset-y-px left-0"></span>
      {#each fretNumbers as n (n)}
        <span class="fret absolute inset-y-0" style:left="{fretX(n)}%"></span>
      {/each}

      {#each tuning as _, string (string)}
        <span
          class={cn('string absolute right-0 -left-2', wound(string) && 'wound')}
          style:top="{stringY(string)}%"
          style:height="{gauge(string)}px"
        ></span>
      {/each}

      {#each markers as marker, i (i)}
        {#if marker.string < tuning.length && marker.fret <= frets}
          <span
            class="marker absolute flex items-center justify-center rounded-full text-[10px] font-bold text-white"
            style:left={noteX(marker.fret)}
            style:top="{stringY(marker.string)}%"
            style:--marker={marker.color ?? 'var(--accent-color)'}
          >
            {marker.label ?? ''}
          </span>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Fret numbers; the inlaid frets stand out, like the side dots on a real neck. -->
  <div class="relative ml-14 h-4 shrink-0 text-[11px] tabular-nums">
    {#each fretNumbers as n (n)}
      <span
        class={cn(
          'absolute -translate-x-1/2',
          inlaid(n) ? 'font-semibold text-foreground/80' : 'text-muted-foreground/60'
        )}
        style:left={noteX(n)}
      >
        {n}
      </span>
    {/each}
  </div>
</div>

<style>
  /* Maple in light mode… */
  .fretboard {
    --wood: #e2bf8a;
    --wood-dark: #cfa56b;
    --grain: rgb(120 70 20 / 0.1);
    --binding: #f7f1e3;
    --string-shadow: rgb(70 40 10 / 0.35);
    --inlay: radial-gradient(circle at 35% 30%, #4a4a4a, #161616 70%);
  }
  /* …ebony/rosewood in dark mode. */
  :global(.dark) .fretboard {
    --wood: #2e211a;
    --wood-dark: #1c140f;
    --grain: rgb(255 220 180 / 0.035);
    --binding: #d9cdb4;
    --string-shadow: rgb(0 0 0 / 0.6);
    --inlay: radial-gradient(circle at 35% 30%, #fffdf6, #e9e3d3 35%, #b8c6c9 70%, #a2a9b8);
  }

  .board {
    container-type: size;
    background: linear-gradient(
      180deg,
      var(--wood-dark),
      var(--wood) 18%,
      var(--wood) 82%,
      var(--wood-dark)
    );
    /* Binding along both edges, and a soft shadow so the neck sits on the panel. */
    box-shadow:
      inset 0 2px 0 var(--binding),
      inset 0 -2px 0 var(--binding),
      0 4px 14px rgb(0 0 0 / 0.25);
  }

  /* Wood grain runs along the neck. */
  .grain {
    background:
      repeating-linear-gradient(
        180deg,
        transparent 0 3px,
        var(--grain) 3px 4px,
        transparent 4px 9px
      ),
      repeating-linear-gradient(
        176deg,
        transparent 0 11px,
        var(--grain) 11px 12px,
        transparent 12px 23px
      );
    pointer-events: none;
  }

  .inlay {
    width: 0.8rem;
    height: 0.8rem;
    translate: -50% -50%;
    border-radius: 9999px;
    background: var(--inlay);
    box-shadow: 0 0 0 1px rgb(0 0 0 / 0.15);
    opacity: 0.9;
  }

  /* Bone nut. */
  .nut {
    width: 0.5rem;
    translate: -50% 0;
    border-radius: 2px;
    background: linear-gradient(90deg, #cfc3a6, #f6f0e0 45%, #ddd2b8);
    box-shadow: 2px 0 4px rgb(0 0 0 / 0.35);
    z-index: 1;
  }

  /* Nickel frets: a rounded crown that catches the light. */
  .fret {
    width: 3px;
    translate: -50% 0;
    background: linear-gradient(90deg, #7d7f84, #f2f3f5 45%, #a4a7ad 70%, #6c6e73);
    box-shadow: 1px 0 2px rgb(0 0 0 / 0.4);
  }

  .string {
    translate: 0 -50%;
    z-index: 2;
    border-radius: 9999px;
    background: linear-gradient(180deg, #f4f5f7, #a9adb3 55%, #6f737a);
    box-shadow: 0 2px 2px var(--string-shadow);
  }
  /* Wound strings: warmer, with the winding showing as fine diagonal ridges. */
  .string.wound {
    background:
      repeating-linear-gradient(110deg, rgb(0 0 0 / 0.22) 0 1px, transparent 1px 2.5px),
      linear-gradient(180deg, #f1e3c4, #b9a37a 55%, #7a6646);
  }

  /* Sized to the string spacing so markers on neighbouring strings never overlap. */
  .marker {
    --size: min(1.5rem, calc(100cqh / var(--strings) - 3px));
    width: var(--size);
    height: var(--size);
    translate: -50% -50%;
    z-index: 3;
    background: radial-gradient(
      circle at 35% 30%,
      color-mix(in oklab, var(--marker) 70%, white),
      var(--marker) 60%
    );
    box-shadow:
      0 0 0 2px color-mix(in oklab, var(--marker) 55%, black),
      0 2px 6px rgb(0 0 0 / 0.45),
      inset 0 1px 0 rgb(255 255 255 / 0.35);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.35);
  }
</style>
