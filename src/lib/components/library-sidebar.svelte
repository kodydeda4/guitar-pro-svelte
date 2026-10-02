<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right'
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis'
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open'
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw'
  import DiscIcon from '@lucide/svelte/icons/disc-3'
  import UserIcon from '@lucide/svelte/icons/user'

  import * as Avatar from '#lib/components/ui/avatar'
  import { Button } from '#lib/components/ui/button'
  import * as Collapsible from '#lib/components/ui/collapsible'
  import * as DropdownMenu from '#lib/components/ui/dropdown-menu'
  import * as Sidebar from '#lib/components/ui/sidebar'
  import { Spinner } from '#lib/components/ui/spinner'
  import { albumArtworkUrl, artistArtworkUrl } from '#lib/library/artwork'
  import type { Library } from '#lib/library/library.svelte'

  let { library }: { library: Library } = $props()

  // While searching, show every match expanded; otherwise remember what the user opened.
  let open = $state<Record<string, boolean>>({})
  const searching = $derived(library.query.trim() !== '')
  const folderName = $derived(library.root?.split('/').filter(Boolean).at(-1) ?? null)
</script>

<Sidebar.Root collapsible="none" class="border-r">
  <Sidebar.Header class="px-4 pt-4 pb-3">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <h2 class="text-2xl leading-tight font-bold tracking-tight">Library</h2>
        <p class="text-[13px] text-muted-foreground tabular-nums">
          {library.songs.length.toLocaleString()} songs
        </p>
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="ghost" size="icon" aria-label="Library options">
              <EllipsisIcon />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-56">
          {#if folderName}
            <DropdownMenu.Label class="font-normal">
              <div class="truncate text-sm font-medium">{folderName}</div>
              <div class="truncate text-xs text-muted-foreground" title={library.root}>
                {library.artists.length} artists · {library.songs.length} songs
              </div>
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
          {/if}
          {#if library.root}
            <DropdownMenu.Item disabled={library.loading} onclick={() => library.load()}>
              <RefreshCwIcon class={library.loading ? 'animate-spin' : ''} />
              Rescan folder
            </DropdownMenu.Item>
          {/if}
          <DropdownMenu.Item onclick={() => library.chooseFolder()}>
            <FolderOpenIcon />
            {library.root ? 'Change folder…' : 'Choose tabs folder…'}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
    {#if library.root}
      <Sidebar.Input placeholder="Search" bind:value={library.query} class="mt-2" />
    {/if}
  </Sidebar.Header>

  <Sidebar.Content>
    {#if library.loading && library.songs.length === 0}
      <div class="flex justify-center p-6"><Spinner /></div>
    {:else if library.root && library.artists.length === 0}
      <p class="p-4 text-sm text-muted-foreground">
        {searching ? 'No songs match your search.' : 'No Guitar Pro files found in this folder.'}
      </p>
    {:else}
      <Sidebar.Group>
        <Sidebar.GroupLabel>Artists</Sidebar.GroupLabel>
        <Sidebar.Menu>
          {#each library.artists as group (group.artist)}
            <Collapsible.Root
              open={searching || open[group.artist]}
              onOpenChange={(value) => (open[group.artist] = value)}
              class="group/collapsible"
            >
              <Sidebar.MenuItem>
                <Collapsible.Trigger>
                  {#snippet child({ props })}
                    <Sidebar.MenuButton {...props} class="h-9">
                      <Avatar.Root size="sm">
                        <Avatar.Image
                          src={artistArtworkUrl(
                            group.artist,
                            group.albums.find((a) => a.album)?.album
                          )}
                          alt=""
                          class="object-cover"
                        />
                        <Avatar.Fallback><UserIcon class="size-3.5" /></Avatar.Fallback>
                      </Avatar.Root>
                      <span class="truncate">{group.artist}</span>
                      <ChevronRightIcon
                        class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                      />
                    </Sidebar.MenuButton>
                  {/snippet}
                </Collapsible.Trigger>
                <Sidebar.MenuBadge class="mr-6">{group.songCount}</Sidebar.MenuBadge>
                <Collapsible.Content>
                  <Sidebar.MenuSub>
                    {#each group.albums as album (album.album)}
                      {#if album.album}
                        <li
                          class="flex items-center gap-2 px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground"
                        >
                          <Avatar.Root class="size-8 rounded-sm after:rounded-sm">
                            <Avatar.Image
                              src={albumArtworkUrl(group.artist, album.album)}
                              alt=""
                              class="rounded-sm object-cover"
                            />
                            <Avatar.Fallback class="rounded-sm"
                              ><DiscIcon class="size-4" /></Avatar.Fallback
                            >
                          </Avatar.Root>
                          <span class="line-clamp-2">{album.album}</span>
                        </li>
                      {/if}
                      {#each album.songs as song (song.id)}
                        <Sidebar.MenuSubItem>
                          <Sidebar.MenuSubButton
                            isActive={library.selected?.id === song.id}
                            onclick={() => (library.selected = song)}
                            class="cursor-default"
                          >
                            {#if song.trackNumber !== null}
                              <span
                                class="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums"
                              >
                                {song.trackNumber}
                              </span>
                            {/if}
                            <span class="truncate">{song.title}</span>
                          </Sidebar.MenuSubButton>
                        </Sidebar.MenuSubItem>
                      {/each}
                    {/each}
                  </Sidebar.MenuSub>
                </Collapsible.Content>
              </Sidebar.MenuItem>
            </Collapsible.Root>
          {/each}
        </Sidebar.Menu>
      </Sidebar.Group>
    {/if}
  </Sidebar.Content>

</Sidebar.Root>
