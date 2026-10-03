<script lang="ts">
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link'
  import HeadphonesIcon from '@lucide/svelte/icons/headphones'
  import Music4Icon from '@lucide/svelte/icons/music-4'

  import Transport from '#lib/components/transport.svelte'
  import * as Avatar from '#lib/components/ui/avatar'
  import { Button } from '#lib/components/ui/button'
  import * as DropdownMenu from '#lib/components/ui/dropdown-menu'
  import * as Select from '#lib/components/ui/select'
  import { Spinner } from '#lib/components/ui/spinner'
  import { albumArtworkUrl, artistArtworkUrl } from '#lib/library/artwork'
  import type { LibrarySong } from '../../shared/library'
  import { session } from '#lib/session.svelte'

  let { song }: { song: LibrarySong } = $props()

  function formatTime(ms: number): string {
    const total = Math.floor(ms / 1000)
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
  }

  const artworkUrl = $derived(
    song.album ? albumArtworkUrl(song.artist, song.album) : artistArtworkUrl(song.artist)
  )

  // While the next song loads, session.score still holds the previous one.
  const score = $derived(session.loading ? null : session.score)
  const trackLabel = $derived(
    session.visibleTracks.length > 1
      ? `${session.visibleTracks.length} tracks`
      : score?.tracks[session.visibleTracks[0]]?.name || `Track ${session.visibleTracks[0] + 1}`
  )

  // Search each service for the song; links open in the default browser (see setWindowOpenHandler).
  const query = $derived(
    encodeURIComponent(`${score?.artist || song.artist} ${score?.title || song.title}`)
  )
  const services = $derived([
    {
      name: 'YouTube',
      color: '#ff0000',
      url: `https://www.youtube.com/results?search_query=${query}`
    },
    { name: 'YouTube Music', color: '#ff0033', url: `https://music.youtube.com/search?q=${query}` },
    { name: 'Spotify', color: '#1ed760', url: `https://open.spotify.com/search/${query}` },
    { name: 'Tidal', color: 'currentColor', url: `https://tidal.com/search?q=${query}` },
    { name: 'Apple Music', color: '#fa2d48', url: `https://music.apple.com/search?term=${query}` }
  ])
</script>

<!-- Shown in the title bar above the score, Safari-style: play controls, then the song in an
     address-bar capsule (with playback progress along its bottom edge, like Safari's loading
     bar), then playback options and the track picker. -->
<div class="flex h-full items-center gap-2 px-2">
  <Transport player={session.player}>
    {#snippet children(playback)}
      <div
        class="toolbar-pill relative mx-auto max-w-2xl min-w-0 flex-1 gap-2 overflow-hidden pr-0.5 pl-1.5"
      >
        <!-- Re-created per image: bits-ui's Avatar never re-checks loading once one image has
             loaded, so a missing cover would otherwise show as a broken image. -->
        {#key artworkUrl}
          <Avatar.Root class="size-6 shrink-0 rounded-full after:rounded-full">
            <Avatar.Image src={artworkUrl} alt="" class="rounded-full object-cover" />
            <Avatar.Fallback class="rounded-full"><Music4Icon class="size-3.5" /></Avatar.Fallback>
          </Avatar.Root>
        {/key}

        <div class="min-w-0 flex-1 truncate text-center text-sm">
          <span class="font-semibold">{score?.title || song.title}</span>
          <span class="text-muted-foreground">
            — {score?.artist || song.artist}{song.album ? ` · ${song.album}` : ''}
          </span>
        </div>

        {#if score}
          <span class="shrink-0 text-xs text-muted-foreground tabular-nums">
            {playback?.currentBar ?? 1}/{score.barCount} · {formatTime(playback?.currentTime ?? 0)}
            / {formatTime(playback?.endTime ?? 0)}
          </span>
        {:else if session.loading}
          <Spinner class="shrink-0 text-muted-foreground" />
        {/if}

        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="ghost"
                size="icon-sm"
                class="shrink-0 rounded-full text-muted-foreground"
                aria-label="Listen to this song"
              >
                <HeadphonesIcon />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" class="w-48">
            <DropdownMenu.Label>Listen on</DropdownMenu.Label>
            {#each services as service (service.name)}
              <DropdownMenu.Item onclick={() => window.open(service.url, '_blank')}>
                <span class="size-2 rounded-full" style:background={service.color}></span>
                {service.name}
                <ExternalLinkIcon class="ml-auto text-muted-foreground" />
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        {#if score && playback?.endTime}
          <div
            class="absolute bottom-0 left-0 h-0.5 bg-primary transition-[width] duration-200"
            style:width="{(playback.currentTime / playback.endTime) * 100}%"
          ></div>
        {/if}
      </div>
    {/snippet}
  </Transport>

  {#if score && score.tracks.length > 1}
    <Select.Root
      type="single"
      value={session.visibleTracks.length === 1 ? String(session.visibleTracks[0]) : ''}
      onValueChange={(value) => session.showOnly(Number(value))}
    >
      <Select.Trigger
        class="toolbar-pill w-40 shrink-0 px-3 hover:bg-muted dark:bg-transparent dark:hover:bg-muted"
      >
        <span class="truncate">{trackLabel}</span>
      </Select.Trigger>
      <Select.Content>
        {#each score.tracks as t (t.index)}
          <Select.Item value={String(t.index)} label={t.name || `Track ${t.index + 1}`} />
        {/each}
      </Select.Content>
    </Select.Root>
  {/if}
</div>
