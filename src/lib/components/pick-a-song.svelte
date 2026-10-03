<script lang="ts">
  import Disc3Icon from '@lucide/svelte/icons/disc-3'
  import Music4Icon from '@lucide/svelte/icons/music-4'
  import ShuffleIcon from '@lucide/svelte/icons/shuffle'

  import { Button } from '#lib/components/ui/button'
  import { albumArtworkUrl, artistArtworkUrl } from '#lib/library/artwork'
  import { library } from '#lib/library/library.svelte'
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
  /** One of each album (an album can show up twice when its songs aren't filed together). */
  const covers = $derived(
    sample([...new Map(library.albums.map((a) => [`${a.artist}/${a.album}`, a])).values()], 5)
  )
  const suggestions = $derived(sample(library.songs, 4))

  /** A stable hue per name, so covers without artwork still get their own color. */
  function hue(text: string): number {
    let h = 0
    for (const char of text) h = (h * 31 + char.charCodeAt(0)) % 360
    return h
  }

  const songArtwork = (song: LibrarySong): string =>
    song.album ? albumArtworkUrl(song.artist, song.album) : artistArtworkUrl(song.artist)

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
  <div class="relative flex flex-col items-center">
    <div
      class="glow pointer-events-none absolute -top-16 left-1/2 size-[30rem] -translate-x-1/2"
    ></div>

    <!-- Fanned covers -->
    <div class="relative mb-10 h-36 w-80">
      {#each covers as cover, i (`${cover.artist}/${cover.album}`)}
        {@const spread = i - (covers.length - 1) / 2}
        <div
          class="cover absolute top-0 left-1/2 size-36"
          style:--spread={spread}
          style:--lift={Math.abs(spread)}
          style:z-index={10 - Math.abs(Math.round(spread * 2))}
        >
          {@render artwork(
            albumArtworkUrl(cover.artist, cover.album),
            cover.album,
            'size-full rounded-xl'
          )}
        </div>
      {:else}
        <div class="cover absolute top-0 left-1/2 size-36" style:--spread={0}>
          <div class="art flex size-full items-center justify-center rounded-xl" style:--hue={220}>
            <Music4Icon class="size-12 text-white/70" />
          </div>
        </div>
      {/each}
    </div>

    <h1 class="text-4xl font-bold tracking-tight">Pick a song</h1>
    <p class="mt-2 text-[15px] text-muted-foreground">
      Your library is ready. Choose something from the sidebar, or let fate decide.
    </p>

    <div
      class="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground tabular-nums"
    >
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
      <h2 class="mb-3 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
              <span class="block truncate text-xs text-muted-foreground">{song.artist}</span>
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
      color-mix(in oklab, var(--primary) 28%, transparent),
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
    translate: calc(-50% + var(--spread) * 3.75rem) calc(var(--lift, 0) * 0.5rem);
    rotate: calc(var(--spread) * 7deg);
    transform-origin: 50% 120%;
    transition:
      translate 0.3s ease,
      rotate 0.3s ease;
  }
  .cover :global(.art) {
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 0.08),
      0 18px 40px rgb(0 0 0 / 0.5);
  }

  .stat {
    border-radius: 9999px;
    padding: 0.25rem 0.75rem;
    background: color-mix(in oklab, var(--foreground) 7%, transparent);
  }
</style>
