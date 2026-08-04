// Domain types shared between the main process (Drizzle rows), the preload
// bridge, and the renderer (TanStack Query hooks). Single source of truth so
// IPC payloads stay in sync across process boundaries.

export type TaskStatus = "todo" | "in_progress" | "completed";
export type TaskPriority =
  | "urgent_important"
  | "important_not_urgent"
  | "urgent_not_important"
  | "not_urgent_not_important";

export interface Task {
  id: number;
  text: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface NewTask {
  text: string;
  priority: TaskPriority;
  dueDate?: string | null;
}

export type CourseStatus = "planned" | "in_progress" | "completed";

export interface Course {
  id: number;
  title: string;
  provider: string | null;
  category: string | null;
  phase: number;
  url: string | null;
  status: CourseStatus;
  notes: string | null;
  createdAt: string;
}

export type NewCourse = Omit<Course, "id" | "createdAt">;

export type ExerciseType = "reps" | "time";

export interface WorkoutExercise {
  id: number;
  day: string;
  name: string;
  sets: number | null;
  repsRange: string | null;
  exerciseType: ExerciseType;
  durationSeconds: number | null;
  progression: string | null;
  tips: string | null;
  orderIndex: number;
  supersetGroup: string | null;
  supersetColor: string | null;
  archived: boolean;
  videoPath: string | null;
}

export type NewWorkoutExercise = Partial<
  Omit<WorkoutExercise, "id" | "archived" | "supersetGroup" | "supersetColor">
> &
  Pick<WorkoutExercise, "day" | "name">;

export interface WorkoutLog {
  id: number;
  exerciseId: number;
  date: string;
  setNumber: number | null;
  reps: number | null;
  weightKg: number | null;
  notes: string | null;
}

export interface ExerciseVolumePoint {
  date: string;
  vol: number;
}

// A "group" is either a single exercise or a superset (2+ exercises sharing
// a superset_group) treated as one unit for session sequencing.
export interface WorkoutExerciseGroup {
  key: string;
  exercises: WorkoutExercise[];
  color: string | null;
}

export type WorkoutSessionPhase = "preview" | "countdown" | "work" | "rest" | "complete";

export interface WorkoutSessionState {
  id: string;
  day: string;
  groupOrder: string[];
  currentGroupIndex: number;
  currentSet: number;
  totalSets: number;
  phase: WorkoutSessionPhase;
  /** Fixed auto-transition anchor for "countdown" and time-based "work" — not used for "rest", which is pausable (see restX fields). */
  phaseEndsAt: string | null;
  restSeconds: number;
  restElapsedSeconds: number;
  restRunning: boolean;
  restStartedAt: string | null;
  focusSessionId: number | null;
  startedAt: string;
}

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export interface NutritionLog {
  id: number;
  date: string;
  meal: MealType | string | null;
  food: string;
  calories: number;
  proteinG: number;
  time: string;
}

export interface NewNutritionLog {
  meal: string;
  food: string;
  calories: number;
  proteinG?: number;
}

export interface NutritionDayTotal {
  date: string;
  calories: number;
  protein: number;
}

export interface HydrationLog {
  id: number;
  date: string;
  amountMl: number;
  time: string;
}

export type FocusCategory = "deep_work" | "training" | "learning" | "other";
export type FocusSessionStatus = "running" | "paused" | "completed";

export interface FocusSession {
  id: number;
  category: FocusCategory | string;
  label: string | null;
  date: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  status: FocusSessionStatus;
  accumulatedSeconds: number;
  lastStartedAt: string | null;
}

export interface FocusCategoryTotal {
  category: string;
  seconds: number;
}

export interface FocusDayCategoryTotal {
  date: string;
  category: string;
  seconds: number;
}

export interface ManualFocusEntry {
  category: string;
  label?: string;
  date: string;
  startClock: string;
  endClock: string;
}

export type BudgetTransactionType = "expense" | "income" | "transfer";

export interface BudgetCategory {
  id: number;
  name: string;
  type: BudgetTransactionType;
}

export interface BudgetTransaction {
  id: number;
  type: BudgetTransactionType;
  amount: number;
  categoryId: number | null;
  categoryName: string | null;
  description: string | null;
  date: string;
}

export interface NewBudgetTransaction {
  type: BudgetTransactionType;
  amount: number;
  categoryId: number | null;
  description?: string;
  date: string;
}

export interface BudgetSummary {
  income: number;
  expense: number;
  balance: number;
  transferTotal: number;
}

export type ThemeKey = "light" | "dark" | "solarized" | "midnight" | "cyberpunk" | "forest" | "nord" | "rose";
export type FontKey = "sans" | "display" | "mono" | "grotesk" | "newsreader";

export interface AppSettings {
  theme: ThemeKey;
  font: FontKey;
  waterGoalMl: number;
  calorieGoal: number;
  dailyBudgetLimit: number;
  activePresetId: number | null;
  workoutDays: string[];
}

export interface ThemePreset {
  id: number;
  name: string;
  baseTheme: ThemeKey;
  background: string;
  accent: string;
  createdAt: string;
}

export interface NewThemePreset {
  name: string;
  baseTheme: ThemeKey;
  background: string;
  accent: string;
}

export type HabitCadence = "daily" | "weekly";

export interface Habit {
  id: number;
  name: string;
  cadence: HabitCadence;
  color: string;
  orderIndex: number;
  archived: boolean;
  createdAt: string;
}

export interface NewHabit {
  name: string;
  cadence: HabitCadence;
  color?: string;
}

export interface HabitLog {
  id: number;
  habitId: number;
  date: string;
  completedAt: string;
}

export interface HabitWithLogs extends Habit {
  completedDates: string[];
  streak: number;
}

export interface JournalEntry {
  id: number;
  date: string;
  morningIntentions: string;
  eveningReflection: string;
  updatedAt: string;
}

export interface BrainDump {
  id: number;
  date: string;
  content: string;
  createdAt: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NewNote {
  title: string;
  content?: string;
  tags?: string[];
}

export interface DataExport {
  tasks: Task[];
  courses: Course[];
  workout_exercises: WorkoutExercise[];
  workout_logs: WorkoutLog[];
  nutrition_logs: NutritionLog[];
  hydration_logs: HydrationLog[];
  focus_sessions: FocusSession[];
  budget_transactions: BudgetTransaction[];
  budget_categories: BudgetCategory[];
  habits: Habit[];
  habit_logs: HabitLog[];
  journal_entries: JournalEntry[];
  brain_dumps: BrainDump[];
  notes: Note[];
}
