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

  /** Fretboard woods, in the order they're offered. */
  export const WOODS = [
    { id: 'ebony', label: 'Ebony' },
    { id: 'rosewood', label: 'Rosewood' },
    { id: 'maple', label: 'Maple' },
    { id: 'royal-ebony', label: 'Royal Ebony' },
    { id: 'zebrawood', label: 'Zebrawood' },
    { id: 'richlite-maple-valley', label: 'Richlite Maple Valley' },
    { id: 'black-ebony', label: 'Ebony (Less Color Variation)' },
    { id: 'richlite-black', label: 'Richlite Diamond Black' },
    { id: 'roasted-maple', label: 'Roasted Maple' },
    { id: 'ziricote', label: 'Ziricote' },
    { id: 'birdseye-maple', label: 'Birdseye Maple' },
    { id: 'flamed-maple', label: 'Flamed Maple' },
    { id: 'roasted-birdseye-maple', label: 'Roasted Birdseye Maple' },
    { id: 'roasted-flamed-maple', label: 'Roasted Flamed Maple' },
    { id: 'palemoon-ebony', label: 'Palemoon Ebony' }
  ] as const
  export type Wood = (typeof WOODS)[number]['id']

  /** Inlay shapes, in the order they're offered. */
  export const INLAY_SHAPES = [
    { id: 'sharkfin', label: 'Sharkfin' },
    { id: 'reverse-sharkfin', label: 'Reverse fin' },
    { id: 'sharktooth', label: 'Sharktooth' },
    { id: 'reverse-sharktooth', label: 'Rev. tooth' },
    { id: 'dots', label: 'Dots' },
    { id: 'offset-top', label: 'Top dots' },
    { id: 'offset-bottom', label: 'Bottom dots' },
    { id: 'blocks', label: 'Blocks' },
    { id: 'diamonds', label: 'Diamonds' },
    { id: 'tree-of-life', label: 'Tree of Life' },
    { id: 'none', label: 'None' }
  ] as const
  export type InlayShape = (typeof INLAY_SHAPES)[number]['id']

  /** Inlay materials, in the order they're offered. */
  export const INLAY_COLORS = [
    { id: 'pearl', label: 'Pearl' },
    { id: 'abalone', label: 'Abalone' },
    { id: 'white', label: 'White' },
    { id: 'black', label: 'Black' },
    { id: 'custom', label: 'Custom' }
  ] as const
  export type InlayColor = (typeof INLAY_COLORS)[number]['id']
</script>

<script lang="ts">
  import treeOfLife from '#lib/assets/tree-of-life.svg?url'
  import treeOfLifeAccents from '#lib/assets/tree-of-life-accents.svg?url'
  import { cn } from '#lib/utils'

  let {
    tuning,
    frets = 24,
    markers = [],
    wood = 'ebony',
    inlays = 'sharkfin',
    inlayColor = 'pearl',
    inlayCustom = '#c0392b',
    compact = false,
    woodOnly = false
  }: {
    /** Open-string MIDI notes, lowest string first. */
    tuning: number[]
    frets?: number
    markers?: FretMarker[]
    wood?: Wood
    inlays?: InlayShape
    inlayColor?: InlayColor
    /** The inlay color when `inlayColor` is `custom` (any CSS color). */
    inlayCustom?: string
    /** Just the board, for previews: no fret numbers, open-string gutter or padding. */
    compact?: boolean
    /** Only the wood (no frets, strings, inlays or notes): a swatch. Use with `compact`. */
    woodOnly?: boolean
  } = $props()

  const INLAYS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
  /** A quoted CSS url(): Vite inlines small SVGs as data URIs, which break an unquoted url(). */
  const cssUrl = (url: string): string => `url(${JSON.stringify(url)})`
  /** Dot inlays are doubled at the octaves: stacked across the board when centered, side by side
      when offset toward an edge. */
  const DOUBLE_INLAYS = [12, 24]
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

