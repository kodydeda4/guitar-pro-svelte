<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'

  import AppRail from '#lib/components/app-rail.svelte'
  import Inspector from '#lib/components/inspector.svelte'
  import SettingsSheet from '#lib/components/settings-sheet.svelte'
  import SongHeader from '#lib/components/song-header.svelte'
  import LibrarySidebar from '#lib/components/library-sidebar.svelte'
  import TracksSidebar from '#lib/components/tracks-sidebar.svelte'
  import TitleBar from '#lib/components/title-bar.svelte'
  import * as Sidebar from '#lib/components/ui/sidebar'
  import { library } from '#lib/library/library.svelte'
  import { session } from '#lib/session.svelte'
  import { ui } from '#lib/ui.svelte'

  let { children } = $props()

  library.load()

  const showSidebar = $derived(ui.sidebarOpen && page.route.id === '/(app)')
  const showInspector = $derived(
    ui.inspectorOpen && page.route.id === '/(app)' && !!library.selected && !!session.score
  )

  // App shortcuts (⌘ on macOS, Ctrl on Windows/Linux):
  //   ⌘1   show the Library in the sidebar
  //   ⌘2   show the open song's Tracks in the sidebar
  //   ⌘0   show/hide the sidebar
  //   ⌘⇧0  show/hide the inspector
  //   ⌘,   open Settings (a sheet); in the desktop app the menu's Settings… item handles it
  //   ⌘⇧Y  expand/collapse the tracks panel
  // Settings… in the app menu (src/main/index.ts).
  $effect(() => window.api?.onOpenSettings(() => (ui.settingsOpen = true)))

  function onkeydown(event: KeyboardEvent): void {
    const modifier = window.electron?.process.platform === 'darwin' ? event.metaKey : event.ctrlKey
    if (!modifier) return
    if (event.code === 'Digit0' && !event.altKey) {
      event.preventDefault()
      if (event.shiftKey) ui.inspectorOpen = !ui.inspectorOpen
      else ui.sidebarOpen = !ui.sidebarOpen
    } else if ((event.key === '1' || event.key === '2') && !event.shiftKey && !event.altKey) {
      event.preventDefault()
      ui.sidebarView = event.key === '1' ? 'library' : 'tracks'
      ui.sidebarOpen = true
      ui.settingsOpen = false
      goto('#/')
    } else if (event.key === ',') {
      event.preventDefault()
      ui.settingsOpen = true
    } else if (event.shiftKey && event.code === 'KeyY') {
      event.preventDefault()
      ui.tracksOpen = !ui.tracksOpen
    }
  }
</script>

<svelte:window {onkeydown} />
<SettingsSheet />

<!-- Slack-style frame: title bar across the top, rail on the left, and the library panel plus
     page content in one rounded card. -->
<div class="flex h-svh flex-col bg-frame" style="--library-width: 20rem; --inspector-width: 18rem">
  <TitleBar sidebarShown={showSidebar} inspectorShown={showInspector}>
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
        {#if showSidebar}
          {#if ui.sidebarView === 'tracks'}
            <TracksSidebar />
          {:else}
            <LibrarySidebar {library} />
          {/if}
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
