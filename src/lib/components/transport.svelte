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

  let { player, barCount }: { player: ScorePlayer | null; barCount: number } = $props()

  let playback = $state<PlaybackState | null>(null)
  let speed = $state('1')
  let looping = $state(false)
  let metronome = $state(false)
  let countIn = $state(false)

  $effect(() => player?.onPlaybackChange((state) => (playback = state)))

  // Push the current options to the player (and again whenever a new one appears).
  $effect(() => player?.setSpeed(Number(speed)))
  $effect(() => player?.setLooping(looping))
  $effect(() => player?.setMetronome(metronome))
  $effect(() => player?.setCountIn(countIn))

  const ready = $derived(playback?.ready ?? false)
  const speeds = ['0.25', '0.5', '0.75', '0.9', '1', '1.25', '1.5']

  function formatTime(ms: number): string {
    const total = Math.floor(ms / 1000)
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
  }

  function onkeydown(event: KeyboardEvent): void {
    if (event.code !== 'Space' || !ready) return
    const target = event.target as HTMLElement
    if (target.closest('input, textarea, select, [contenteditable], [role="combobox"]')) return
    event.preventDefault()
    player?.playPause()
  }
</script>

<svelte:window {onkeydown} />

<div class="flex items-center gap-1">
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="ghost" size="icon" disabled={!ready} onclick={() => player?.stop()}>
          <SkipBackIcon />
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Back to start</Tooltip.Content>
  </Tooltip.Root>

  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button {...props} size="icon" disabled={!ready} onclick={() => player?.playPause()}>
          {#if !ready}
            <Spinner />
          {:else if playback?.playing}
            <PauseIcon />
          {:else}
            <PlayIcon />
          {/if}
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>
      {ready ? (playback?.playing ? 'Pause' : 'Play') : 'Loading sounds…'} <Kbd.Root>Space</Kbd.Root>
    </Tooltip.Content>
  </Tooltip.Root>

  <!-- LCD-style readout: bar and time -->
  <div
    class="mx-1 flex h-9 items-center gap-3 rounded-md border bg-muted/50 px-3 font-mono text-xs tabular-nums"
  >
    <span>
      <span class="text-muted-foreground">Bar</span>
      {playback?.currentBar ?? 1}/{barCount}
    </span>
    <span>
      {formatTime(playback?.currentTime ?? 0)}<span class="text-muted-foreground">
        / {formatTime(playback?.endTime ?? 0)}</span
      >
    </span>
  </div>

  <Select.Root type="single" bind:value={speed}>
    <Select.Trigger size="sm" class="w-20 font-mono text-xs" aria-label="Playback speed">
      {Math.round(Number(speed) * 100)}%
    </Select.Trigger>
    <Select.Content>
      {#each speeds as s (s)}
        <Select.Item value={s} label={`${Math.round(Number(s) * 100)}%`} />
      {/each}
    </Select.Content>
  </Select.Root>

  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Toggle {...props} size="sm" bind:pressed={looping} aria-label="Loop"><RepeatIcon /></Toggle>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Loop</Tooltip.Content>
  </Tooltip.Root>

  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Toggle {...props} size="sm" bind:pressed={metronome} aria-label="Metronome"><TimerIcon /></Toggle>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Metronome</Tooltip.Content>
  </Tooltip.Root>

  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Toggle {...props} size="sm" bind:pressed={countIn} aria-label="Count-in"><TimerResetIcon /></Toggle>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Count-in</Tooltip.Content>
  </Tooltip.Root>
</div>
