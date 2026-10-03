<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right'
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis'
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open'
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw'
  import DiscIcon from '@lucide/svelte/icons/disc-3'
  import SearchIcon from '@lucide/svelte/icons/search'
  import UserIcon from '@lucide/svelte/icons/user'
  import { tick } from 'svelte'
  import { fade } from 'svelte/transition'

  import * as Avatar from '#lib/components/ui/avatar'
  import { Button } from '#lib/components/ui/button'
  import * as Collapsible from '#lib/components/ui/collapsible'
  import * as DropdownMenu from '#lib/components/ui/dropdown-menu'
  import * as Sidebar from '#lib/components/ui/sidebar'
  import { Spinner } from '#lib/components/ui/spinner'
  import * as Tabs from '#lib/components/ui/tabs'
  import { albumArtworkUrl, artistArtworkUrl } from '#lib/library/artwork'
  import type { Library } from '#lib/library/library.svelte'
  import { ui } from '#lib/ui.svelte'
  import type { LibrarySong } from '../../shared/library'
  import { cn } from '#lib/utils'

  let { library }: { library: Library } = $props()

  // While searching, show every match expanded; otherwise remember what the user opened.
  let open = $state<Record<string, boolean>>({})
  const searching = $derived(library.query.trim() !== '')
  /** The large title has scrolled out of view, so the sticky bar shows the compact one. */
  let collapsed = $state(false)
  let largeTitle = $state<HTMLElement>()
  /** Search was opened from the collapsed bar's button. */
  let searchOpen = $state(false)
  let searchInput = $state<HTMLInputElement | null>(null)
  // The full search field shows at the top of the list, after tapping the collapsed bar's
  // search button, and while there's a query (so it's never hidden mid-search).
  const showSearch = $derived(!collapsed || searchOpen || library.query !== '')

  async function openSearch(): Promise<void> {
    searchOpen = true
    await tick()
    searchInput?.focus()
  }

  const folderName = $derived(library.root?.split('/').filter(Boolean).at(-1) ?? null)
</script>

