import { useState, type ComponentType } from "react";
import { AppShell } from "./components/layout/AppShell";
import type { PageKey } from "./components/layout/Sidebar";
import { Dashboard } from "./components/dashboard/Dashboard";
import { TodoPanel } from "./components/todo/TodoPanel";
import { HabitMatrixPanel } from "./components/habits/HabitMatrixPanel";
import { CoursesPanel } from "./components/courses/CoursesPanel";
import { WorkoutPanel } from "./components/workout/WorkoutPanel";
import { NutritionPanel } from "./components/nutrition/NutritionPanel";
import { TimerPanel } from "./components/timer/TimerPanel";
import { BudgetPanel } from "./components/budget/BudgetPanel";
import { JournalPanel } from "./components/journal/JournalPanel";
import { NotesPanel } from "./components/notes/NotesPanel";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { WorkoutSessionApp } from "./components/workoutSession/WorkoutSessionApp";
import { WorkoutSessionOverlayProvider, useWorkoutSessionOverlay } from "./components/workoutSession/WorkoutSessionOverlayContext";

const PANELS: Record<PageKey, ComponentType<{ onNavigate: (page: PageKey) => void }>> = {
  dashboard: Dashboard,
  todo: TodoPanel,
  habits: HabitMatrixPanel,
  courses: CoursesPanel,
  workout: WorkoutPanel,
  nutrition: NutritionPanel,
  timer: TimerPanel,
  budget: BudgetPanel,
  journal: JournalPanel,
  notes: NotesPanel,
  settings: SettingsPanel
};

function AppContent() {
  const [page, setPage] = useState<PageKey>("dashboard");
  const { open, hide } = useWorkoutSessionOverlay();
  const Panel = PANELS[page];

  if (open) return <WorkoutSessionApp onReturn={hide} />;

  return (
    <AppShell page={page} onNavigate={setPage}>
      <Panel onNavigate={setPage} />
    </AppShell>
  );
}

export default function App() {
  return (
    <WorkoutSessionOverlayProvider>
      <AppContent />
    </WorkoutSessionOverlayProvider>
  );
}
