<script lang="ts">
  import FolderOpenIcon from '@lucide/svelte/icons/folder-open'
  import MonitorIcon from '@lucide/svelte/icons/monitor'
  import MoonIcon from '@lucide/svelte/icons/moon'
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw'
  import SunIcon from '@lucide/svelte/icons/sun'
  import { setMode, userPrefersMode } from 'mode-watcher'

  import { Button } from '#lib/components/ui/button'
  import * as Card from '#lib/components/ui/card'
  import * as Field from '#lib/components/ui/field'
  import * as ToggleGroup from '#lib/components/ui/toggle-group'
  import { library } from '#lib/library/library.svelte'

  const versions = window.electron?.process.versions
</script>

<header class="flex h-14 shrink-0 items-center border-b bg-background px-6">
  <h1 class="text-sm font-semibold">Settings</h1>
</header>

<main class="flex-1 overflow-auto bg-muted/40 p-6">
  <div class="mx-auto grid max-w-2xl gap-6">
    <Card.Root>
      <Card.Header>
        <Card.Title>Library</Card.Title>
        <Card.Description
          >The folder your Guitar Pro files are loaded from, including subfolders.</Card.Description
        >
      </Card.Header>
      <Card.Content>
        <Field.Group>
          <Field.Field>
            <Field.Label>Tabs folder</Field.Label>
            <div
              class="truncate rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs"
              title={library.root}
            >
              {library.root ?? 'No folder chosen'}
            </div>
            {#if library.root}
              <Field.Description>
                {library.songs.length} songs from {library.artists.length} artists.
              </Field.Description>
            {/if}
          </Field.Field>
          <div class="flex gap-2">
            <Button onclick={() => library.chooseFolder()} disabled={!library.available}>
              <FolderOpenIcon />
              {library.root ? 'Change folder…' : 'Choose folder…'}
            </Button>
            {#if library.root}
              <Button variant="outline" onclick={() => library.load()} disabled={library.loading}>
                <RefreshCwIcon class={library.loading ? 'animate-spin' : ''} /> Rescan
              </Button>
            {/if}
          </div>
        </Field.Group>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Appearance</Card.Title>
      </Card.Header>
      <Card.Content>
        <Field.Field>
          <Field.Label>Theme</Field.Label>
          <ToggleGroup.Root
            type="single"
            variant="outline"
            value={userPrefersMode.current}
            onValueChange={(value) => value && setMode(value as 'light' | 'dark' | 'system')}
            class="w-fit"
          >
            <ToggleGroup.Item value="light"><SunIcon /> Light</ToggleGroup.Item>
            <ToggleGroup.Item value="dark"><MoonIcon /> Dark</ToggleGroup.Item>
            <ToggleGroup.Item value="system"><MonitorIcon /> System</ToggleGroup.Item>
          </ToggleGroup.Root>
        </Field.Field>
      </Card.Content>
    </Card.Root>

    {#if versions}
      <Card.Root>
        <Card.Header>
          <Card.Title>About</Card.Title>
          <Card.Description>Kody's Guitar Pro</Card.Description>
        </Card.Header>
        <Card.Content>
          <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
            <dt class="text-muted-foreground">Electron</dt>
            <dd class="font-mono">{versions.electron}</dd>
            <dt class="text-muted-foreground">Chromium</dt>
            <dd class="font-mono">{versions.chrome}</dd>
            <dt class="text-muted-foreground">Node</dt>
            <dd class="font-mono">{versions.node}</dd>
          </dl>
        </Card.Content>
      </Card.Root>
    {/if}
  </div>
</main>
