<script lang="ts">
  import Disc3Icon from '@lucide/svelte/icons/disc-3'
  import Music4Icon from '@lucide/svelte/icons/music-4'
  import ShuffleIcon from '@lucide/svelte/icons/shuffle'
  import { cubicOut } from 'svelte/easing'
  import { fade, fly } from 'svelte/transition'

  import { Button } from '#lib/components/ui/button'
  import { albumArtworkUrl, artistArtworkUrl } from '#lib/library/artwork'
  import { library } from '#lib/library/library.svelte'
  import { ui } from '#lib/ui.svelte'
  import { cn } from '#lib/utils'
  import type { LibrarySong } from '../../shared/library'

  /** A few items picked at random (re-picked when the library changes). */
  function sample<T>(items: T[], count: number): T[] {
    const pool = [...items]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, count)
  }

  const artistCount = $derived(new Set(library.songs.map((s) => s.artist)).size)
  const albumCount = $derived(new Set(library.songs.map((s) => `${s.artist}/${s.album}`)).size)
  /**
   * A deck of album covers (one of each: an album can show up twice when its songs aren't filed
   * together). Five are fanned out at a time; swiping deals through the deck.
   */
  const deck = $derived(
    sample([...new Map(library.albums.map((a) => [`${a.artist}/${a.album}`, a])).values()], 15)
  )
  const FANNED = 5
  let offset = $state(0)
  /** Which way the last swipe went, so new covers fly in from that side. */
  let direction = $state(1)
  const covers = $derived(
    Array.from(
      { length: Math.min(FANNED, deck.length) },
      (_, i) => deck[(((offset + i) % deck.length) + deck.length) % deck.length]
    )
  )
  /** The cover under the pointer: it lifts, and its neighbors lean away. */
  let hovered = $state<number | null>(null)
  /** Dealing: hover is ignored meanwhile (and for a moment after), so nothing jumps forward. */
  let shuffling = $state(false)
  const lifted = $derived(shuffling ? null : hovered)

  /** At most one card is dealt per this long, so a flick deals one card, not five. */
  const DEAL_EVERY_MS = 550
  let lastDeal = 0
  let settle: ReturnType<typeof setTimeout> | undefined

  function deal(step: number): void {
    const now = Date.now()
    if (deck.length <= 1 || now - lastDeal < DEAL_EVERY_MS) return
    lastDeal = now
    direction = step
    offset += step
    shuffling = true
    clearTimeout(settle)
    settle = setTimeout(() => (shuffling = false), 900)
  }

  // Trackpad swipes (and shift + scroll wheel) deal through the deck: a deliberate swipe, not a
  // brush of the trackpad.
  let swipe = 0
  let swipeReset: ReturnType<typeof setTimeout> | undefined
  function onwheel(event: WheelEvent): void {
    const dx = event.shiftKey ? event.deltaY : event.deltaX
    if (Math.abs(dx) < Math.abs(event.shiftKey ? event.deltaX : event.deltaY)) return
    swipe += dx
    // A pause between gestures starts the count over.
    clearTimeout(swipeReset)
    swipeReset = setTimeout(() => (swipe = 0), 200)
    if (Math.abs(swipe) >= 150) {
      deal(Math.sign(swipe))
      swipe = 0
    }
  }

  // So does dragging across the covers with the mouse; a drag doesn't count as a click.
  let dragX: number | null = null
  let dragged = false
  function onpointerdown(event: PointerEvent): void {
    dragX = event.clientX
    dragged = false
  }
  function onpointermove(event: PointerEvent): void {
    if (dragX === null) return
    const dx = dragX - event.clientX
    if (Math.abs(dx) >= 110) {
      deal(Math.sign(dx))
      dragX = event.clientX
      dragged = true
    }
  }
  const endDrag = (): void => {
    dragX = null
  }

  /** Shows a cover's album in the Library sidebar (Albums view, expanded and scrolled to). */
  function focusAlbum(cover: { artist: string; album: string }): void {
    if (dragged) return
    ui.sidebarView = 'library'
    ui.sidebarOpen = true
    library.focusAlbum = { artist: cover.artist, album: cover.album }
  }
  const suggestions = $derived(sample(library.songs, 4))

  /** A stable hue per name, so covers without artwork still get their own color. */
  function hue(text: string): number {
    let h = 0
    for (const char of text) h = (h * 31 + char.charCodeAt(0)) % 360
    return h
  }

  const songArtwork = (song: LibrarySong): string =>
    song.album ? albumArtworkUrl(song.artist, song.album) : artistArtworkUrl(song.artist)

  /** Greetings for the welcome screen; one is picked per visit and typed out. */
  function greetings(hour: number): string[] {
    const timely =
      hour < 5
        ? ['Up late, night owl?', 'The 3 a.m. riff hits different']
        : hour < 12
          ? ['Good morning, shredder', 'Coffee first, then scales']
          : hour < 18
            ? ['Good afternoon, axe slinger', 'Perfect afternoon for a solo']
            : ['Good evening, guitar hero', 'Golden hour, golden tone']
    return [
      ...timely,
      'Welcome back, guitar master',
      'Ready to shred?',
      'Your fingers miss the frets',
      'Tune up, turn it up',
      'Strings are stretched. Let’s go.',
      'What are we learning today?',
      'Pick it up, pick a song',
      'Time to make some noise',
      'One more run-through?',
      'The amp is warm',
      'Practice makes perfect fifths',
      'Fresh calluses incoming',
      'Riffs await',
      'Let’s get some calluses',
      'Hello again, string bender',
      'Back for more, maestro?'
    ]
  }

  const pool = greetings(new Date().getHours())
  const greeting = pool[Math.floor(Math.random() * pool.length)]

  // Type the greeting out, a character at a time (shown at once if motion is reduced).
  let typed = $state('')
  $effect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      typed = greeting
      return
    }
    let i = 0
    let timer: ReturnType<typeof setTimeout>
    const tick = (): void => {
      typed = greeting.slice(0, ++i)
      // Uneven, human-ish timing, with a beat after punctuation.
      if (i < greeting.length)
        timer = setTimeout(tick, /[,.?!]/.test(greeting[i - 1]) ? 260 : 35 + Math.random() * 55)
    }
    timer = setTimeout(tick, 350)
    return () => clearTimeout(timer)
  })
  const typing = $derived(typed.length < greeting.length)

  function playRandom(): void {
    const [song] = sample(library.songs, 1)
    if (song) library.selected = song
  }
