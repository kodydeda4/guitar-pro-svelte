<script lang="ts">
  let {
    value,
    onchange,
    label = 'Pan',
    size = 22
  }: {
    /** -1 (hard left) … 0 (center) … 1 (hard right). */
    value: number
    onchange: (value: number) => void
    label?: string
    /** Diameter in px. */
    size?: number
  } = $props()

  /** The knob turns 135° either way from straight up. */
  const SWEEP = 135
  const C = $derived(size / 2)
  const R = $derived(size / 2 - 2)

  const clamp = (v: number): number => Math.min(1, Math.max(-1, v))
  const point = (degrees: number, radius = R): [number, number] => {
    const radians = ((degrees - 90) * Math.PI) / 180
    return [C + radius * Math.cos(radians), C + radius * Math.sin(radians)]
  }
  /** SVG arc from `from`° to `to`° (0° = up, clockwise). */
  function arc(from: number, to: number): string {
    const [x1, y1] = point(from)
    const [x2, y2] = point(to)
    const large = Math.abs(to - from) > 180 ? 1 : 0
    const sweep = to > from ? 1 : 0
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} ${sweep} ${x2} ${y2}`
  }

  const angle = $derived(clamp(value) * SWEEP)
  const pointer = $derived(point(angle, R - size / 5))
  const text = $derived(
    Math.abs(value) < 0.02
      ? 'Center'
      : `${value < 0 ? 'Left' : 'Right'} ${Math.round(Math.abs(value) * 64)}`
  )

  // Drag up/right to turn clockwise, like Logic's knobs; 150px of drag covers the full range.
  function onpointerdown(event: PointerEvent): void {
    event.preventDefault()
    const knob = event.currentTarget as HTMLElement
    knob.setPointerCapture(event.pointerId)
    knob.focus()
    const startY = event.clientY
    const startX = event.clientX
    const start = value
    const onMove = (e: PointerEvent): void => {
      const delta = (startY - e.clientY + (e.clientX - startX)) / 75
      onchange(clamp(Math.round((start + delta) * 64) / 64))
    }
    const onUp = (): void => {
      knob.removeEventListener('pointermove', onMove)
      knob.removeEventListener('pointerup', onUp)
    }
    knob.addEventListener('pointermove', onMove)
    knob.addEventListener('pointerup', onUp)
  }

  function onkeydown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 16 / 64 : 4 / 64
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') onchange(clamp(value + step))
    else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') onchange(clamp(value - step))
    else if (event.key === 'Home') onchange(-1)
    else if (event.key === 'End') onchange(1)
    else return
    event.preventDefault()
  }
</script>

<!-- Logic-style pan knob: an arc grows from the top center toward the side it's panned to.
     Drag to turn, double-click to center. -->
<div
  role="slider"
  tabindex="0"
  aria-label={label}
  aria-valuemin={-64}
  aria-valuemax={64}
  aria-valuenow={Math.round(value * 64)}
  aria-valuetext={text}
  title="{label}: {text} (double-click to center)"
  class="shrink-0 cursor-ns-resize touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
  {onpointerdown}
  ondblclick={() => onchange(0)}
  {onkeydown}
>
  <svg width={size} height={size} viewBox="0 0 {size} {size}" aria-hidden="true">
    <path d={arc(-SWEEP, SWEEP)} class="track" />
    {#if Math.abs(angle) > 0.5}
      <path d={angle > 0 ? arc(0, angle) : arc(angle, 0)} class="level" />
    {/if}
    <circle cx={C} cy={C} r={R - size / 9} class="body" />
    <line x1={C} y1={C} x2={pointer[0]} y2={pointer[1]} class="pointer" />
  </svg>
</div>

<style>
  path {
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
  }
  .track {
    stroke: color-mix(in oklab, var(--foreground) 15%, transparent);
  }
  .level {
    stroke: #34c759;
  }
  .body {
    fill: color-mix(in oklab, var(--foreground) 30%, var(--sidebar));
    stroke: rgb(0 0 0 / 0.25);
    stroke-width: 0.75;
  }
  .pointer {
    stroke: var(--background);
    stroke-width: 1.75;
    stroke-linecap: round;
  }
</style>
