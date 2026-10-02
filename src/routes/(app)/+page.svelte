<script lang="ts">
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open'
  import Music4Icon from '@lucide/svelte/icons/music-4'
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert'

  import ScoreView from '#lib/components/score-view.svelte'
  import Transport from '#lib/components/transport.svelte'
  import * as Alert from '#lib/components/ui/alert'
  import * as Avatar from '#lib/components/ui/avatar'
  import { Badge } from '#lib/components/ui/badge'
  import { Button } from '#lib/components/ui/button'
  import * as Empty from '#lib/components/ui/empty'
  import * as Select from '#lib/components/ui/select'
  import { Spinner } from '#lib/components/ui/spinner'
  import { albumArtworkUrl, artistArtworkUrl } from '#lib/library/artwork'
  import { library } from '#lib/library/library.svelte'
  import type { ScoreInfo, ScorePlayer } from '#lib/render/types'

  let songData = $state<Uint8Array | null>(null)
  let score = $state<ScoreInfo | null>(null)
  let track = $state(0)
  let loadingSong = $state(false)
  let songError = $state<string | null>(null)
  let player = $state<ScorePlayer | null>(null)
  let scrollElement = $state<HTMLElement>()

  // Read the selected song's file whenever the selection changes.
  $effect(() => {
    const song = library.selected
    if (!song) return
    let cancelled = false
    loadingSong = true
    songError = null
    score = null
    track = 0
    library.readSong(song).then(
      (data) => {
        if (!cancelled) songData = data
      },
      (error) => {
        if (cancelled) return
        loadingSong = false
        songError = error instanceof Error ? error.message : String(error)
      }
    )
    return () => (cancelled = true)
  })

  const trackValue = $derived(String(track))
  const trackLabel = $derived(score?.tracks[track]?.name || `Track ${track + 1}`)
</script>

<header class="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
  {#if library.selected}
    {@const song = library.selected}
    <Avatar.Root class="size-9 rounded-sm after:rounded-sm">
      <Avatar.Image
        src={song.album ? albumArtworkUrl(song.artist, song.album) : artistArtworkUrl(song.artist)}
        alt=""
        class="rounded-sm object-cover"
      />
      <Avatar.Fallback class="rounded-sm"><Music4Icon class="size-4" /></Avatar.Fallback>
    </Avatar.Root>
    <div class="min-w-0 flex-1 leading-tight">
      <div class="truncate text-sm font-semibold">{score?.title || library.selected.title}</div>
      <div class="truncate text-xs text-muted-foreground">
        {score?.artist || library.selected.artist}{library.selected.album
          ? ` · ${library.selected.album}`
          : ''}
      </div>
    </div>
    {#if score}
      <Transport {player} barCount={score.barCount} />
    {/if}
    <div class="flex flex-1 items-center justify-end gap-2">
      {#if loadingSong}<Spinner />{/if}
      {#if score}
        <Badge variant="secondary">♩ = {score.tempo}</Badge>
        <Badge variant="outline">{score.barCount} bars</Badge>
        {#if score.tracks.length > 1}
          <Select.Root
            type="single"
            value={trackValue}
            onValueChange={(value) => (track = Number(value))}
          >
            <Select.Trigger size="sm" class="w-48">
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
  {:else}
    <span class="text-sm font-semibold">Kody's Guitar Pro</span>
  {/if}
</header>

<main bind:this={scrollElement} class="flex-1 overflow-auto bg-muted/40 p-6">
  {#if !library.available}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon"><TriangleAlertIcon /></Empty.Media>
        <Empty.Title>Open the desktop app to use your library</Empty.Title>
        <Empty.Description>
          Reading tabs from a folder needs the Electron app; run <code>bun run dev</code>.
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {:else if !library.root && !library.loading}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon"><FolderOpenIcon /></Empty.Media>
        <Empty.Title>Choose your tabs folder</Empty.Title>
        <Empty.Description>
          Every Guitar Pro file in it (and its subfolders) shows up in your library.
        </Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button onclick={() => library.chooseFolder()}><FolderOpenIcon /> Choose folder…</Button>
      </Empty.Content>
    </Empty.Root>
  {:else if !library.selected}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon"><Music4Icon /></Empty.Media>
        <Empty.Title>Pick a song</Empty.Title>
        <Empty.Description>
          {library.songs.length} songs from {library.artists.length} artists. Choose one from the sidebar.
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {/if}

  {#if library.error || songError}
    <Alert.Root variant="destructive" class="mx-auto mb-4 max-w-5xl">
      <TriangleAlertIcon />
      <Alert.Title>Something went wrong</Alert.Title>
      <Alert.Description>{library.error ?? songError}</Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Kept mounted once a song is chosen so alphaTab isn't re-created on every switch. -->
  {#if scrollElement && (library.selected || songData)}
    <div class:hidden={!library.selected}>
      <ScoreView
        data={songData}
        {track}
        {scrollElement}
        bind:player
        onloaded={(info) => {
          score = info
          loadingSong = false
        }}
        onerror={(error) => {
          loadingSong = false
          songError = `Couldn't open this file: ${error.message}`
        }}
      />
    </div>
  {/if}
</main>
