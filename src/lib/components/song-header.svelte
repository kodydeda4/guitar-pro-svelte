<script lang="ts">
  import Music4Icon from '@lucide/svelte/icons/music-4'

  import Transport from '#lib/components/transport.svelte'
  import * as Avatar from '#lib/components/ui/avatar'
  import { Badge } from '#lib/components/ui/badge'
  import * as Select from '#lib/components/ui/select'
  import { Spinner } from '#lib/components/ui/spinner'
  import { albumArtworkUrl, artistArtworkUrl } from '#lib/library/artwork'
  import type { LibrarySong } from '../../shared/library'
  import { session } from '#lib/session.svelte'

  let { song }: { song: LibrarySong } = $props()

  // While the next song loads, session.score still holds the previous one.
  const score = $derived(session.loading ? null : session.score)
  const trackLabel = $derived(
    session.visibleTracks.length > 1
      ? `${session.visibleTracks.length} tracks`
      : score?.tracks[session.visibleTracks[0]]?.name || `Track ${session.visibleTracks[0] + 1}`
  )
</script>

<!-- Toolbar above the score: the open song, playback controls, and track picker. -->
<header
  class="grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-b bg-background px-4"
>
  <div class="flex min-w-0 items-center">
    <div class="flex min-w-0 items-center gap-2.5">
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
