import { Suspense, lazy } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { FocusWidget } from "./FocusWidget";
import { TopTodosWidget } from "./TopTodosWidget";
import { BudgetWidget } from "./BudgetWidget";
import { NutritionHydrationWidget } from "./NutritionHydrationWidget";
import { TodayAgendaWidget } from "./TodayAgendaWidget";
import { StreakStrip } from "./StreakStrip";
import { useDashboardData } from "../../queries/system";
import { useSettings } from "../../queries/settings";
import { useFocusWeeklyTotals } from "../../queries/focusTimer";
import { useBudgetTodaySpend } from "../../queries/budget";
import { useHabits } from "../../queries/habits";
import { useNotes } from "../../queries/notes";
import { useJournalEntry } from "../../queries/journal";
import { localDateString } from "@shared/datetime";
import type { PageKey } from "../layout/Sidebar";

// Recharts is the single heaviest dependency; deferring it lets the rest of
// the Overview paint immediately and streams the charts in behind it.
const WeeklyFocusChart = lazy(() =>
  import("../viz/WeeklyFocusChart").then((m) => ({ default: m.WeeklyFocusChart }))
);

const ChartFallback = () => (
  <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Loading chart…</div>
);

export function Dashboard({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const today = localDateString();
  const month = today.slice(0, 7);

  const { data } = useDashboardData();
  const { data: settings } = useSettings();
  const { data: weekly = [] } = useFocusWeeklyTotals();
  const { data: todaySpend = 0 } = useBudgetTodaySpend();
  const { data: habits = [] } = useHabits(month);
  const { data: notes = [] } = useNotes();
  const { data: journalToday } = useJournalEntry(today);

  const tasks = data?.tasks ?? [];
  const openTasks = tasks.filter((t) => t.status !== "completed");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const doneToday = tasks.filter((t) => t.finishedAt?.startsWith(today));

  // Weekday index -> configured workout day, "" meaning rest.
  const scheduledWorkout = settings?.workoutSchedule?.[String(new Date().getDay())] || null;

  const focusSecondsToday = (data?.focusTodayTotals ?? []).reduce((sum, t) => sum + t.seconds, 0);
  const journalStarted = Boolean(journalToday?.morningIntentions?.trim() || journalToday?.eveningReflection?.trim());

  return (
    <div>
      <PageHeader
        title="Nexus"
        description={`Everything at a glance for ${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}. Each counter opens the panel behind it.`}
      />

      {/* At-a-glance counters — the numbers you'd otherwise open four panels to find. */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {[
          { label: "Focused today", value: `${(focusSecondsToday / 3600).toFixed(1)}h`, page: "timer" as PageKey },
          { label: "Tasks open", value: String(openTasks.length), page: "todo" as PageKey },
          { label: "In progress", value: String(inProgress.length), page: "todo" as PageKey },
          { label: "Done today", value: String(doneToday.length), page: "todo" as PageKey },
          { label: "Notes", value: String(notes.length), page: "notes" as PageKey }
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => onNavigate(stat.page)}
            className="rounded-lg border border-border-soft bg-card px-3.5 py-2.5 text-left transition-colors hover:border-primary/50"
          >
            <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</div>
            <div className="tabular font-display mt-0.5 text-xl">{stat.value}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <FocusWidget onNavigate={() => onNavigate("timer")} />
        <TopTodosWidget tasks={tasks} onNavigate={() => onNavigate("todo")} />
        <BudgetWidget
          summary={data?.budgetSummary}
          todaySpend={todaySpend}
          dailyLimit={settings?.dailyBudgetLimit ?? 60}
          onNavigate={() => onNavigate("budget")}
        />
        <NutritionHydrationWidget
          nutritionToday={data?.nutritionToday ?? []}
          hydrationTotal={data?.hydrationTotal ?? 0}
          calorieGoal={settings?.calorieGoal ?? 2400}
          waterGoalMl={settings?.waterGoalMl ?? 2500}
          onNavigate={() => onNavigate("nutrition")}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TodayAgendaWidget habits={habits} scheduledWorkout={scheduledWorkout} onNavigate={onNavigate} />
        <StreakStrip habits={habits} onNavigate={() => onNavigate("habits")} />

        <Card className="cursor-pointer transition-colors hover:border-primary/50" onClick={() => onNavigate("journal")}>
          <CardContent className="pt-5">
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Daily log</h3>
            {journalStarted ? (
              <div className="line-clamp-6 whitespace-pre-wrap text-[12.5px] text-muted-foreground">
                {journalToday?.morningIntentions?.trim() || journalToday?.eveningReflection?.trim()}
              </div>
            ) : (
              <div className="py-4 text-xs text-muted-foreground">
                Nothing written today — set your intentions or reflect on the day.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Focus hours this week</h3>
          <Suspense fallback={<ChartFallback />}>
            <WeeklyFocusChart data={weekly} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
