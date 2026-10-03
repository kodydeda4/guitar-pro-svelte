<script lang="ts">
  import FlameIcon from '@lucide/svelte/icons/flame'
  import MinusIcon from '@lucide/svelte/icons/minus'
  import PlusIcon from '@lucide/svelte/icons/plus'

  import * as Sidebar from '#lib/components/ui/sidebar'
  import { STREAK_MIN, addDays, dayKey, formatDuration, practice } from '#lib/practice.svelte'
  import { cn } from '#lib/utils'

  const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  /** Weeks shown in the practice calendar. */
  const CALENDAR_WEEKS = 16

  const weeklyGoal = $derived(practice.weeklyGoalHours * 3600)
  const weekProgress = $derived(Math.min(1, practice.thisWeek / weeklyGoal))
  /** The daily share of the weekly goal, drawn as a line across the chart. */
  const dailyGoal = $derived(weeklyGoal / 7)

  /** The last 14 days, oldest first. */
  const recent = $derived(
    Array.from({ length: 14 }, (_, i) => {
      const date = addDays(practice.now, i - 13)
      return { date, key: dayKey(date), seconds: practice.days[dayKey(date)] ?? 0 }
    })
  )
  /** The chart's top: the busiest day, or at least a bit above the daily goal. */
  const chartMax = $derived(Math.max(dailyGoal * 1.25, ...recent.map((d) => d.seconds), 1))

  /** Columns of weeks (Sunday first), ending with this week, for the practice calendar. */
  const calendar = $derived.by(() => {
    const end = addDays(practice.now, 6 - practice.now.getDay())
    return Array.from({ length: CALENDAR_WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const date = addDays(end, -((CALENDAR_WEEKS - 1 - w) * 7 + (6 - d)))
        const seconds = practice.days[dayKey(date)] ?? 0
        return { key: dayKey(date), date, seconds, future: date > practice.now }
      })
    )
  })

  /** 0–4: how much practice a calendar day had, against the daily goal. */
  function level(seconds: number): number {
    if (seconds < STREAK_MIN) return 0
    const share = seconds / dailyGoal
    return share < 0.34 ? 1 : share < 0.67 ? 2 : share < 1 ? 3 : 4
  }

  const dateLabel = (date: Date): string =>
    date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

  const streakMessage = $derived(
    practice.streak === 0
      ? practice.today > 0
        ? 'Keep going: a minute today starts your streak.'
        : 'Open a song and play to start a streak.'
      : practice.streak === 1
        ? 'Day one. Come back tomorrow to keep it alive.'
        : practice.streak < 7
          ? 'You’re on a roll. Don’t break the chain.'
          : practice.streak < 30
            ? 'A whole week and then some. Serious dedication.'
            : 'Legendary. Your fingers are made of steel now.'
  )

  // The weekly goal ring.
  const RING = 2 * Math.PI * 34
</script>

