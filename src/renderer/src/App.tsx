import { useState, type ComponentType } from "react";
import { AppShell } from "./components/layout/AppShell";
import type { PageKey } from "./components/layout/Sidebar";
import { Dashboard } from "./components/dashboard/Dashboard";
import { TodoPanel } from "./components/todo/TodoPanel";
import { CoursesPanel } from "./components/courses/CoursesPanel";
import { WorkoutPanel } from "./components/workout/WorkoutPanel";
import { NutritionPanel } from "./components/nutrition/NutritionPanel";
import { TimerPanel } from "./components/timer/TimerPanel";
import { BudgetPanel } from "./components/budget/BudgetPanel";
import { SettingsPanel } from "./components/settings/SettingsPanel";

const PANELS: Record<PageKey, ComponentType<{ onNavigate: (page: PageKey) => void }>> = {
  dashboard: Dashboard,
  todo: TodoPanel,
  courses: CoursesPanel,
  workout: WorkoutPanel,
  nutrition: NutritionPanel,
  timer: TimerPanel,
  budget: BudgetPanel,
  settings: SettingsPanel
};

export default function App() {
  const [page, setPage] = useState<PageKey>("dashboard");
  const Panel = PANELS[page];

  return (
    <AppShell page={page} onNavigate={setPage}>
      <Panel onNavigate={setPage} />
    </AppShell>
  );
}
