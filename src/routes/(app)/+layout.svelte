<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'

  import AppRail from '#lib/components/app-rail.svelte'
  import LibrarySidebar from '#lib/components/library-sidebar.svelte'
  import TitleBar from '#lib/components/title-bar.svelte'
  import * as Sidebar from '#lib/components/ui/sidebar'
  import { library } from '#lib/library/library.svelte'
  import { ui } from '#lib/ui.svelte'

  let { children } = $props()

  library.load()

  const showLibrary = $derived(ui.libraryOpen && page.route.id === '/(app)')

  // ⌘, (Ctrl+, on Windows/Linux) opens Settings, like other desktop apps.
  function onkeydown(event: KeyboardEvent): void {
    const modifier = window.electron?.process.platform === 'darwin' ? event.metaKey : event.ctrlKey
    if (modifier && event.key === ',') {
      event.preventDefault()
      goto('#/settings')
    }
  }
</script>

<svelte:window {onkeydown} />

<!-- Slack-style frame: title bar across the top, rail on the left, and the library panel plus
     page content in one rounded card. -->
<div class="flex h-svh flex-col bg-frame">
  <TitleBar />
  <div class="flex min-h-0 flex-1">
    <AppRail />
    <div class="min-w-0 flex-1 pr-2 pb-2">
      <!-- The Provider supplies context for the sidebar menu components; the panel itself is a
           plain (non-fixed) sidebar so it can live inside the card. -->
      <Sidebar.Provider
        class="h-full min-h-0 overflow-hidden rounded-lg border bg-background shadow-sm"
        style="--sidebar-width: 20rem"
      >
        {#if showLibrary}
          <LibrarySidebar {library} />
        {/if}
        <div class="flex min-w-0 flex-1 flex-col">
          {@render children()}
        </div>
      </Sidebar.Provider>
    </div>
  </div>
</div>
