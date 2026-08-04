import { contextBridge, ipcRenderer } from "electron";
import type {
  AppSettings,
  BudgetCategory,
  BudgetSummary,
  BudgetTransaction,
  BudgetTransactionType,
  Course,
  DataExport,
  ExerciseVolumePoint,
  FocusCategoryTotal,
  FocusDayCategoryTotal,
  FocusSession,
  HydrationLog,
  ManualFocusEntry,
  NewBudgetTransaction,
  NewCourse,
  NewNutritionLog,
  NewTask,
  NewWorkoutExercise,
  NutritionDayTotal,
  NutritionLog,
  Task,
  TaskStatus,
  WorkoutExercise,
  WorkoutLog
} from "../shared/types";

const invoke = <T>(channel: string, ...args: unknown[]): Promise<T> => ipcRenderer.invoke(channel, ...args);

const api = {
  tasks: {
    list: () => invoke<Task[]>("tasks:list"),
    add: (input: NewTask) => invoke<Task>("tasks:add", input),
    setStatus: (id: number, status: TaskStatus) => invoke<Task>("tasks:setStatus", id, status),
    update: (id: number, fields: Partial<NewTask>) => invoke<Task>("tasks:update", id, fields),
    remove: (id: number) => invoke<void>("tasks:remove", id)
  },
  courses: {
    list: () => invoke<Course[]>("courses:list"),
    add: (input: Partial<NewCourse> & { title: string }) => invoke<Course>("courses:add", input),
    update: (id: number, fields: Partial<NewCourse>) => invoke<Course>("courses:update", id, fields),
    remove: (id: number) => invoke<void>("courses:remove", id),
    restoreDefaults: () => invoke<Course[]>("courses:restoreDefaults")
  },
  workouts: {
    listExercises: () => invoke<WorkoutExercise[]>("workouts:listExercises"),
    addExercise: (input: NewWorkoutExercise) => invoke<WorkoutExercise>("workouts:addExercise", input),
    updateExercise: (id: number, fields: Partial<WorkoutExercise>) =>
      invoke<WorkoutExercise>("workouts:updateExercise", id, fields),
    archiveExercise: (id: number) => invoke<void>("workouts:archiveExercise", id),
    mergeToSuperset: (idA: number, idB: number) => invoke<void>("workouts:mergeToSuperset", idA, idB),
    unlinkSuperset: (id: number) => invoke<void>("workouts:unlinkSuperset", id),
    logSet: (exerciseId: number, setNumber: number, reps: number, weightKg: number | null, notes: string) =>
      invoke<WorkoutLog>("workouts:logSet", exerciseId, setNumber, reps, weightKg, notes),
    logsForExercise: (exerciseId: number, limit = 30) =>
      invoke<WorkoutLog[]>("workouts:logsForExercise", exerciseId, limit),
    logsToday: () => invoke<WorkoutLog[]>("workouts:logsToday"),
    removeLog: (id: number) => invoke<void>("workouts:removeLog", id),
    volumeByExercise: (exerciseId: number, days = 14) =>
      invoke<ExerciseVolumePoint[]>("workouts:volumeByExercise", exerciseId, days),
    restoreDefaults: () => invoke<WorkoutExercise[]>("workouts:restoreDefaults"),
    pickVideo: (exerciseId: number) => invoke<string | null>("workouts:pickVideo", exerciseId)
  },
  nutrition: {
    listToday: () => invoke<NutritionLog[]>("nutrition:listToday"),
    listByDate: (date: string) => invoke<NutritionLog[]>("nutrition:listByDate", date),
    add: (entry: NewNutritionLog) => invoke<NutritionLog>("nutrition:add", entry),
    remove: (id: number) => invoke<void>("nutrition:remove", id),
    weeklyTotals: () => invoke<NutritionDayTotal[]>("nutrition:weeklyTotals")
  },
  hydration: {
    listToday: () => invoke<HydrationLog[]>("hydration:listToday"),
    add: (amountMl: number) => invoke<HydrationLog>("hydration:add", amountMl),
    remove: (id: number) => invoke<void>("hydration:remove", id),
    totalToday: () => invoke<number>("hydration:totalToday")
  },
  focusTimer: {
    getActive: () => invoke<FocusSession | null>("focusTimer:getActive"),
    start: (category: string, label: string) => invoke<FocusSession>("focusTimer:start", category, label),
    pause: (id: number) => invoke<FocusSession>("focusTimer:pause", id),
    resume: (id: number) => invoke<FocusSession>("focusTimer:resume", id),
    stop: (id: number) => invoke<FocusSession>("focusTimer:stop", id),
    addManual: (entry: ManualFocusEntry) => invoke<FocusSession>("focusTimer:addManual", entry),
    update: (id: number, fields: Partial<FocusSession>) => invoke<FocusSession>("focusTimer:update", id, fields),
    remove: (id: number) => invoke<void>("focusTimer:remove", id),
    recent: (limit = 20) => invoke<FocusSession[]>("focusTimer:recent", limit),
    listByDate: (date: string) => invoke<FocusSession[]>("focusTimer:listByDate", date),
    todayTotals: () => invoke<FocusCategoryTotal[]>("focusTimer:todayTotals"),
    weeklyTotals: () => invoke<FocusDayCategoryTotal[]>("focusTimer:weeklyTotals")
  },
  budget: {
    listCategories: () => invoke<BudgetCategory[]>("budget:listCategories"),
    categoriesByType: (type: BudgetTransactionType) => invoke<BudgetCategory[]>("budget:categoriesByType", type),
    list: () => invoke<BudgetTransaction[]>("budget:list"),
    add: (tx: NewBudgetTransaction) => invoke<BudgetTransaction>("budget:add", tx),
    update: (id: number, fields: Partial<NewBudgetTransaction>) =>
      invoke<BudgetTransaction>("budget:update", id, fields),
    remove: (id: number) => invoke<void>("budget:remove", id),
    summary: () => invoke<BudgetSummary>("budget:summary"),
    todaySpend: () => invoke<number>("budget:todaySpend"),
    restoreDefaultCategories: () => invoke<BudgetCategory[]>("budget:restoreDefaultCategories")
  },
  settings: {
    get: () => invoke<AppSettings>("settings:get"),
    set: (patch: Partial<AppSettings>) => invoke<AppSettings>("settings:set", patch)
  },
  system: {
    exportAll: () => invoke<DataExport>("system:exportAll")
  }
};

export type Api = typeof api;

contextBridge.exposeInMainWorld("api", api);
