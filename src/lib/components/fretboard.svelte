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

  const INLAYS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
  /** The board runs a little past the last fret, like a real neck. */
  const LAST_FRET_AT = 98.5

  /** Distance of fret `n`'s wire from the nut, as a % of the board: frets get closer toward the body. */
  const fretX = (n: number): number =>
    ((1 - 2 ** (-n / 12)) / (1 - 2 ** (-frets / 12))) * LAST_FRET_AT
  /** Middle of the space before fret `n`, where it's pressed; open strings sit left of the nut. */
  const noteX = (n: number): string => (n === 0 ? '-1.75rem' : `${(fretX(n - 1) + fretX(n)) / 2}%`)
  /** Strings are drawn like tab: the highest string on top. */
  const stringY = (string: number): string =>
    `${((tuning.length - 1 - string + 0.5) / tuning.length) * 100}%`
  /** Low strings are thicker. */
  const gauge = (string: number): number =>
    3 - (string / Math.max(1, tuning.length - 1)) * (tuning.length <= 4 ? 1 : 2)
  /** Guitars' two highest strings are plain steel; everything else (and all bass strings) is wound. */
  const wound = (string: number): boolean => tuning.length <= 4 || string < tuning.length - 2

  const fretNumbers = $derived(Array.from({ length: frets }, (_, i) => i + 1))
  const inlaid = (n: number): boolean => INLAYS.includes(n)
  // Active notes last, so they're drawn on top.
  const ordered = $derived(
    markers
      .filter((m) => m.string < tuning.length && m.fret <= frets)
      .toSorted((a, b) => Number(!!a.active) - Number(!!b.active))
  )
</script>

<!-- A metal-style guitar neck for the given tuning: jet-black ebony, pearl sharkfin inlays, jumbo
     steel frets and real fret spacing. Fret numbers on top, open strings left of the nut, and
     markers (scale tones, played notes) on the strings. -->
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

  <div class="relative ml-14 mb-2 min-h-0 flex-1">
    <div class="board absolute inset-0 rounded-r-md" style:--strings={tuning.length}>
      <div class="grain absolute inset-0 rounded-r-md"></div>

      {#each fretNumbers as n (n)}
        {#if inlaid(n)}
          <span
            class="sharkfin absolute"
            style:left="{fretX(n - 1)}%"
            style:width="{fretX(n) - fretX(n - 1)}%"
          ></span>
        {/if}
      {/each}

      <span class="nut absolute -inset-y-px left-0"></span>
      {#each fretNumbers as n (n)}
        <span class="fret absolute inset-y-0" style:left="{fretX(n)}%"></span>
      {/each}

      {#each tuning as _, string (string)}
        <span
          class={cn('string absolute right-0 -left-3.5', wound(string) && 'wound')}
          style:top={stringY(string)}
          style:height="{gauge(string)}px"
        ></span>
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
</div>

<style>
  .fretboard {
    --ebony: #0b0b0c;
    --ebony-edge: #050505;
  }

  .board {
    container-type: size;
    background: linear-gradient(
      180deg,
      var(--ebony-edge),
      var(--ebony) 14%,
      #121213 50%,
      var(--ebony) 86%,
      var(--ebony-edge)
    );
    /* A faint sheen along both edges, and a shadow so the neck sits on the panel. */
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.08),
      inset 0 -1px 0 rgb(255 255 255 / 0.08),
      0 6px 18px rgb(0 0 0 / 0.45);
  }

  /* Tight ebony grain along the neck. */
  .grain {
    background:
      repeating-linear-gradient(
        180deg,
        transparent 0 3px,
        rgb(255 255 255 / 0.018) 3px 4px,
        transparent 4px 9px
      ),
      repeating-linear-gradient(
        177deg,
        transparent 0 13px,
        rgb(255 255 255 / 0.02) 13px 14px,
        transparent 14px 27px
      );
    pointer-events: none;
  }

  /* Pearl sharkfins: a wedge rising toward the body, filling most of the fret space. */
  .sharkfin {
    top: 9%;
    bottom: 9%;
    clip-path: polygon(12% 100%, 88% 0, 88% 100%);
    background: linear-gradient(125deg, #f5f2ea, #cdd7dc 30%, #efe6f2 55%, #b7c3c8 80%, #e8efe9);
    opacity: 0.5;
  }

  /* Black graphite nut. */
  .nut {
    width: 0.5rem;
    translate: -50% 0;
    z-index: 1;
    border-radius: 2px;
    background: linear-gradient(90deg, #1a1a1c, #3a3a3e 45%, #151517);
    box-shadow:
      inset 0 0 0 1px rgb(255 255 255 / 0.08),
      2px 0 4px rgb(0 0 0 / 0.6);
  }

  /* Jumbo stainless frets: a wide crown that catches the light. */
  .fret {
    width: 4px;
    translate: -50% 0;
    background: linear-gradient(90deg, #5d6066, #f4f6f8 45%, #b3b7bd 70%, #55585e);
    box-shadow: 1px 0 3px rgb(0 0 0 / 0.7);
  }

  .string {
    translate: 0 -50%;
    z-index: 2;
    border-radius: 9999px;
    background: linear-gradient(180deg, #f4f5f7, #a9adb3 55%, #5f636a);
    box-shadow: 0 2px 2px rgb(0 0 0 / 0.7);
  }
  /* Nickel-wound strings, the winding showing as fine diagonal ridges. */
  .string.wound {
    background:
      repeating-linear-gradient(110deg, rgb(0 0 0 / 0.3) 0 1px, transparent 1px 2.5px),
      linear-gradient(180deg, #e6e8eb, #9a9ea5 55%, #5a5e65);
  }

  /* Notes outside the scale: a dimmed label that interrupts the string line. */
  .faint {
    translate: -50% -50%;
    z-index: 3;
    padding: 0 3px;
    border-radius: 3px;
    background: var(--ebony);
    color: rgb(255 255 255 / 0.4);
    font-size: 10px;
    font-weight: 500;
    line-height: 1;
  }
  /* Open strings sit in the gutter left of the nut, off the board. */
  .faint.open {
    background: var(--sidebar);
    color: color-mix(in oklab, var(--foreground) 32%, transparent);
  }

  /* Sized to the string spacing so dots on neighbouring strings never overlap. */
  .dot {
    --size: min(1.625rem, calc(100cqh / var(--strings) - 4px));
    width: var(--size);
    height: var(--size);
    translate: -50% -50%;
    z-index: 3;
    border-radius: 9999px;
    background: radial-gradient(
      circle at 35% 30%,
      color-mix(in oklab, var(--dot) 72%, white),
      var(--dot) 60%
    );
    color: var(--dot-text);
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.35);
    box-shadow:
      0 0 0 1.5px color-mix(in oklab, var(--dot) 55%, black),
      0 2px 6px rgb(0 0 0 / 0.6),
      inset 0 1px 0 rgb(255 255 255 / 0.3);
  }
  /* Being played: bigger, ringed in white, glowing in its own color. */
  .dot.active {
    z-index: 4;
    scale: 1.18;
    box-shadow:
      0 0 0 2px var(--ebony),
      0 0 0 3.5px white,
      0 0 16px 5px color-mix(in oklab, var(--dot) 75%, transparent);
  }
</style>
