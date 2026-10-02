<script lang="ts">
  import { page } from '$app/state'
  import PanelLeftIcon from '@lucide/svelte/icons/panel-left'

  import { Button } from '#lib/components/ui/button'
  import { ui } from '#lib/ui.svelte'

  const onLibrary = $derived(page.route.id === '/(app)')
</script>

<!-- The window's title bar: the native one is hidden (see src/main/index.ts), so this strip is
     draggable and leaves room for the traffic lights (macOS) or window controls (Windows/Linux). -->
<header class="titlebar-drag flex h-11 shrink-0 items-center px-2 mac:pl-[84px] win:pr-36">
  <Button
    variant="ghost"
    size="icon-sm"
    aria-label="Toggle library"
    disabled={!onLibrary}
    onclick={() => (ui.libraryOpen = !ui.libraryOpen)}
  >
    <PanelLeftIcon />
  </Button>
</header>
