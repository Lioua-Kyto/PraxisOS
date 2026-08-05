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
  startedAt: string | null;
  finishedAt: string | null;
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
  carbsG: number;
  time: string;
}

export interface NewNutritionLog {
  meal: string;
  food: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
}

export interface NutritionDayTotal {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
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

export type BudgetTransactionType = "expense" | "income" | "transfer" | "debt";

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
  debt: number;
}

export interface Food {
  id: number;
  name: string;
  category: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  servingLabel: string;
  createdAt: string;
}

export interface NewFood {
  name: string;
  category: string;
  calories: number;
  proteinG: number;
  carbsG?: number;
  servingLabel?: string;
}

export interface HydrationDayTotal {
  date: string;
  ml: number;
}

export type ThemeKey = "light" | "dark" | "solarized" | "midnight" | "cyberpunk" | "forest" | "nord" | "rose";
export type FontKey = "sans" | "display" | "mono" | "grotesk" | "newsreader";

export interface AppSettings {
  theme: ThemeKey;
  font: FontKey;
  waterGoalMl: number;
  calorieGoal: number;
  carbsGoal: number;
  dailyBudgetLimit: number;
  activePresetId: number | null;
  workoutDays: string[];
  /** Weekday index (0=Sun..6=Sat) -> workout day name, or "" for a rest day. */
  workoutSchedule: Record<string, string>;
  proteinGoal: number;
  weekStartsOn: number;
  defaultRestSeconds: number;
  defaultFocusCategory: string;
  currencySymbol: string;
  confirmBeforeEndingWorkout: boolean;
  habitRemindersEnabled: boolean;
  /** 24h "HH:MM" — when to nudge about habits still open today. */
  habitReminderTime: string;
}

export interface ThemePreset {
  id: number;
  name: string;
  baseTheme: ThemeKey;
  /** Null inherits the base theme's surfaces — only the accent is overridden. */
  background: string | null;
  accent: string;
  foreground: string | null;
  createdAt: string;
}

export interface NewThemePreset {
  name: string;
  baseTheme: ThemeKey;
  background: string | null;
  accent: string;
  foreground?: string | null;
}

export type HabitCadence = "daily" | "weekly" | "custom";

export interface Habit {
  id: number;
  name: string;
  cadence: HabitCadence;
  /** Weekday numbers (0=Sun..6=Sat). One entry for "weekly", several for "custom", empty for "daily". */
  weekdays: number[];
  color: string;
  orderIndex: number;
  archived: boolean;
  managedBy: string | null;
  createdAt: string;
}

export interface NewHabit {
  name: string;
  cadence: HabitCadence;
  weekdays?: number[];
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
  /** Dates in the viewed month this habit is actually scheduled for. */
  scheduledDates: string[];
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

/**
 * The single dependable backup format. Every table is exported as raw rows
 * (snake_case, exactly as stored) rather than the camelCase view models, so
 * an import is a faithful restore and doesn't depend on UI-layer mapping.
 * `formatVersion` is bumped whenever the shape changes so imports can refuse
 * files they don't understand.
 */
export const BACKUP_FORMAT_VERSION = 1;

export type BackupTableName =
  | "tasks"
  | "courses"
  | "workout_exercises"
  | "workout_logs"
  | "nutrition_logs"
  | "hydration_logs"
  | "focus_sessions"
  | "budget_categories"
  | "budget_transactions"
  | "settings"
  | "theme_presets"
  | "habits"
  | "habit_logs"
  | "journal_entries"
  | "brain_dumps"
  | "notes"
  | "foods";

export interface BackupFile {
  format: "praxisos-backup";
  formatVersion: number;
  appVersion: string;
  exportedAt: string;
  /** Raw rows keyed by table name. */
  tables: Record<BackupTableName, Array<Record<string, unknown>>>;
  /** Media filenames referenced by exercises/notes, so a restore can report what's missing. */
  mediaFiles: string[];
}

export interface ImportSummary {
  restored: Record<string, number>;
  totalRows: number;
  missingMedia: string[];
}
