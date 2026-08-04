import { Suspense, lazy } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { FocusWidget } from "./FocusWidget";
import { TopTodosWidget } from "./TopTodosWidget";
import { BudgetWidget } from "./BudgetWidget";
import { NutritionHydrationWidget } from "./NutritionHydrationWidget";
// Recharts is the single heaviest dependency; deferring it lets the rest of
// the Overview paint immediately and streams the chart in behind it.
const WeeklyFocusChart = lazy(() =>
  import("../viz/WeeklyFocusChart").then((m) => ({ default: m.WeeklyFocusChart }))
);
import { useDashboardData } from "../../queries/system";
import { useSettings } from "../../queries/settings";
import { useFocusWeeklyTotals } from "../../queries/focusTimer";
import { useBudgetTodaySpend } from "../../queries/budget";
import type { PageKey } from "../layout/Sidebar";

export function Dashboard({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const { data } = useDashboardData();
  const { data: settings } = useSettings();
  const { data: weekly = [] } = useFocusWeeklyTotals();
  const { data: todaySpend = 0 } = useBudgetTodaySpend();

  return (
    <div>
      <PageHeader kicker={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} title="Overview" />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <FocusWidget onNavigate={() => onNavigate("timer")} />
        <TopTodosWidget tasks={data?.tasks ?? []} onNavigate={() => onNavigate("todo")} />
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

      <Card>
        <CardContent className="pt-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Focus hours this week</h3>
          <Suspense fallback={<div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">Loading chart…</div>}>
            <WeeklyFocusChart data={weekly} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
