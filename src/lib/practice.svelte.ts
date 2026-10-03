import { library } from '#lib/library/library.svelte'
import { session } from '#lib/session.svelte'

/**
 * Practice time, per day, for the Goals page. Time counts while a song is open and the window is
 * showing, as long as it's playing or you've touched the keyboard or mouse in the last few
 * minutes (so the app sitting open in the background doesn't count). Saved in localStorage.
 */

/** How often practice time is added up, in seconds. */
const TICK = 10
/** With nothing playing, practice stops counting this long after the last input. */
const IDLE_AFTER_MS = 5 * 60 * 1000
/** A day counts toward the streak once it has at least this much practice, in seconds. */
export const STREAK_MIN = 60

const STORAGE_KEY = 'practice'

/** A local calendar day as "YYYY-MM-DD". */
export function dayKey(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The day `offset` days from `date` (negative for earlier). */
export function addDays(date: Date, offset: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + offset)
  return next
}

/** "1h 20m", "45m", "0m". */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours === 0) return `${minutes}m`
  return minutes % 60 === 0 ? `${hours}h` : `${hours}h ${minutes % 60}m`
}

class Practice {
  /** Seconds practiced, by day key. */
  days = $state<Record<string, number>>({})
  /** The weekly goal, in hours. */
  weeklyGoalHours = $state(5)
  /** Whether time is being counted right now. */
  active = $state(false)
  /** Bumped every tick so "today" moves on at midnight. */
  now = $state(new Date())

  readonly today = $derived(this.days[dayKey(this.now)] ?? 0)

  /** Seconds this week, Monday to today. */
  readonly thisWeek = $derived.by(() => {
    const sinceMonday = (this.now.getDay() + 6) % 7
    let total = 0
    for (let i = 0; i <= sinceMonday; i++) total += this.days[dayKey(addDays(this.now, -i))] ?? 0
    return total
  })

  readonly total = $derived(Object.values(this.days).reduce((sum, s) => sum + s, 0))
  readonly daysPracticed = $derived(Object.values(this.days).filter((s) => s >= STREAK_MIN).length)

  /** Days in a row with practice, up to today (or yesterday, if today hasn't started yet). */
  readonly streak = $derived.by(() => {
    const practiced = (d: Date): boolean => (this.days[dayKey(d)] ?? 0) >= STREAK_MIN
    let day = practiced(this.now) ? this.now : addDays(this.now, -1)
    let count = 0
    while (practiced(day)) {
      count++
      day = addDays(day, -1)
    }
    return count
  })

  readonly longestStreak = $derived.by(() => {
    const keys = Object.keys(this.days)
      .filter((k) => this.days[k] >= STREAK_MIN)
      .sort()
    let best = 0
    let run = 0
    let previous: Date | null = null
    for (const key of keys) {
      const [y, m, d] = key.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      run = previous && dayKey(addDays(previous, 1)) === key ? run + 1 : 1
      best = Math.max(best, run)
      previous = date
    }
    return best
  })
}

export const practice = new Practice()

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as {
    days?: Record<string, number>
    weeklyGoalHours?: number
  }
  if (saved.days && typeof saved.days === 'object') {
    practice.days = Object.fromEntries(
      Object.entries(saved.days).filter(
        ([key, seconds]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(seconds)
      )
    )
  }
  if (Number.isInteger(saved.weeklyGoalHours) && saved.weeklyGoalHours! > 0) {
    practice.weeklyGoalHours = saved.weeklyGoalHours!
  }
} catch {
  // Nothing saved yet, or storage unavailable.
}

$effect.root(() => {
  $effect(() => {
    const data = { days: practice.days, weeklyGoalHours: practice.weeklyGoalHours }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Storage unavailable: practice just won't be remembered.
    }
  })

  // Whether the open song is playing.
  let playing = false
  $effect(() => {
    playing = false
    return session.player?.onPlaybackChange((state) => (playing = state.playing))
  })

  // The last keyboard or mouse input, for spotting when practice has stopped.
  let lastInput = Date.now()
  const touched = (): void => {
    lastInput = Date.now()
  }
  for (const event of ['pointerdown', 'pointermove', 'keydown', 'wheel'] as const) {
    window.addEventListener(event, touched, { passive: true })
  }

  const timer = setInterval(() => {
    practice.now = new Date()
    practice.active =
      !!library.selected &&
      document.visibilityState === 'visible' &&
      (playing || Date.now() - lastInput < IDLE_AFTER_MS)
    if (!practice.active) return
    const key = dayKey(practice.now)
    practice.days[key] = (practice.days[key] ?? 0) + TICK
  }, TICK * 1000)

  return () => {
    clearInterval(timer)
    for (const event of ['pointerdown', 'pointermove', 'keydown', 'wheel'] as const) {
      window.removeEventListener(event, touched)
    }
  }
})
