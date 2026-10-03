<script lang="ts">
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link'
  import HeadphonesIcon from '@lucide/svelte/icons/headphones'
  import Music4Icon from '@lucide/svelte/icons/music-4'

  import Transport from '#lib/components/transport.svelte'
  import * as Avatar from '#lib/components/ui/avatar'
  import { Badge } from '#lib/components/ui/badge'
  import { Button } from '#lib/components/ui/button'
  import * as DropdownMenu from '#lib/components/ui/dropdown-menu'
  import * as Select from '#lib/components/ui/select'
  import { Spinner } from '#lib/components/ui/spinner'
  import { albumArtworkUrl, artistArtworkUrl } from '#lib/library/artwork'
  import type { LibrarySong } from '../../shared/library'
  import { session } from '#lib/session.svelte'

  let { song }: { song: LibrarySong } = $props()

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

<!-- Toolbar above the score: the open song, playback controls, and track picker. -->
<header
  class="grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-b bg-background px-4"
>
  <div class="flex min-w-0 items-center">
    <div class="flex min-w-0 items-center gap-2.5">
      <!-- Re-created per image: bits-ui's Avatar never re-checks loading once one image has
           loaded, so a missing cover would otherwise show as a broken image. -->
      {#key artworkUrl}
        <Avatar.Root class="size-8 rounded-sm after:rounded-sm">
          <Avatar.Image src={artworkUrl} alt="" class="rounded-sm object-cover" />
          <Avatar.Fallback class="rounded-sm"><Music4Icon class="size-4" /></Avatar.Fallback>
        </Avatar.Root>
      {/key}
      <div class="min-w-0 leading-tight">
        <div class="truncate text-sm font-semibold">{score?.title || song.title}</div>
        <div class="truncate text-xs text-muted-foreground">
          {score?.artist || song.artist}{song.album ? ` · ${song.album}` : ''}
        </div>
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon-sm"
              class="shrink-0 text-muted-foreground"
              aria-label="Listen to this song"
            >
              <HeadphonesIcon />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" class="w-48">
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
    </div>
  </div>

  <div class="flex items-center">
    {#if score}
      <Transport player={session.player} barCount={score.barCount} />
    {:else if song && session.loading}
      <Spinner />
    {/if}
  </div>

  <div class="flex min-w-0 items-center justify-end gap-2">
    {#if score}
      <Badge variant="secondary">♩ = {score.tempo}</Badge>
      <Badge variant="outline">{score.barCount} bars</Badge>
      {#if score.tracks.length > 1}
        <Select.Root
          type="single"
          value={session.visibleTracks.length === 1 ? String(session.visibleTracks[0]) : ''}
          onValueChange={(value) => session.showOnly(Number(value))}
        >
          <Select.Trigger size="sm" class="w-44">
            <span class="truncate">{trackLabel}</span>
          </Select.Trigger>
          <Select.Content>
            {#each score.tracks as t (t.index)}
              <Select.Item value={String(t.index)} label={t.name || `Track ${t.index + 1}`} />
            {/each}
          </Select.Content>
        </Select.Root>
      {/if}
    {/if}
  </div>
</header>
