<script lang="ts">
  import { page } from '$app/state'
  import PanelLeftIcon from '@lucide/svelte/icons/panel-left'
  import PanelRightIcon from '@lucide/svelte/icons/panel-right'
  import type { Snippet } from 'svelte'

  import { Button } from '#lib/components/ui/button'
  import { ui } from '#lib/ui.svelte'

  let {
    sidebarShown,
    inspectorShown,
    children
  }: {
    /** Whether the sidebar is open, so the middle section starts after it. */
    sidebarShown: boolean
    /** Whether the inspector is open, so the middle section ends before it. */
    inspectorShown: boolean
    /** Shown above the page content (the score), between the library and the inspector. */
    children?: Snippet
  } = $props()

  const onLibrary = $derived(page.route.id === '/(app)')
</script>

<!-- The window's title bar: the native one is hidden (see src/main/index.ts), so this strip is
     draggable and leaves room for the traffic lights (macOS) or window controls (Windows/Linux).
     Its side sections line up with the rail + sidebar and the inspector below (widths come from
     the CSS variables set in the app layout), so the middle sits right above the page content. -->
<header class="titlebar-drag flex h-11 shrink-0 items-center">
  <div
    class="flex min-w-[4.5rem] shrink-0 items-center px-2 mac:pl-[84px]"
    style:width={sidebarShown ? 'calc(4.5rem + var(--library-width))' : undefined}
  >
    <Button
      variant="ghost"
      size="icon"
      class="toolbar-pill w-12 rounded-full"
      aria-label="Toggle sidebar"
      disabled={!onLibrary}
      onclick={() => (ui.sidebarOpen = !ui.sidebarOpen)}
    >
      <PanelLeftIcon />
    </Button>
  </div>

  <div class="h-full min-w-0 flex-1">
    {@render children?.()}
  </div>

  <div
    class="flex shrink-0 items-center justify-end px-2 win:pr-36"
    style:width={inspectorShown ? 'calc(var(--inspector-width) + 0.5rem)' : undefined}
  >
    <Button
      variant="ghost"
      size="icon"
      class="toolbar-pill w-12 rounded-full"
      aria-label="Toggle inspector"
      disabled={!onLibrary}
      onclick={() => (ui.inspectorOpen = !ui.inspectorOpen)}
    >
      <PanelRightIcon />
    </Button>
  </div>
</header>
