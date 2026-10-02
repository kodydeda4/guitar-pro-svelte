<script lang="ts">
  import { AlphaTabScore } from '#lib/render/alphatab/alphatab-score'
  import type { ScoreInfo, ScorePlayer } from '#lib/render/types'

  let {
    data,
    track = 0,
    scrollElement,
    player = $bindable(null),
    onloaded,
    onerror
  }: {
    /** Raw Guitar Pro file bytes; changing it loads a new score. */
    data: Uint8Array | null
    track?: number
    /** The scroll container that playback keeps the cursor visible in. */
    scrollElement: HTMLElement
    /** Exposes playback controls for the loaded score. */
    player?: ScorePlayer | null
    onloaded?: (info: ScoreInfo) => void
    onerror?: (error: Error) => void
  } = $props()

  let element: HTMLDivElement
  let score: AlphaTabScore | null = null
  let loadedData: Uint8Array | null = null

  $effect(() => {
    score = new AlphaTabScore(element, scrollElement)
    player = score
    return () => {
      score?.destroy()
      score = null
      player = null
      loadedData = null
    }
  })

  $effect(() => {
    if (!score || !data || data === loadedData) return
    loadedData = data
    score.load(data).then(
      (info) => onloaded?.(info),
      (error) => onerror?.(error instanceof Error ? error : new Error(String(error)))
    )
  })

  $effect(() => {
    if (score && loadedData) score.showTrack(track)
  })
</script>

<!-- alphaTab draws black notation, so it sits on a white "page" like Guitar Pro. -->
<div class="mx-auto w-full max-w-5xl rounded-sm bg-white text-black shadow-lg">
  <div bind:this={element}></div>
</div>
