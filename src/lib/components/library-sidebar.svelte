<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right'
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open'
  import GuitarIcon from '@lucide/svelte/icons/guitar'
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid'
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw'
  import UserIcon from '@lucide/svelte/icons/user'

  import * as Collapsible from '#lib/components/ui/collapsible'
  import * as Sidebar from '#lib/components/ui/sidebar'
  import { Spinner } from '#lib/components/ui/spinner'
  import type { Library } from '#lib/library/library.svelte'

  let { library }: { library: Library } = $props()

  // While searching, show every match expanded; otherwise remember what the user opened.
  let open = $state<Record<string, boolean>>({})
  const searching = $derived(library.query.trim() !== '')
  const folderName = $derived(library.root?.split('/').filter(Boolean).at(-1) ?? null)
</script>

<Sidebar.Root collapsible="offcanvas">
  <!-- macOS: draggable strip that the traffic lights sit in, keeping them clear of the logo. -->
  <div class="titlebar-drag hidden h-10 shrink-0 mac:block"></div>

  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg" class="pointer-events-none">
          <div
            class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <GuitarIcon class="size-4" />
          </div>
          <div class="grid flex-1 text-left leading-tight">
            <span class="truncate font-semibold">Library</span>
            <span class="truncate text-xs text-muted-foreground">
              {library.songs.length} songs{folderName ? ` · ${folderName}` : ''}
            </span>
          </div>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
    {#if library.root}
      <Sidebar.Input placeholder="Search songs, artists, albums…" bind:value={library.query} />
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
                    <Sidebar.MenuButton {...props}>
                      <UserIcon />
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
                        <li class="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                          {album.album}
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
                              <span class="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
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

  <Sidebar.Footer>
    <Sidebar.Menu>
      {#if library.root}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton onclick={() => !library.loading && library.load()}>
            <RefreshCwIcon class={library.loading ? 'animate-spin' : ''} />
            <span>Rescan folder</span>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      {/if}
      <Sidebar.MenuItem>
        <Sidebar.MenuButton onclick={() => library.chooseFolder()}>
          <FolderOpenIcon />
          <span>{library.root ? 'Change folder…' : 'Choose tabs folder…'}</span>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>
          {#snippet child({ props })}
            <a href="#/components" {...props}><LayoutGridIcon /><span>Component gallery</span></a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
  <Sidebar.Rail />
</Sidebar.Root>