{#snippet songRow(song: LibrarySong)}
  <Sidebar.MenuSubItem>
    <Sidebar.MenuSubButton
      isActive={library.selected?.id === song.id}
      onclick={() => (library.selected = song)}
      class="h-8 cursor-default"
    >
      {#if song.trackNumber !== null}
        <span class="w-5 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
          {song.trackNumber}
        </span>
      {/if}
      <span class="truncate">{song.title}</span>
    </Sidebar.MenuSubButton>
  </Sidebar.MenuSubItem>
{/snippet}

{#snippet menu(size: 'icon' | 'icon-sm' = 'icon')}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="ghost" {size} class="rounded-full" aria-label="Library options">
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
{/snippet}

<Sidebar.Root collapsible="none" class="border-r">
  <Sidebar.Content
    onscroll={(e) => (collapsed = e.currentTarget.scrollTop >= (largeTitle?.offsetHeight ?? 0))}
  >
    <!-- Large title: scrolls away with the list, like a macOS/iOS large navigation title. -->
    <div bind:this={largeTitle} class="flex items-start justify-between gap-2 px-4 pt-4">
      <div class="min-w-0">
        <h2 class="text-2xl leading-tight font-bold tracking-tight">Library</h2>
        <p class="text-[13px] text-muted-foreground tabular-nums">
          {library.songs.length.toLocaleString()} songs
        </p>
      </div>
      {@render menu()}
    </div>

    <!-- Sticky glass bar: the list scrolls underneath it, blurred. Once the large title has
         scrolled away it shows a centered title, with search collapsed into a button. The
         Artists | Albums | Songs tabs sit along its bottom edge. -->
    {#if library.root || collapsed}
      <Sidebar.Header
        class="sticky top-0 z-10 gap-0 border-b bg-sidebar/70 px-0 py-0 backdrop-blur-xl"
      >
        <div class="flex h-12 items-center px-4">
          {#if library.root && showSearch}
            <div class="w-full" in:fade={{ duration: 150 }}>
              <Sidebar.Input
                bind:ref={searchInput}
                placeholder="Search"
                bind:value={library.query}
                onblur={() => (searchOpen = false)}
              />
            </div>
          {:else}
            <div
              class="grid w-full grid-cols-[2rem_1fr_2rem] items-center"
              in:fade={{ duration: 150 }}
            >
              {#if library.root}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="rounded-full"
                  aria-label="Search"
                  onclick={openSearch}
                >
                  <SearchIcon />
                </Button>
              {:else}
                <span></span>
              {/if}
              <span class="truncate text-center text-sm font-bold">Library</span>
              {@render menu('icon-sm')}
            </div>
          {/if}
        </div>
        {#if library.root}
          <Tabs.Root bind:value={ui.libraryView} class="px-4">
            <Tabs.List variant="line" class="h-9 gap-4 p-0">
              <Tabs.Trigger value="artists" class="flex-none px-0">Artists</Tabs.Trigger>
              <Tabs.Trigger value="albums" class="flex-none px-0">Albums</Tabs.Trigger>
              <Tabs.Trigger value="songs" class="flex-none px-0">Songs</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        {/if}
      </Sidebar.Header>
    {/if}

    {#if library.loading && library.songs.length === 0}
      <div class="flex justify-center p-6"><Spinner /></div>
    {:else if library.root && library.filtered.length === 0}
      <p class="p-4 text-sm text-muted-foreground">
        {searching ? 'No songs match your search.' : 'No Guitar Pro files found in this folder.'}
      </p>
    {:else if ui.libraryView === 'albums'}
      <Sidebar.Group>
        <Sidebar.Menu>
          {#each library.albums as group (`${group.artist}/${group.album}`)}
            {@const key = `album:${group.artist}/${group.album}`}
            <Collapsible.Root
              open={searching || open[key]}
              onOpenChange={(value) => (open[key] = value)}
              class="group/collapsible"
            >
              <Sidebar.MenuItem>
                <Collapsible.Trigger>
                  {#snippet child({ props })}
                    <Sidebar.MenuButton {...props} class="h-14">
                      <Avatar.Root class="size-10 rounded-md after:rounded-md">
                        <Avatar.Image
                          src={albumArtworkUrl(group.artist, group.album)}
                          alt=""
                          class="rounded-md object-cover"
                        />
                        <Avatar.Fallback class="rounded-md"
                          ><DiscIcon class="size-5" /></Avatar.Fallback
                        >
                      </Avatar.Root>
                      <div class="min-w-0 flex-1 leading-tight">
                        <div class="truncate text-[15px]">{group.album}</div>
                        <div class="truncate text-[13px] text-muted-foreground">
                          {group.artist}
                        </div>
                      </div>
                      <ChevronRightIcon
                        class="ml-auto text-muted-foreground/60 transition-transform group-data-[state=open]/collapsible:rotate-90"
                      />
                    </Sidebar.MenuButton>
                  {/snippet}
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <Sidebar.MenuSub>
                    {#each group.songs as song (song.id)}
                      {@render songRow(song)}
                    {/each}
                  </Sidebar.MenuSub>
                </Collapsible.Content>
              </Sidebar.MenuItem>
            </Collapsible.Root>
          {:else}
            <p class="p-2 text-sm text-muted-foreground">No albums.</p>
          {/each}
        </Sidebar.Menu>
      </Sidebar.Group>
    {:else if ui.libraryView === 'songs'}
      <Sidebar.Group>
        <Sidebar.Menu>
          {#each library.songsByTitle as song (song.id)}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                isActive={library.selected?.id === song.id}
                onclick={() => (library.selected = song)}
                class="h-11 cursor-default"
              >
                <div class="min-w-0 flex-1 leading-tight">
                  <div class="truncate text-[15px]">{song.title}</div>
                  <div class="truncate text-[13px] text-muted-foreground">
                    {song.artist}{song.album ? ` · ${song.album}` : ''}
                  </div>
                </div>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.Group>
    {:else}
      <Sidebar.Group>
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
                    <Sidebar.MenuButton {...props} class="h-11 text-[15px]">
                      <Avatar.Root class="size-8">
                        <Avatar.Image
                          src={artistArtworkUrl(
                            group.artist,
                            group.albums.find((a) => a.album)?.album
                          )}
                          alt=""
                          class="object-cover"
                        />
                        <Avatar.Fallback><UserIcon class="size-4" /></Avatar.Fallback>
                      </Avatar.Root>
                      <span class="truncate">{group.artist}</span>
                      <ChevronRightIcon
                        class="ml-auto text-muted-foreground/60 transition-transform group-data-[state=open]/collapsible:rotate-90"
                      />
                    </Sidebar.MenuButton>
                  {/snippet}
                </Collapsible.Trigger>
                <Sidebar.MenuBadge
                  class="mr-6 font-normal text-muted-foreground peer-hover/menu-button:text-muted-foreground peer-data-[size=default]/menu-button:top-3 peer-data-active/menu-button:text-muted-foreground"
                  >{group.songCount}</Sidebar.MenuBadge
                >
                <Collapsible.Content>
                  <Sidebar.MenuSub>
                    {#each group.albums as album (album.album)}
                      {#if album.album}
                        <li
                          class="flex items-center gap-2.5 px-2 pt-3 pb-1 text-[13px] font-medium text-muted-foreground"
                        >
                          <Avatar.Root class="size-10 rounded-md after:rounded-md">
                            <Avatar.Image
                              src={albumArtworkUrl(group.artist, album.album)}
                              alt=""
                              class="rounded-md object-cover"
                            />
                            <Avatar.Fallback class="rounded-md"
                              ><DiscIcon class="size-5" /></Avatar.Fallback
                            >
                          </Avatar.Root>
                          <span class="line-clamp-2">{album.album}</span>
                        </li>
                      {/if}
                      {#each album.songs as song (song.id)}
                        {@render songRow(song)}
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
