<script lang="ts">
  import { AlphaTabScore } from '#lib/render/alphatab/alphatab-score'
  import type { Notation, ScoreInfo, ScorePlayer } from '#lib/render/types'

  let {
    data,
    tracks = [0],
    notation = [],
    scrollElement,
    player = $bindable(null),
    onloaded,
    onerror
  }: {
    /** Raw Guitar Pro file bytes; changing it loads a new score. */
    data: Uint8Array | null
    /** Indices of the tracks to draw. */
    tracks?: number[]
    /** How each track (by index) is drawn. */
    notation?: Notation[]
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
  /** Which tracks are currently drawn; loading a score always draws track 0. */
  let shown = '0'

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
    shown = '0'
    score.load(data).then(
      (info) => onloaded?.(info),
      (error) => onerror?.(error instanceof Error ? error : new Error(String(error)))
    )
  })

  $effect(() => {
    const key = tracks.join(',')
    if (!score || !loadedData || key === shown) return
    shown = key
    score.showTracks([...tracks])
  })

  $effect(() => {
    const current = $state.snapshot(notation)
    if (!score || !loadedData) return
    score.setNotation(current)
  })
</script>

<!-- alphaTab draws black notation, so it sits on a white "page" like Guitar Pro. -->
<div class="mx-auto w-full max-w-5xl rounded-sm bg-white text-black shadow-lg">
  <div bind:this={element}></div>
</div>
