<script lang="ts">
  import PauseIcon from '@lucide/svelte/icons/pause'
  import PlayIcon from '@lucide/svelte/icons/play'
  import RepeatIcon from '@lucide/svelte/icons/repeat'
  import SkipBackIcon from '@lucide/svelte/icons/skip-back'
  import TimerIcon from '@lucide/svelte/icons/timer'
  import TimerResetIcon from '@lucide/svelte/icons/timer-reset'

  import { Button } from '#lib/components/ui/button'
  import * as Kbd from '#lib/components/ui/kbd'
  import * as Select from '#lib/components/ui/select'
  import { Spinner } from '#lib/components/ui/spinner'
  import { Toggle } from '#lib/components/ui/toggle'
  import * as Tooltip from '#lib/components/ui/tooltip'
  import type { PlaybackState, ScorePlayer } from '#lib/render/types'
  import { ui } from '#lib/ui.svelte'
  import type { Snippet } from 'svelte'

  let {
    player,
    children
  }: {
    player: ScorePlayer | null
    /** Drawn between the play controls and the playback options (the song capsule). */
    children?: Snippet<[PlaybackState | null]>
  } = $props()

  let playback = $state<PlaybackState | null>(null)

  $effect(() => {
    // No player (no song open): forget the last one's state so nothing looks playable.
    if (!player) {
      playback = null
      return
    }
    return player.onPlaybackChange((state) => (playback = state))
  })

  // Push the current options to the player (and again whenever a new one appears).
  // Playback options are saved preferences (ui), so they survive reloads.
  $effect(() => player?.setSpeed(Number(ui.playbackSpeed)))
  $effect(() => player?.setLooping(ui.looping))
  $effect(() => player?.setMetronome(ui.metronome))
  $effect(() => player?.setCountIn(ui.countIn))

  const ready = $derived(playback?.ready ?? false)
  const toggles = [
    {
      label: 'Loop',
      icon: RepeatIcon,
      get: () => ui.looping,
      set: (v: boolean) => (ui.looping = v)
    },
    {
      label: 'Metronome',
      icon: TimerIcon,
      get: () => ui.metronome,
      set: (v: boolean) => (ui.metronome = v)
    },
    {
      label: 'Count-in',
      icon: TimerResetIcon,
      get: () => ui.countIn,
      set: (v: boolean) => (ui.countIn = v)
    }
  ]
  const speeds = ['0.25', '0.5', '0.75', '0.9', '1', '1.25', '1.5']

  function onkeydown(event: KeyboardEvent): void {
    if (event.code !== 'Space' || !ready) return
    const target = event.target as HTMLElement
    if (target.closest('input, textarea, select, [contenteditable], [role="combobox"]')) return
    event.preventDefault()
    player?.playPause()
  }
</script>

<svelte:window {onkeydown} />

<!-- Safari-style: play controls and options each in a pill, with the song capsule between. -->
<div class="toolbar-pill shrink-0 gap-0.5 px-0.5">
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          size="icon-sm"
          class="rounded-full"
          disabled={!ready}
          onclick={() => player?.stop()}
        >
          <SkipBackIcon />
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Back to start</Tooltip.Content>
  </Tooltip.Root>

  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          size="icon-sm"
          class="rounded-full"
          disabled={!ready}
          onclick={() => player?.playPause()}
        >
          {#if player && !ready}
            <Spinner />
          {:else if !player}
            <PlayIcon />
          {:else if playback?.playing}
            <PauseIcon />
          {:else}
            <PlayIcon />
          {/if}
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>
      {ready ? (playback?.playing ? 'Pause' : 'Play') : 'Loading sounds…'}
      <Kbd.Root>Space</Kbd.Root>
    </Tooltip.Content>
  </Tooltip.Root>
</div>

{@render children?.(playback)}

<div class="toolbar-pill shrink-0 gap-0.5 px-0.5">
  <Select.Root type="single" bind:value={ui.playbackSpeed}>
    <Select.Trigger
      size="sm"
      class="w-[4.5rem] rounded-full border-0 bg-transparent text-xs tabular-nums shadow-none hover:bg-muted dark:bg-transparent dark:hover:bg-muted"
      aria-label="Playback speed"
    >
      {Math.round(Number(ui.playbackSpeed) * 100)}%
    </Select.Trigger>
    <Select.Content>
      {#each speeds as s (s)}
        <Select.Item value={s} label={`${Math.round(Number(s) * 100)}%`} />
      {/each}
    </Select.Content>
  </Select.Root>

  {#each toggles as option (option.label)}
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Toggle
            {...props}
            size="sm"
            class="size-8 min-w-8 rounded-full px-0"
            pressed={option.get()}
            onPressedChange={option.set}
            aria-label={option.label}
          >
            <option.icon />
          </Toggle>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content>{option.label}</Tooltip.Content>
    </Tooltip.Root>
  {/each}
</div>
