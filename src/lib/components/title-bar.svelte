<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left'
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right'
  import PanelLeftIcon from '@lucide/svelte/icons/panel-left'
  import SearchIcon from '@lucide/svelte/icons/search'

  import { Button } from '#lib/components/ui/button'
  import * as InputGroup from '#lib/components/ui/input-group'
  import { library } from '#lib/library/library.svelte'
  import { ui } from '#lib/ui.svelte'

  const onLibrary = $derived(page.route.id === '/(app)')

  // Searching always happens in the library panel, so bring it into view.
  function oninput(): void {
    ui.libraryOpen = true
    if (!onLibrary) goto('#/')
  }
</script>

<!-- The window's title bar: the native one is hidden (see src/main/index.ts), so this strip is
     draggable and leaves room for the traffic lights (macOS) or window controls (Windows/Linux). -->
<header
  class="titlebar-drag grid h-11 shrink-0 grid-cols-[1fr_minmax(0,40rem)_1fr] items-center gap-3 px-2 mac:pl-[84px] win:pr-36"
>
  <div class="flex items-center gap-0.5">
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle library"
      disabled={!onLibrary}
      onclick={() => (ui.libraryOpen = !ui.libraryOpen)}
    >
      <PanelLeftIcon />
    </Button>
    <Button variant="ghost" size="icon-sm" aria-label="Back" onclick={() => history.back()}>
      <ArrowLeftIcon />
    </Button>
    <Button variant="ghost" size="icon-sm" aria-label="Forward" onclick={() => history.forward()}>
      <ArrowRightIcon />
    </Button>
  </div>

  <InputGroup.Root class="h-8 bg-background/60">
    <InputGroup.Addon><SearchIcon /></InputGroup.Addon>
    <InputGroup.Input
      placeholder={library.root
        ? `Search ${library.songs.length} songs, artists, albums…`
        : 'Search'}
      bind:value={library.query}
      {oninput}
      disabled={!library.root}
    />
  </InputGroup.Root>

  <div></div>
</header>
