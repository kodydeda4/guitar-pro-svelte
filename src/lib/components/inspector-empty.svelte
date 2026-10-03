<script lang="ts">
  import Music4Icon from '@lucide/svelte/icons/music-4'

  import * as Tabs from '#lib/components/ui/tabs'
  import { ui } from '#lib/ui.svelte'
</script>

<!-- The inspector while no song is open: the same Song | Track tabs, with nothing to show yet. -->
<aside
  class="flex w-(--inspector-width) shrink-0 flex-col border-l bg-sidebar text-sidebar-foreground"
>
  <Tabs.Root bind:value={ui.inspectorTab} class="min-h-0 flex-1 gap-0">
    <div class="border-b p-3">
      <Tabs.List class="w-full">
        <Tabs.Trigger value="song">Song</Tabs.Trigger>
        <Tabs.Trigger value="track">Track</Tabs.Trigger>
      </Tabs.List>
    </div>
    <div class="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <Music4Icon class="size-6 text-muted-foreground/60" />
      <p class="text-sm font-medium">No song open</p>
      <p class="text-xs text-muted-foreground">
        {ui.inspectorTab === 'song'
          ? 'Pick a song from the library to see its details.'
          : 'Pick a song from the library to see its tracks.'}
      </p>
    </div>
  </Tabs.Root>
</aside>
