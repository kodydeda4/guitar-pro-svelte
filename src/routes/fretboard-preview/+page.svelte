<script lang="ts">
  // TEMPORARY design preview — delete before committing.
  import Fretboard, { type FretMarker } from '#lib/components/fretboard.svelte'
  const guitar = [40, 45, 50, 55, 59, 64]
  const bass = [28, 33, 38, 43]
  // A minor pentatonic, frets 5–8.
  const shape: [number, number][] = [[0,5],[0,8],[1,5],[1,7],[2,5],[2,7],[3,5],[3,7],[4,5],[4,8],[5,5],[5,8]]
  const markers: FretMarker[] = shape.map(([string, fret]) => ({ string, fret, label: ['A','C','D','E','G'][[0,3,5,7,10].indexOf(((guitar[string]+fret-57)%12+12)%12)] ?? '' }))
  markers[0].color = '#e5484d'
</script>

<div class="flex min-h-svh flex-col gap-6 bg-background p-6">
  <div class="rounded-lg border bg-background" style="height: 260px"><Fretboard tuning={guitar} {markers} /></div>
  <div class="rounded-lg border bg-background" style="height: 200px"><Fretboard tuning={bass} /></div>
</div>