</script>

<!-- Artwork with a colored, iconed tile underneath: shows through when there's no image. -->
{#snippet artwork(src: string, name: string, className: string)}
  <div class="art relative overflow-hidden {className}" style:--hue={hue(name)}>
    <Disc3Icon class="absolute inset-0 m-auto size-1/3 text-white/40" strokeWidth={1.5} />
    <img
      {src}
      alt=""
      class="absolute inset-0 size-full object-cover"
      onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
    />
  </div>
{/snippet}

<!-- The welcome screen while no song is open: a fan of album covers from the library, its size,
     a shuffle button, and a few songs to start with. -->
<div class="flex min-h-full flex-col items-center justify-center py-10">
  <!-- `isolate` keeps the glow behind this block's text instead of washing over it. -->
  <div class="relative isolate flex flex-col items-center">
    <div
      class="glow pointer-events-none absolute -top-28 left-1/2 -z-10 size-[24rem] -translate-x-1/2"
    ></div>

    <!-- Fanned covers: hover to lift one, swipe or drag to deal through the deck, click to find
         the album in the library. -->
    <!-- svelte-ignore a11y_no_static_element_interactions (the covers inside are buttons; this
         only adds swiping) -->
    <div
      class="fan relative mb-4 h-40 w-[26rem] touch-pan-y select-none"
      {onwheel}
      {onpointerdown}
      {onpointermove}
      onpointerup={endDrag}
      onpointerleave={() => {
        endDrag()
        hovered = null
      }}
    >
      {#each covers as cover, i (`${cover.artist}/${cover.album}`)}
        {@const spread = i - (covers.length - 1) / 2}
        {@const away = lifted === null || lifted === i ? 0 : i - lifted}
        <button
          type="button"
          class={cn('cover absolute top-0 left-1/2 size-36', lifted === i && 'hovered')}
          style:--spread={spread}
          style:--lift={Math.abs(spread)}
          style:--push="{away === 0 ? 0 : Math.sign(away) * (0.75 / Math.abs(away))}rem"
          style:z-index={10 - Math.abs(Math.round(spread * 2))}
          in:fly={{ x: direction * 60, opacity: 0, duration: 700, easing: cubicOut }}
          out:fade={{ duration: 300 }}
          onpointerenter={() => (hovered = i)}
          onclick={() => focusAlbum(cover)}
          aria-label="Show {cover.album} by {cover.artist} in the library"
          title="{cover.album} — {cover.artist}"
        >
          {@render artwork(
            albumArtworkUrl(cover.artist, cover.album),
            cover.album,
            'size-full rounded-xl'
          )}
        </button>
      {:else}
        <div class="cover absolute top-0 left-1/2 size-36" style:--spread={0}>
          <div class="art flex size-full items-center justify-center rounded-xl" style:--hue={220}>
            <Music4Icon class="size-12 text-white/70" />
          </div>
        </div>
      {/each}
    </div>
    {#if deck.length > 1}
      <p class="mb-6 text-[11px] font-medium text-foreground/50">
        Swipe to shuffle · Click an album to find it
      </p>
    {:else}
      <div class="mb-6"></div>
    {/if}

    <!-- The greeting, typed out; the full text is the accessible name from the start. -->
    <h1
      class="title min-h-[1.2em] text-center text-5xl font-extrabold tracking-tight text-foreground"
      aria-label={greeting}
    >
      <span aria-hidden="true">{typed}</span><span
        class={cn('caret', !typing && 'done')}
        aria-hidden="true"
      ></span>
    </h1>
    <p class="mt-3 text-[15px] font-medium text-foreground/90">
      Your library is ready. Choose something from the sidebar, or let fate decide.
    </p>

    <div class="mt-5 flex items-center gap-2 text-xs font-semibold text-foreground tabular-nums">
      <span class="stat">{library.songs.length.toLocaleString()} songs</span>
      <span class="stat">{artistCount.toLocaleString()} artists</span>
      <span class="stat">{albumCount.toLocaleString()} albums</span>
    </div>

    <Button
      size="lg"
      class="mt-6 rounded-full px-5 shadow-lg shadow-primary/25"
      onclick={playRandom}
    >
      <ShuffleIcon /> Play something random
    </Button>
  </div>

  {#if suggestions.length > 0}
    <div class="mt-14 w-full max-w-3xl">
      <h2 class="mb-3 px-1 text-xs font-bold tracking-wide text-foreground/80 uppercase">
        Try one of these
      </h2>
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {#each suggestions as song (song.id)}
          <button
            type="button"
            class="group flex flex-col gap-2 rounded-xl p-2 text-left transition-colors hover:bg-foreground/6"
            onclick={() => (library.selected = song)}
          >
            {@render artwork(
              songArtwork(song),
              song.album ?? song.artist,
              'aspect-square w-full rounded-lg shadow-md transition-transform group-hover:scale-[1.03]'
            )}
            <span class="min-w-0 px-0.5 leading-tight">
              <span class="block truncate text-sm font-semibold">{song.title}</span>
              <span class="block truncate text-xs text-foreground/75">{song.artist}</span>
            </span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  /* A soft pool of the accent color behind the covers. */
  .glow {
    background: radial-gradient(
      closest-side,
      color-mix(in oklab, var(--primary) 32%, transparent),
      transparent
    );
    filter: blur(20px);
  }

  .art {
    background: linear-gradient(
      135deg,
      oklch(0.55 0.14 var(--hue)),
      oklch(0.32 0.1 calc(var(--hue) + 40))
    );
  }

  /* Each cover tilts and slides out from the middle, like a hand of cards. */
  .cover {
    translate: calc(-50% + var(--spread) * 3.75rem + var(--push, 0rem))
      calc(var(--lift, 0) * 0.5rem);
    rotate: calc(var(--spread) * 7deg);
    transform-origin: 50% 120%;
    cursor: pointer;
    transition:
      translate 0.7s cubic-bezier(0.22, 1, 0.36, 1),
      rotate 0.7s cubic-bezier(0.22, 1, 0.36, 1),
      scale 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }
  /* The cover under the pointer eases up a little and half-straightens. */
  .cover.hovered {
    translate: calc(-50% + var(--spread) * 3.75rem) calc(var(--lift, 0) * 0.5rem - 0.6rem);
    rotate: calc(var(--spread) * 4deg);
    scale: 1.03;
  }
  /* Covers lift off the glow: a crisp rim, a tight contact shadow and a deep soft one. */
  .cover :global(.art) {
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 0.14),
      0 3px 8px rgb(0 0 0 / 0.45),
      0 22px 44px rgb(0 0 0 / 0.65);
  }

  /* The typing caret: solid while typing, then blinking for a while before it fades away. */
  .caret {
    display: inline-block;
    width: 0.08em;
    height: 0.9em;
    margin-left: 0.06em;
    translate: 0 0.1em;
    border-radius: 1px;
    background: var(--primary);
    box-shadow: 0 0 12px color-mix(in oklab, var(--primary) 70%, transparent);
  }
  .caret.done {
    animation:
      blink 1s steps(1) infinite,
      fade-out 0.6s ease 4s forwards;
  }
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
  @keyframes fade-out {
    to {
      visibility: hidden;
    }
  }

  /* A soft dark halo so the title reads cleanly against the glow. */
  .title {
    text-shadow:
      0 1px 2px rgb(0 0 0 / 0.6),
      0 2px 24px rgb(0 0 0 / 0.7);
  }

  .stat {
    border-radius: 9999px;
    padding: 0.25rem 0.75rem;
    background: color-mix(in oklab, var(--foreground) 14%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--foreground) 18%, transparent);
  }
</style>
