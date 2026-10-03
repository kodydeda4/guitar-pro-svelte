<script lang="ts">
  import Fretboard from '#lib/components/fretboard.svelte'
  const tuning = [40, 45, 50, 55, 59, 64]
  const markers = [
    ...[0, 3, 5, 7, 10, 12, 15].flatMap((fret) =>
      [0, 1, 2].map((string) => ({ string, fret, label: 'A', color: '#94a3b8' }))
    ),
    { string: 4, fret: 5, label: 'E', active: true },
    { string: 5, fret: 8, label: 'C', active: true },
    { string: 3, fret: 7, label: 'D', active: true }
  ]
</script>

<div style="height: 240px"><Fretboard {tuning} {markers} /></div>
