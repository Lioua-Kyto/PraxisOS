import { Suspense, lazy, useState, type ComponentType } from "react";
import { AppShell } from "./components/layout/AppShell";
import { PanelErrorBoundary } from "./components/layout/PanelErrorBoundary";
import type { PageKey } from "./components/layout/Sidebar";
import { Dashboard } from "./components/dashboard/Dashboard";
import { WorkoutSessionApp } from "./components/workoutSession/WorkoutSessionApp";
import { WorkoutSessionOverlayProvider, useWorkoutSessionOverlay } from "./components/workoutSession/WorkoutSessionOverlayContext";

// Overview is eager since it's the landing panel — everything else is split
// out so the initial parse only covers what's actually on screen. Recharts
// and the markdown stack are the heavy dependencies this keeps out of the
// startup path.
const TodoPanel = lazy(() => import("./components/todo/TodoPanel").then((m) => ({ default: m.TodoPanel })));
const HabitMatrixPanel = lazy(() =>
  import("./components/habits/HabitMatrixPanel").then((m) => ({ default: m.HabitMatrixPanel }))
);
const CoursesPanel = lazy(() => import("./components/courses/CoursesPanel").then((m) => ({ default: m.CoursesPanel })));
const WorkoutPanel = lazy(() => import("./components/workout/WorkoutPanel").then((m) => ({ default: m.WorkoutPanel })));
const NutritionPanel = lazy(() =>
  import("./components/nutrition/NutritionPanel").then((m) => ({ default: m.NutritionPanel }))
);
const TimerPanel = lazy(() => import("./components/timer/TimerPanel").then((m) => ({ default: m.TimerPanel })));
const BudgetPanel = lazy(() => import("./components/budget/BudgetPanel").then((m) => ({ default: m.BudgetPanel })));
const JournalPanel = lazy(() => import("./components/journal/JournalPanel").then((m) => ({ default: m.JournalPanel })));
const NotesPanel = lazy(() => import("./components/notes/NotesPanel").then((m) => ({ default: m.NotesPanel })));
const SettingsPanel = lazy(() => import("./components/settings/SettingsPanel").then((m) => ({ default: m.SettingsPanel })));

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

function PanelFallback() {
  return (
    <div className="flex h-64 items-center justify-center" role="status" aria-live="polite">
      <span className="text-sm text-muted-foreground">Loading…</span>
    </div>
  );
}

function AppContent() {
  const [page, setPage] = useState<PageKey>("dashboard");
  const { open, hide } = useWorkoutSessionOverlay();
  const Panel = PANELS[page];

  if (open) return <WorkoutSessionApp onReturn={hide} />;

  return (
    <AppShell page={page} onNavigate={setPage}>
      <PanelErrorBoundary resetKey={page}>
        <Suspense fallback={<PanelFallback />}>
          <Panel onNavigate={setPage} />
        </Suspense>
      </PanelErrorBoundary>
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
