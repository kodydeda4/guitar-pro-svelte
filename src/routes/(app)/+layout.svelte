<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'

  import AppRail from '#lib/components/app-rail.svelte'
  import Inspector from '#lib/components/inspector.svelte'
  import SongHeader from '#lib/components/song-header.svelte'
  import LibrarySidebar from '#lib/components/library-sidebar.svelte'
  import TitleBar from '#lib/components/title-bar.svelte'
  import * as Sidebar from '#lib/components/ui/sidebar'
  import { library } from '#lib/library/library.svelte'
  import { session } from '#lib/session.svelte'
  import { ui } from '#lib/ui.svelte'

  let { children } = $props()

  library.load()

  const showLibrary = $derived(ui.libraryOpen && page.route.id === '/(app)')
  const showInspector = $derived(
    ui.inspectorOpen && page.route.id === '/(app)' && !!library.selected && !!session.score
  )

  // App shortcuts (⌘ on macOS, Ctrl on Windows/Linux):
  //   ⌘,   open Settings
  //   ⌘⇧Y  expand/collapse the tracks panel
  function onkeydown(event: KeyboardEvent): void {
    const modifier = window.electron?.process.platform === 'darwin' ? event.metaKey : event.ctrlKey
    if (!modifier) return
    if (event.key === ',') {
      event.preventDefault()
      goto('#/settings')
    } else if (event.shiftKey && event.code === 'KeyY') {
      event.preventDefault()
      ui.tracksOpen = !ui.tracksOpen
    }
  }
</script>

<svelte:window {onkeydown} />

<!-- Slack-style frame: title bar across the top, rail on the left, and the library panel plus
     page content in one rounded card. -->
<div
  class="flex h-svh flex-col bg-frame"
  style="--library-width: 20rem; --inspector-width: 18rem"
>
  <TitleBar libraryShown={showLibrary} inspectorShown={showInspector}>
    {#if page.route.id === '/(app)' && library.selected}
      <SongHeader song={library.selected} />
    {/if}
  </TitleBar>
  <div class="flex min-h-0 flex-1">
    <AppRail />
    <div class="min-w-0 flex-1 pr-2 pb-2">
      <!-- The Provider supplies context for the sidebar menu components; the panel itself is a
           plain (non-fixed) sidebar so it can live inside the card. -->
      <Sidebar.Provider
        class="h-full min-h-0 overflow-hidden rounded-lg border bg-background shadow-sm"
        style="--sidebar-width: var(--library-width)"
      >
        {#if showLibrary}
          <LibrarySidebar {library} />
        {/if}
        <div class="flex min-w-0 flex-1 flex-col">
          {@render children()}
        </div>
        {#if showInspector && session.score}
          <Inspector score={session.score} />
        {/if}
      </Sidebar.Provider>
    </div>
  </div>
</div>
