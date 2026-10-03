<script lang="ts">
  import LibraryIcon from '@lucide/svelte/icons/library'
  import ListMusicIcon from '@lucide/svelte/icons/list-music'
  import MoonIcon from '@lucide/svelte/icons/moon'
  import SettingsIcon from '@lucide/svelte/icons/settings'
  import SunIcon from '@lucide/svelte/icons/sun'
  import { mode, toggleMode } from 'mode-watcher'

  import * as Tooltip from '#lib/components/ui/tooltip'
  import { ui } from '#lib/ui.svelte'
  import { cn } from '#lib/utils'

  const itemClass =
    'group flex w-full flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground'

  /** Shows `view` in the sidebar; clicking the one already shown hides/shows the sidebar. */
  function showSidebar(view: typeof ui.sidebarView): void {
    if (ui.sidebarView === view) ui.sidebarOpen = !ui.sidebarOpen
    else {
      ui.sidebarView = view
      ui.sidebarOpen = true
    }
  }

  const items = $derived([
    {
      label: 'Library',
      href: '#/',
      icon: LibraryIcon,
      active: ui.sidebarView === 'library' && !ui.settingsOpen,
      onclick: () => showSidebar('library')
    },
    {
      label: 'Tracks',
      href: '#/',
      icon: ListMusicIcon,
      active: ui.sidebarView === 'tracks' && !ui.settingsOpen,
      onclick: () => showSidebar('tracks')
    },
    {
      label: 'Settings',
      // Settings is a sheet over the app, not a page.
      href: undefined,
      icon: SettingsIcon,
      active: ui.settingsOpen,
      onclick: () => (ui.settingsOpen = true)
    }
  ])
</script>

<!-- Slack-style navigation rail: icon buttons with labels underneath. -->
<nav class="flex w-[4.5rem] shrink-0 flex-col items-center gap-3 pt-1 pb-3">
  {#each items as item (item.label)}
    {#snippet content()}
      <span
        class={cn(
          'flex size-9 items-center justify-center rounded-lg transition-colors group-hover:bg-foreground/10 [&_svg]:size-5',
          item.active && 'bg-foreground/15 text-foreground'
        )}
      >
        <item.icon />
      </span>
      <span class={item.active ? 'text-foreground' : ''}>{item.label}</span>
    {/snippet}
    {#if item.href}
      <a
        href={item.href}
        onclick={item.onclick}
        class={itemClass}
        aria-current={item.active ? 'page' : undefined}
      >
        {@render content()}
      </a>
    {:else}
      <button type="button" onclick={item.onclick} class={itemClass} aria-pressed={item.active}>
        {@render content()}
      </button>
    {/if}
  {/each}

  <div class="flex-1"></div>

  <Tooltip.Root>
    <Tooltip.Trigger
      onclick={toggleMode}
      aria-label="Toggle theme"
      class="flex size-9 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground transition-colors hover:bg-foreground/15 hover:text-foreground [&_svg]:size-4"
    >
      {#if mode.current === 'dark'}<SunIcon />{:else}<MoonIcon />{/if}
    </Tooltip.Trigger>
    <Tooltip.Content side="right"
      >{mode.current === 'dark' ? 'Light mode' : 'Dark mode'}</Tooltip.Content
    >
  </Tooltip.Root>
</nav>
