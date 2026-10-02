<script lang="ts">
  import { page } from '$app/state'
  import Music4Icon from '@lucide/svelte/icons/music-4'
  import PanelLeftIcon from '@lucide/svelte/icons/panel-left'

  import Transport from '#lib/components/transport.svelte'
  import * as Avatar from '#lib/components/ui/avatar'
  import { Badge } from '#lib/components/ui/badge'
  import { Button } from '#lib/components/ui/button'
  import * as Select from '#lib/components/ui/select'
  import { Spinner } from '#lib/components/ui/spinner'
  import { albumArtworkUrl, artistArtworkUrl } from '#lib/library/artwork'
  import { library } from '#lib/library/library.svelte'
  import { session } from '#lib/session.svelte'
  import { ui } from '#lib/ui.svelte'

  const onLibrary = $derived(page.route.id === '/(app)')
  // The open song's controls only make sense while its score is on screen.
  const song = $derived(onLibrary ? library.selected : null)
  const score = $derived(song ? session.score : null)
  const trackLabel = $derived(score?.tracks[session.track]?.name || `Track ${session.track + 1}`)
</script>

<!-- The window's title bar: the native one is hidden (see src/main/index.ts), so this strip is
     draggable and leaves room for the traffic lights (macOS) or window controls (Windows/Linux).
     It also hosts the open song's info and playback controls. -->
<header
  class="titlebar-drag grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-2 mac:pl-[84px] win:pr-36"
>
  <div class="flex min-w-0 items-center gap-0.5">
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle library"
      disabled={!onLibrary}
      onclick={() => (ui.libraryOpen = !ui.libraryOpen)}
    >
      <PanelLeftIcon />
    </Button>

    {#if song}
      <div class="ml-3 flex min-w-0 items-center gap-2.5">
        <Avatar.Root class="size-8 rounded-sm after:rounded-sm">
          <Avatar.Image
            src={song.album
              ? albumArtworkUrl(song.artist, song.album)
              : artistArtworkUrl(song.artist)}
            alt=""
            class="rounded-sm object-cover"
          />
          <Avatar.Fallback class="rounded-sm"><Music4Icon class="size-4" /></Avatar.Fallback>
        </Avatar.Root>
        <div class="min-w-0 leading-tight">
          <div class="truncate text-sm font-semibold">{score?.title || song.title}</div>
          <div class="truncate text-xs text-muted-foreground">
            {score?.artist || song.artist}{song.album ? ` · ${song.album}` : ''}
          </div>
        </div>
      </div>
    {/if}
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
          value={String(session.track)}
          onValueChange={(value) => (session.track = Number(value))}
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
