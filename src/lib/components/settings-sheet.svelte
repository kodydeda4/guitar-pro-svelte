<script lang="ts">
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open'
  import MonitorIcon from '@lucide/svelte/icons/monitor'
  import MoonIcon from '@lucide/svelte/icons/moon'
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw'
  import SunIcon from '@lucide/svelte/icons/sun'
  import { setMode, userPrefersMode } from 'mode-watcher'

  import FretLabelsToggle from '#lib/components/fret-labels-toggle.svelte'
  import { Button } from '#lib/components/ui/button'
  import * as Dialog from '#lib/components/ui/dialog'
  import * as ToggleGroup from '#lib/components/ui/toggle-group'
  import { library } from '#lib/library/library.svelte'
  import { ui } from '#lib/ui.svelte'

  const versions = window.electron?.process.versions
</script>

{#snippet section(title: string)}
  <h3 class="mb-1.5 px-1 text-xs font-semibold text-muted-foreground">{title}</h3>
{/snippet}

<!-- macOS-style sheet: drops down from under the title bar over the app, with grouped rows. -->
<Dialog.Root bind:open={ui.settingsOpen}>
  <Dialog.Content
    class="top-14 flex max-h-[calc(100svh-5rem)] translate-y-0 flex-col gap-0 overflow-hidden p-0 shadow-2xl data-closed:slide-out-to-top-6 data-closed:zoom-out-100 data-open:slide-in-from-top-6 data-open:zoom-in-100 sm:max-w-xl"
  >
    <Dialog.Header class="border-b px-5 py-4">
      <Dialog.Title>Settings</Dialog.Title>
    </Dialog.Header>

    <div class="flex min-h-0 flex-col gap-5 overflow-y-auto px-5 py-5">
      <section>
        {@render section('Library')}
        <div class="divide-y rounded-lg border bg-muted/30">
          <div class="flex flex-col gap-2 px-4 py-3">
            <div class="flex items-center justify-between gap-4">
              <span class="font-medium">Tabs folder</span>
              {#if library.root}
                <span class="text-xs text-muted-foreground tabular-nums">
                  {library.songs.length.toLocaleString()} songs · {library.artists.length} artists
                </span>
              {/if}
            </div>
            <div
              class="truncate rounded-md border bg-background px-2.5 py-1.5 font-mono text-xs text-muted-foreground"
              title={library.root}
            >
              {library.root ?? 'No folder chosen'}
            </div>
            <p class="text-xs text-muted-foreground">
              Every Guitar Pro file in this folder and its subfolders shows up in your library.
            </p>
          </div>
          <div class="flex justify-end gap-2 px-4 py-2.5">
            {#if library.root}
              <Button
                variant="outline"
                size="sm"
                onclick={() => library.load()}
                disabled={library.loading}
              >
                <RefreshCwIcon class={library.loading ? 'animate-spin' : ''} /> Rescan
              </Button>
            {/if}
            <Button size="sm" onclick={() => library.chooseFolder()} disabled={!library.available}>
              <FolderOpenIcon />
              {library.root ? 'Change folder…' : 'Choose folder…'}
            </Button>
          </div>
        </div>
      </section>

      <section>
        {@render section('Appearance')}
        <div class="rounded-lg border bg-muted/30">
          <div class="flex items-center justify-between gap-4 px-4 py-2.5">
            <span class="font-medium">Theme</span>
            <ToggleGroup.Root
              type="single"
              variant="outline"
              size="sm"
              value={userPrefersMode.current}
              onValueChange={(value) => value && setMode(value as 'light' | 'dark' | 'system')}
            >
              <ToggleGroup.Item value="light"><SunIcon /> Light</ToggleGroup.Item>
              <ToggleGroup.Item value="dark"><MoonIcon /> Dark</ToggleGroup.Item>
              <ToggleGroup.Item value="system"><MonitorIcon /> System</ToggleGroup.Item>
            </ToggleGroup.Root>
          </div>
        </div>
      </section>

      <section>
        {@render section('Fretboard')}
        <div class="rounded-lg border bg-muted/30">
          <div class="flex items-center justify-between gap-4 px-4 py-2.5">
            <div class="min-w-0">
              <span class="font-medium">Show notes as</span>
              <p class="text-xs text-muted-foreground">
                Intervals are counted from the root of the scale picked in Fretboard.
              </p>
            </div>
            <FretLabelsToggle class="shrink-0" />
          </div>
        </div>
      </section>

      {#if versions}
        <section>
          {@render section('About')}
          <div class="divide-y rounded-lg border bg-muted/30">
            <div class="flex items-center justify-between px-4 py-2.5">
              <span class="font-medium">Kody's Guitar Pro</span>
            </div>
            {#each [['Electron', versions.electron], ['Chromium', versions.chrome], ['Node', versions.node]] as [name, version] (name)}
              <div class="flex items-center justify-between px-4 py-2">
                <span class="text-muted-foreground">{name}</span>
                <span class="font-mono text-xs">{version}</span>
              </div>
            {/each}
          </div>
        </section>
      {/if}
    </div>

    <Dialog.Footer class="border-t px-5 py-3">
      <Button onclick={() => (ui.settingsOpen = false)}>Done</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