<!-- A guitar neck for the given tuning, in the chosen wood and inlays, with jumbo steel frets and
     real fret spacing. Fret numbers on top, open strings left of the nut, and
     markers (scale tones, played notes) on the strings. -->
<div
  class={cn(
    'fretboard flex h-full min-h-0 flex-col select-none',
    !compact && 'bg-sidebar py-2 pr-5 pl-3'
  )}
  data-wood={wood}
  data-inlay={inlayColor}
  style:--inlay-custom={inlayCustom}
>
  <!-- Fret numbers -->
  <div
    class="relative ml-14 h-5 shrink-0 text-[11px] font-medium tabular-nums"
    class:hidden={compact}
  >
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

  <div class={cn('relative min-h-0 flex-1', !compact && 'mb-4 ml-14')}>
    <div class="board absolute inset-0 rounded-r-sm" style:--strings={tuning.length}>
      <div class="grain absolute inset-0 rounded-r-sm"></div>
      <!-- Figure: stripes, flame or birdseye on top of the grain, for the woods that have it. -->
      <div class="figure absolute inset-0 rounded-r-sm"></div>

      {#if woodOnly}
        <!-- Just the wood. -->
      {:else}
        {#if inlays === 'tree-of-life'}
          <!-- One vine along the whole neck, from the first fret to the last. -->
          <span
            class="inlay tree-of-life absolute"
            style:left="{fretX(0)}%"
            style:width="{fretX(frets) - fretX(0)}%"
            style:--vine={cssUrl(treeOfLife)}
          ></span>
          <!-- Some leaves in a second material, like the JEM's mix of pearl and abalone. -->
          <span
            class="inlay tree-of-life accents absolute"
            style:left="{fretX(0)}%"
            style:width="{fretX(frets) - fretX(0)}%"
            style:--vine={cssUrl(treeOfLifeAccents)}
          ></span>
        {/if}
        {#each fretNumbers as n (n)}
          {#if !inlaid(n) || inlays === 'none' || inlays === 'tree-of-life'}
            <!-- No inlay at this fret. -->
          {:else if inlays === 'dots'}
            {#each DOUBLE_INLAYS.includes(n) ? ['30%', '70%'] : ['50%'] as top (top)}
              <span class="inlay dot-inlay absolute" style:left={noteX(n)} style:top></span>
            {/each}
          {:else if inlays === 'diamonds'}
            {#each DOUBLE_INLAYS.includes(n) ? ['30%', '70%'] : ['50%'] as top (top)}
              <span
                class="inlay diamond absolute"
                style:left={noteX(n)}
                style:top
                style:--space="{fretX(n) - fretX(n - 1)}%"
              ></span>
            {/each}
          {:else if inlays === 'offset-top' || inlays === 'offset-bottom'}
            {#each DOUBLE_INLAYS.includes(n) ? ['-0.5rem', '0.5rem'] : ['0rem'] as shift (shift)}
              <span
                class="inlay dot-inlay absolute"
                style:left="calc({noteX(n)} + {shift})"
                style:top={inlays === 'offset-top' ? '14%' : '86%'}
              ></span>
            {/each}
          {:else}
            <span
              class={cn('inlay absolute', inlays)}
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
      {/if}
    </div>
  </div>
</div>

<style>
  /* Woods: edge, body and lit-center tones, and how the grain shows on them. */
  .fretboard {
    --wood-edge: #040404;
    --wood: #0d0c0c;
    --wood-lit: #1a191c;
    --grain-opacity: 0.35;
    --grain-blend: screen;
    --grain-filter: none;
    --figure: none;
    --figure-blend: normal;
    --binding: rgb(233 227 211 / 0.15);
  }
  .fretboard[data-wood='rosewood'] {
    --wood-edge: #1a0e09;
    --wood: #32201a;
    --wood-lit: #452c21;
    --grain-opacity: 0.45;
    --binding: rgb(233 227 211 / 0.2);
  }
  /* Ebony with brown and gray streaks. */
  .fretboard[data-wood='royal-ebony'] {
    --wood-edge: #0a0806;
    --wood: #1b1612;
    --wood-lit: #2c241c;
    --grain-opacity: 0.5;
    --figure:
      repeating-linear-gradient(
        179.4deg,
        transparent 0 7px,
        rgb(150 120 90 / 0.3) 7px 9px,
        transparent 9px 17px
      ),
      repeating-linear-gradient(
        180.5deg,
        transparent 0 13px,
        rgb(110 100 95 / 0.25) 13px 16px,
        transparent 16px 29px
      );
  }
  /* The jet-black, even ebony. */
  .fretboard[data-wood='black-ebony'] {
    --wood-edge: #020202;
    --wood: #070707;
    --wood-lit: #121213;
    --grain-opacity: 0.15;
  }
  /* Richlite: a dense, grainless composite. */
  .fretboard[data-wood='richlite-black'] {
    --wood-edge: #050505;
    --wood: #0c0c0d;
    --wood-lit: #18181a;
    --grain-opacity: 0.03;
  }
  /* Deep brown with black streaks running through it. */
  .fretboard[data-wood='ziricote'] {
    --wood-edge: #1a0d08;
    --wood: #3a2117;
    --wood-lit: #4f2e20;
    --grain-opacity: 0.5;
    --figure:
      repeating-linear-gradient(
        180.6deg,
        transparent 0 5px,
        rgb(0 0 0 / 0.55) 5px 7px,
        transparent 7px 13px
      ),
      repeating-linear-gradient(
        179.3deg,
        transparent 0 17px,
        rgb(0 0 0 / 0.45) 17px 21px,
        transparent 21px 37px
      );
  }

  /* Pale woods: their grain and figure are drawn dark instead of light. */
  .fretboard:is(
    [data-wood='maple'],
    [data-wood='zebrawood'],
    [data-wood='richlite-maple-valley'],
    [data-wood='roasted-maple'],
    [data-wood='birdseye-maple'],
    [data-wood='flamed-maple'],
    [data-wood='roasted-birdseye-maple'],
    [data-wood='roasted-flamed-maple'],
    [data-wood='palemoon-ebony']
  ) {
    --grain-opacity: 0.4;
    --grain-blend: multiply;
    --grain-filter: invert(1) sepia(1);
    --figure-blend: multiply;
    --binding: rgb(0 0 0 / 0.18);
  }
  .fretboard[data-wood='maple'] {
    --wood-edge: #b88f58;
    --wood: #d9b57c;
    --wood-lit: #e8c994;
  }
  /* Tan, with dark stripes all along the neck. */
  .fretboard[data-wood='zebrawood'] {
    --wood-edge: #7a5f3c;
    --wood: #b89a6a;
    --wood-lit: #d0b585;
    --figure:
      repeating-linear-gradient(
        179.6deg,
        rgb(70 45 20 / 0.7) 0 2px,
        transparent 2px 6px,
        rgb(70 45 20 / 0.45) 6px 7px,
        transparent 7px 11px
      ),
      repeating-linear-gradient(
        180.4deg,
        transparent 0 15px,
        rgb(60 40 20 / 0.5) 15px 18px,
        transparent 18px 31px
      );
  }
  /* Richlite in a maple tone: smooth and even. */
  .fretboard[data-wood='richlite-maple-valley'] {
    --wood-edge: #a88c63;
    --wood: #c9ac83;
    --wood-lit: #d8bd95;
    --grain-opacity: 0.08;
  }
  .fretboard:is(
    [data-wood='roasted-maple'],
    [data-wood='roasted-birdseye-maple'],
    [data-wood='roasted-flamed-maple']
  ) {
    --wood-edge: #7c4113;
    --wood: #b4682a;
    --wood-lit: #cc8642;
  }
  .fretboard:is([data-wood='birdseye-maple'], [data-wood='flamed-maple']) {
    --wood-edge: #c2a676;
    --wood: #e2cda4;
    --wood-lit: #efdcb8;
  }
  /* Birdseye: small dark eyes scattered through the wood. */
  .fretboard:is([data-wood='birdseye-maple'], [data-wood='roasted-birdseye-maple']) {
    --figure:
      radial-gradient(circle at 30% 40%, rgb(110 70 25 / 0.55) 0 1.4px, transparent 2.6px) 0 0 /
        23px 17px,
      radial-gradient(circle at 70% 65%, rgb(110 70 25 / 0.45) 0 1.2px, transparent 2.4px) 5px 3px /
        31px 21px,
      radial-gradient(circle at 50% 50%, rgb(110 70 25 / 0.35) 0 1px, transparent 2px) 11px 7px /
        19px 27px;
  }
  /* Flame: shimmering bands running across the neck. */
  .fretboard:is([data-wood='flamed-maple'], [data-wood='roasted-flamed-maple']) {
    --figure:
      repeating-linear-gradient(
        93deg,
        transparent 0 4px,
        rgb(110 70 25 / 0.22) 4px 7px,
        transparent 7px 12px
      ),
      repeating-linear-gradient(
        86deg,
        transparent 0 9px,
        rgb(110 70 25 / 0.15) 9px 13px,
        transparent 13px 21px
      );
  }
  /* Palemoon ebony: creamy, with bold black streaks. */
  .fretboard[data-wood='palemoon-ebony'] {
    --wood-edge: #a8956a;
    --wood: #d6c497;
    --wood-lit: #e6d6ad;
    --figure:
      repeating-linear-gradient(
        179.5deg,
        transparent 0 9px,
        rgb(20 15 10 / 0.75) 9px 11px,
        transparent 11px 23px
      ),
      repeating-linear-gradient(
        180.3deg,
        transparent 0 17px,
        rgb(20 15 10 / 0.5) 17px 19px,
        transparent 19px 41px
      );
  }

  /* Inlay materials. Pearl and abalone are also named on their own, for Tree of Life's second
     material. */
  .fretboard {
    --pearl-fill:
      radial-gradient(ellipse at 70% 75%, rgb(190 225 235 / 0.7), transparent 55%),
      radial-gradient(ellipse at 55% 40%, rgb(235 210 240 / 0.6), transparent 50%),
      repeating-linear-gradient(115deg, rgb(255 255 255 / 0.12) 0 2px, transparent 2px 5px),
      linear-gradient(125deg, #f3efe6, #c9d4da 35%, #ece2ef 60%, #b4c1c7 85%, #e6ede8);
    --abalone-fill:
      radial-gradient(ellipse at 25% 70%, rgb(40 200 170 / 0.85), transparent 50%),
      radial-gradient(ellipse at 75% 30%, rgb(120 90 220 / 0.8), transparent 55%),
      radial-gradient(ellipse at 60% 80%, rgb(60 140 230 / 0.8), transparent 50%),
      repeating-linear-gradient(105deg, rgb(255 255 255 / 0.15) 0 1px, transparent 1px 4px),
      linear-gradient(135deg, #2bb59b, #3d6fd1 40%, #7b4fc9 70%, #2aa5a0);
    --inlay-fill: var(--pearl-fill);
    --inlay-opacity: 0.62;
  }
  .fretboard[data-inlay='abalone'] {
    --inlay-fill: var(--abalone-fill);
    --inlay-opacity: 0.7;
  }
  .fretboard[data-inlay='white'] {
    --inlay-fill: linear-gradient(180deg, #f6f4ee, #e4e0d6);
    --inlay-opacity: 0.85;
  }
  /* A picked color, with a little sheen across it. */
  .fretboard[data-inlay='custom'] {
    --inlay-fill: linear-gradient(
      160deg,
      color-mix(in oklab, var(--inlay-custom) 75%, white),
      var(--inlay-custom) 55%,
      color-mix(in oklab, var(--inlay-custom) 80%, black)
    );
    --inlay-opacity: 0.9;
  }
  .fretboard[data-inlay='black'] {
    --inlay-fill: linear-gradient(180deg, #1b1b1d, #050505);
    --inlay-opacity: 0.9;
  }

  /* The board is radiused: lit along the middle, falling off into shadow toward both edges. */
  .board {
    container-type: size;
    background: linear-gradient(
      180deg,
      var(--wood-edge),
      var(--wood) 12%,
      color-mix(in oklab, var(--wood-lit) 85%, var(--wood)) 42%,
      var(--wood-lit) 50%,
      color-mix(in oklab, var(--wood-lit) 60%, var(--wood)) 60%,
      var(--wood) 88%,
      var(--wood-edge)
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

  .figure {
    background: var(--figure);
    mix-blend-mode: var(--figure-blend);
    pointer-events: none;
  }

  /* Grain: long streaks and pores running along the neck. */
  .grain {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.0025 0.42' numOctaves='4' seed='11'/%3E%3CfeColorMatrix values='0 0 0 0 0.85 0 0 0 0 0.72 0 0 0 0 0.6 0.55 0 0 0 -0.2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
    background-size: 100% 100%;
    opacity: var(--grain-opacity);
    mix-blend-mode: var(--grain-blend);
    filter: var(--grain-filter);
    pointer-events: none;
  }

  .inlay {
    background: var(--inlay-fill);
    opacity: var(--inlay-opacity);
  }
  /* A wedge rising toward the body, filling most of the fret space. */
  .inlay.sharkfin {
    top: 10%;
    bottom: 10%;
    clip-path: polygon(12% 100%, 88% 0, 88% 100%);
  }
  /* Mirrored: the tall edge toward the nut. */
  .inlay.reverse-sharkfin {
    top: 10%;
    bottom: 10%;
    clip-path: polygon(12% 0, 12% 100%, 88% 100%);
  }
  /* Ibanez sharktooth: a lightning bolt across the board, straight along the body-side fret,
     widest at the bass edge and tapering to a point at the treble edge, with one tooth jutting
     out of its slanted side… */
  .inlay.sharktooth {
    top: 6%;
    bottom: 6%;
    clip-path: polygon(88% 0, 88% 100%, 12% 100%, 51% 55%, 41% 48%);
  }
  /* …and reversed: straight along the nut-side fret. */
  .inlay.reverse-sharktooth {
    top: 6%;
    bottom: 6%;
    clip-path: polygon(12% 0, 12% 100%, 88% 100%, 49% 55%, 59% 48%);
  }
  /* BC Rich diamonds: small, centered, and longer along the neck than across it. */
  .inlay.diamond {
    width: min(2.25rem, calc(var(--space) * 0.62));
    height: 19%;
    translate: -50% -50%;
    clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  }
  /* Ibanez JEM Tree of Life: a vine with leaves and flowers, cut out of the inlay material. */
  .inlay.tree-of-life {
    top: 8%;
    bottom: 8%;
    mask: var(--vine) center / 100% 100% no-repeat;
    /* The vine is thin, so it's drawn more solid than the other inlays. */
    opacity: calc(var(--inlay-opacity) + 0.25);
  }
  /* The second material: abalone, or pearl when the inlays are abalone already. */
  .inlay.tree-of-life.accents {
    background: var(--abalone-fill);
    opacity: 0.9;
  }
  .fretboard[data-inlay='abalone'] .inlay.tree-of-life.accents {
    background: var(--pearl-fill);
  }
  .inlay.blocks {
    top: 12%;
    bottom: 12%;
    clip-path: inset(0 16%);
  }
  .inlay.dot-inlay {
    width: 0.8rem;
    height: 0.8rem;
    translate: -50% -50%;
    border-radius: 9999px;
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
    background: var(--wood);
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
