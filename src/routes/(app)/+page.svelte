<script lang="ts">
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open'
  import Music4Icon from '@lucide/svelte/icons/music-4'
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert'

  import ScoreView from '#lib/components/score-view.svelte'
  import SongHeader from '#lib/components/song-header.svelte'
  import TracksPanel from '#lib/components/tracks-panel.svelte'
  import * as Alert from '#lib/components/ui/alert'
  import { Button } from '#lib/components/ui/button'
  import * as Empty from '#lib/components/ui/empty'
  import { library } from '#lib/library/library.svelte'
  import { session } from '#lib/session.svelte'

  let songData = $state<Uint8Array | null>(null)
  let songError = $state<string | null>(null)
  let scrollElement = $state<HTMLElement>()

  // Read the selected song's file whenever the selection changes.
  $effect(() => {
    const song = library.selected
    if (!song) return
    let cancelled = false
    session.loading = true
    songError = null
    session.reset()
    library.readSong(song).then(
      (data) => {
        if (!cancelled) songData = data
      },
      (error) => {
        if (cancelled) return
        session.loading = false
        songError = error instanceof Error ? error.message : String(error)
      }
    )
    return () => (cancelled = true)
  })
</script>

{#if library.selected}
  <SongHeader song={library.selected} />
{/if}

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
        tracks={session.visibleTracks}
        {scrollElement}
        bind:player={session.player}
        onloaded={(info) => session.loaded(info)}
        onerror={(error) => {
          session.loading = false
          songError = `Couldn't open this file: ${error.message}`
        }}
      />
    </div>
  {/if}
</main>

{#if library.selected && session.score}
  <TracksPanel score={session.score} />
{/if}