{#snippet heading(text: string)}
  <h3 class="mb-2 px-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
    {text}
  </h3>
{/snippet}

<!-- Practice goals: a streak, today and this week against a weekly goal, the last two weeks as a
     bar chart, and a calendar of the last few months. -->
<Sidebar.Root collapsible="none" class="border-r">
  <Sidebar.Content class="gap-0 pb-8">
    <header class="px-4 pt-4 pb-3">
      <h2 class="text-2xl leading-tight font-bold tracking-tight">Goals</h2>
      <p class="text-[13px] text-muted-foreground">
        {practice.active ? 'Practicing now…' : 'Time counts while you play a song.'}
      </p>
    </header>

    <!-- Streak -->
    <section class="streak mx-3 flex items-center gap-3 rounded-xl p-4">
      <span
        class={cn(
          'flame flex size-12 shrink-0 items-center justify-center rounded-full',
          practice.streak > 0 && 'lit'
        )}
      >
        <FlameIcon class="size-6" />
      </span>
      <div class="min-w-0">
        <div class="text-3xl leading-none font-extrabold tabular-nums">
          {practice.streak}
          <span class="text-base font-semibold text-foreground/80">
            day{practice.streak === 1 ? '' : 's'}
          </span>
        </div>
        <p class="mt-1 text-[11px] leading-snug text-foreground/75">{streakMessage}</p>
      </div>
    </section>

    <!-- Today and this week -->
    <section class="mx-3 mt-3 grid grid-cols-2 gap-3">
      <div class="rounded-xl bg-foreground/5 p-3">
        <div class="text-[11px] font-semibold text-muted-foreground">Today</div>
        <div class="mt-1 text-2xl font-bold tabular-nums">{formatDuration(practice.today)}</div>
        <div class="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
          of {formatDuration(dailyGoal)} a day
        </div>
      </div>
      <div class="flex items-center gap-2 rounded-xl bg-foreground/5 p-3">
        <svg viewBox="0 0 80 80" class="size-11 shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="40" cy="40" r="34" class="ring-track" />
          <circle
            cx="40"
            cy="40"
            r="34"
            class="ring-fill"
            stroke-dasharray={RING}
            stroke-dashoffset={RING * (1 - weekProgress)}
          />
        </svg>
        <div class="min-w-0">
          <div class="text-[11px] font-semibold whitespace-nowrap text-muted-foreground">
            This week
          </div>
          <div class="text-lg leading-tight font-bold tabular-nums">
            {Math.round(weekProgress * 100)}%
          </div>
          <div class="text-[11px] text-muted-foreground tabular-nums">
            {formatDuration(practice.thisWeek)}
          </div>
        </div>
      </div>
    </section>

    <!-- Last 14 days -->
    <section class="mt-6 px-3">
      {@render heading('Last 14 days')}
      <div class="rounded-xl bg-foreground/5 px-3 pt-3 pb-2">
        <div class="relative flex h-28 items-end gap-1">
          <!-- The daily share of the weekly goal. -->
          <div
            class="goal-line pointer-events-none absolute inset-x-0"
            style:bottom="{(dailyGoal / chartMax) * 100}%"
          ></div>
          {#each recent as day, i (day.key)}
            {@const isToday = i === recent.length - 1}
            <div
              class="flex h-full flex-1 flex-col justify-end"
              title="{dateLabel(day.date)}: {formatDuration(day.seconds)}"
            >
              <div
                class={cn(
                  'bar rounded-t-[3px]',
                  isToday ? 'today' : day.seconds >= dailyGoal ? 'met' : ''
                )}
                style:height="{Math.max(day.seconds > 0 ? 3 : 0, (day.seconds / chartMax) * 100)}%"
              ></div>
            </div>
          {/each}
        </div>
        <div class="mt-1.5 flex gap-1 text-center text-[10px] text-muted-foreground">
          {#each recent as day (day.key)}
            <span class="flex-1">{WEEKDAYS[day.date.getDay()]}</span>
          {/each}
        </div>
      </div>
    </section>

    <!-- Calendar -->
    <section class="mt-6 px-3">
      {@render heading('Practice calendar')}
      <div class="rounded-xl bg-foreground/5 p-3">
        <div class="flex justify-between gap-[3px]">
          {#each calendar as week, w (w)}
            <div class="flex flex-1 flex-col gap-[3px]">
              {#each week as day (day.key)}
                <span
                  class={cn('cell aspect-square w-full rounded-[3px]', day.future && 'future')}
                  data-level={level(day.seconds)}
                  title={day.future
                    ? undefined
                    : `${dateLabel(day.date)}: ${formatDuration(day.seconds)}`}
                ></span>
              {/each}
            </div>
          {/each}
        </div>
        <div class="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          Less
          {#each [0, 1, 2, 3, 4] as l (l)}
            <span class="cell size-2.5 rounded-[2px]" data-level={l}></span>
          {/each}
          More
        </div>
      </div>
    </section>

    <!-- Weekly goal -->
    <section class="mt-6 px-3">
      {@render heading('Weekly goal')}
      <div class="flex items-center gap-3 rounded-xl bg-foreground/5 p-2">
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-lg bg-foreground/8 hover:bg-foreground/15 disabled:opacity-40"
          disabled={practice.weeklyGoalHours <= 1}
          onclick={() => (practice.weeklyGoalHours -= 1)}
          aria-label="Lower the weekly goal"
        >
          <MinusIcon class="size-4" />
        </button>
        <div class="flex-1 text-center">
          <span class="text-lg font-bold tabular-nums">{practice.weeklyGoalHours}</span>
          <span class="text-[13px] text-muted-foreground">
            hour{practice.weeklyGoalHours === 1 ? '' : 's'} a week
          </span>
        </div>
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-lg bg-foreground/8 hover:bg-foreground/15 disabled:opacity-40"
          disabled={practice.weeklyGoalHours >= 40}
          onclick={() => (practice.weeklyGoalHours += 1)}
          aria-label="Raise the weekly goal"
        >
          <PlusIcon class="size-4" />
        </button>
      </div>
    </section>

    <!-- All time -->
    <section class="mt-6 px-3">
      {@render heading('All time')}
      <div class="grid grid-cols-3 overflow-hidden rounded-xl bg-foreground/5 text-center">
        {#each [{ value: formatDuration(practice.total), label: 'practiced' }, { value: String(practice.daysPracticed), label: practice.daysPracticed === 1 ? 'day' : 'days' }, { value: String(practice.longestStreak), label: 'best streak' }] as stat, i (stat.label)}
          <div class={cn('px-2 py-3', i > 0 && 'border-l border-foreground/6')}>
            <div class="text-base font-bold tabular-nums">{stat.value}</div>
            <div class="text-[11px] text-muted-foreground">{stat.label}</div>
          </div>
        {/each}
      </div>
    </section>
  </Sidebar.Content>
</Sidebar.Root>

<style>
  .streak {
    background:
      radial-gradient(120% 120% at 0% 0%, rgb(249 115 22 / 0.22), transparent 60%),
      color-mix(in oklab, var(--foreground) 5%, transparent);
    box-shadow: inset 0 0 0 1px rgb(249 115 22 / 0.18);
  }
  .flame {
    background: color-mix(in oklab, var(--foreground) 8%, transparent);
    color: var(--muted-foreground);
  }
  .flame.lit {
    background: linear-gradient(160deg, #fbbf24, #f97316 55%, #dc2626);
    color: white;
    box-shadow: 0 4px 18px rgb(249 115 22 / 0.45);
  }

  .ring-track,
  .ring-fill {
    fill: none;
    stroke-width: 9;
  }
  .ring-track {
    stroke: color-mix(in oklab, var(--foreground) 10%, transparent);
  }
  .ring-fill {
    stroke: var(--primary);
    stroke-linecap: round;
    transition: stroke-dashoffset 0.6s ease;
  }

  .bar {
    background: color-mix(in oklab, var(--primary) 45%, transparent);
    transition: height 0.4s ease;
  }
  .bar.met {
    background: color-mix(in oklab, var(--primary) 80%, transparent);
  }
  .bar.today {
    background: var(--primary);
    box-shadow: 0 0 10px color-mix(in oklab, var(--primary) 50%, transparent);
  }
  .goal-line {
    border-top: 1px dashed color-mix(in oklab, var(--foreground) 30%, transparent);
  }

  .cell {
    background: color-mix(in oklab, var(--foreground) 7%, transparent);
  }
  .cell[data-level='1'] {
    background: color-mix(in oklab, var(--primary) 30%, transparent);
  }
  .cell[data-level='2'] {
    background: color-mix(in oklab, var(--primary) 55%, transparent);
  }
  .cell[data-level='3'] {
    background: color-mix(in oklab, var(--primary) 78%, transparent);
  }
  .cell[data-level='4'] {
    background: var(--primary);
  }
  .cell.future {
    background: transparent;
  }
</style>
