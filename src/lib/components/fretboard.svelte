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

  <div class="relative ml-14 mb-4 min-h-0 flex-1">
    <div class="board absolute inset-0 rounded-r-sm" style:--strings={tuning.length}>
      <div class="grain absolute inset-0 rounded-r-sm"></div>

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
    --ebony: #0d0c0c;
    --ebony-edge: #040404;
    --binding: rgb(233 227 211 / 0.15);
  }

  /* The board is radiused: lit along the middle, falling off into shadow toward both edges. */
  .board {
    container-type: size;
    background: linear-gradient(
      180deg,
      var(--ebony-edge),
      var(--ebony) 12%,
      #18171a 42%,
      #1a191c 50%,
      #151416 60%,
      var(--ebony) 88%,
      var(--ebony-edge)
    );
    /* Cream binding on both edges (with the board's dark lip just inside it), and a deep drop
       shadow: a tight contact shadow plus a wide, soft one so the neck floats off the panel. */
    box-shadow:
      inset 0 2px 0 var(--binding),
      inset 0 3px 0 rgb(0 0 0 / 0.7),
      inset 0 -2px 0 var(--binding),
      inset 0 -3px 0 rgb(0 0 0 / 0.7),
      0 2px 3px rgb(0 0 0 / 0.7),
      0 10px 18px rgb(0 0 0 / 0.6),
      0 24px 48px rgb(0 0 0 / 0.55);
  }

  /* Ebony grain: long streaks and pores running along the neck. */
  .grain {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.0025 0.42' numOctaves='4' seed='11'/%3E%3CfeColorMatrix values='0 0 0 0 0.85 0 0 0 0 0.72 0 0 0 0 0.6 0.55 0 0 0 -0.2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
    background-size: 100% 100%;
    opacity: 0.35;
    mix-blend-mode: screen;
    pointer-events: none;
  }

  /* Mother-of-pearl sharkfins: a wedge rising toward the body, with a shimmer that shifts across it. */
  .sharkfin {
    top: 10%;
    bottom: 10%;
    clip-path: polygon(12% 100%, 88% 0, 88% 100%);
    background:
      radial-gradient(ellipse at 70% 75%, rgb(190 225 235 / 0.7), transparent 55%),
      radial-gradient(ellipse at 55% 40%, rgb(235 210 240 / 0.6), transparent 50%),
      repeating-linear-gradient(115deg, rgb(255 255 255 / 0.12) 0 2px, transparent 2px 5px),
      linear-gradient(125deg, #f3efe6, #c9d4da 35%, #ece2ef 60%, #b4c1c7 85%, #e6ede8);
    opacity: 0.62;
  }

  /* Black graphite nut, slightly proud of the board. */
  .nut {
    width: 0.55rem;
    translate: -50% 0;
    z-index: 1;
    border-radius: 2px;
    background: linear-gradient(90deg, #19191b, #3c3c40 40%, #2a2a2d 60%, #121214);
    box-shadow:
      inset 0 0 0 1px rgb(255 255 255 / 0.07),
      3px 0 5px rgb(0 0 0 / 0.75);
  }

  /* Jumbo stainless frets: a rounded crown lit from the left, casting a shadow onto the board,
     and running over the binding like real fret ends. */
  .fret {
    width: 4px;
    translate: -50% 0;
    border-radius: 2px;
    background: linear-gradient(90deg, #4f5257, #fbfcfd 38%, #c4c8cd 62%, #4a4d52);
    box-shadow:
      2px 0 3px rgb(0 0 0 / 0.85),
      5px 0 8px rgb(0 0 0 / 0.35);
  }

  /* Strings sit above the board: lit on top, casting a soft shadow below them. */
  .string {
    translate: 0 -50%;
    z-index: 2;
    border-radius: 9999px;
    background: linear-gradient(180deg, #fbfcfd, #b3b7bd 45%, #6a6e75 80%, #44474c);
    box-shadow:
      0 1px 1px rgb(0 0 0 / 0.6),
      0 5px 4px rgb(0 0 0 / 0.45);
  }
  /* Nickel-wound strings, the winding showing as fine diagonal ridges. */
  .string.wound {
    background:
      repeating-linear-gradient(110deg, rgb(0 0 0 / 0.35) 0 1px, transparent 1px 2.5px),
      linear-gradient(180deg, #eef0f2, #a2a6ad 45%, #62666d 80%, #3f4247);
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

  /* Sized to the string spacing so dots on neighbouring strings never overlap. Frosted glass
     tinted with the dot's color: the strings and frets blur through it. */
  .dot {
    --size: min(1.625rem, calc(100cqh / var(--strings) - 4px));
    width: var(--size);
    height: var(--size);
    translate: -50% -50%;
    z-index: 3;
    border-radius: 9999px;
    background:
      linear-gradient(180deg, rgb(255 255 255 / 0.16), transparent 60%),
      color-mix(in oklab, var(--dot) 60%, transparent);
    backdrop-filter: blur(6px) saturate(1.6);
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--dot) 50%, rgb(255 255 255 / 0.45));
    color: var(--dot-text);
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
  }
  /* Being played: solid and vivid, glowing softly in its own color. */
  .dot.active {
    z-index: 4;
    background: var(--dot);
    box-shadow: 0 0 10px 1px color-mix(in oklab, var(--dot) 45%, transparent);
  }
</style>
