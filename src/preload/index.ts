import { contextBridge, ipcRenderer } from "electron";
import type {
  AppSettings,
  UpdateCheck,
  WhatsNew,
  BrainDump,
  BudgetCategory,
  BudgetSummary,
  BudgetTransaction,
  BudgetTransactionType,
  BackupFile,
  Course,
  ExerciseVolumePoint,
  FocusCategoryTotal,
  FocusDayCategoryTotal,
  FocusSession,
  Food,
  HabitWithLogs,
  HydrationDayTotal,
  ImportSummary,
  HydrationLog,
  JournalEntry,
  ManualFocusEntry,
  NewBudgetTransaction,
  NewCourse,
  NewFood,
  NewHabit,
  NewNote,
  NewNutritionLog,
  NewTask,
  NewThemePreset,
  NewWorkoutExercise,
  Note,
  NutritionDayTotal,
  NutritionLog,
  Task,
  TaskStatus,
  ThemePreset,
  WorkoutExercise,
  WorkoutExerciseGroup,
  WorkoutLog,
  WorkoutSessionState
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
    reorder: (orderedIds: number[]) => invoke<void>("workouts:reorder", orderedIds),
    logSet: (exerciseId: number, setNumber: number, reps: number, weightKg: number | null, notes: string) =>
      invoke<WorkoutLog>("workouts:logSet", exerciseId, setNumber, reps, weightKg, notes),
    logsForExercise: (exerciseId: number, limit = 30) =>
      invoke<WorkoutLog[]>("workouts:logsForExercise", exerciseId, limit),
    logsToday: () => invoke<WorkoutLog[]>("workouts:logsToday"),
    removeLog: (id: number) => invoke<void>("workouts:removeLog", id),
    volumeByExercise: (exerciseId: number, days = 14) =>
      invoke<ExerciseVolumePoint[]>("workouts:volumeByExercise", exerciseId, days),
    restoreDefaults: () => invoke<WorkoutExercise[]>("workouts:restoreDefaults"),
    pickMedia: (exerciseId: number, kind: "video" | "image") =>
      invoke<string | null>("workouts:pickMedia", exerciseId, kind),
    pickMediaFile: (kind: "video" | "image") => invoke<string | null>("workouts:pickMediaFile", kind)
  },
  workoutSession: {
    start: (day: string) => invoke<WorkoutSessionState>("workoutSession:start", day),
    getState: () => invoke<WorkoutSessionState | null>("workoutSession:getState"),
    getGroups: (day: string) => invoke<WorkoutExerciseGroup[]>("workoutSession:getGroups", day),
    startExercise: () => invoke<WorkoutSessionState>("workoutSession:startExercise"),
    finishSet: () => invoke<WorkoutSessionState>("workoutSession:finishSet"),
    setRestSeconds: (seconds: number) => invoke<WorkoutSessionState | null>("workoutSession:setRestSeconds", seconds),
    pauseRest: () => invoke<WorkoutSessionState | null>("workoutSession:pauseRest"),
    resumeRest: () => invoke<WorkoutSessionState | null>("workoutSession:resumeRest"),
    resetRest: () => invoke<WorkoutSessionState | null>("workoutSession:resetRest"),
    skipRest: () => invoke<WorkoutSessionState | null>("workoutSession:skipRest"),
    refreshGroups: () => invoke<WorkoutSessionState | null>("workoutSession:refreshGroups"),
    cancel: () => invoke<void>("workoutSession:cancel"),
    close: () => invoke<void>("workoutSession:close"),
    onChanged: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on("workoutSession:changed", listener);
      return () => {
        ipcRenderer.removeListener("workoutSession:changed", listener);
      };
    }
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
    totalToday: () => invoke<number>("hydration:totalToday"),
    weeklyTotals: () => invoke<HydrationDayTotal[]>("hydration:weeklyTotals")
  },
  focusTimer: {
    getActive: () => invoke<FocusSession | null>("focusTimer:getActive"),
    start: (category: string, label: string) => invoke<FocusSession>("focusTimer:start", category, label),
    pause: (id: number) => invoke<FocusSession>("focusTimer:pause", id),
    resume: (id: number) => invoke<FocusSession>("focusTimer:resume", id),
    stop: (id: number) => invoke<FocusSession>("focusTimer:stop", id),
    reopen: (id: number) => invoke<FocusSession>("focusTimer:reopen", id),
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
  themePresets: {
    list: () => invoke<ThemePreset[]>("themePresets:list"),
    add: (input: NewThemePreset) => invoke<ThemePreset>("themePresets:add", input),
    rename: (id: number, name: string) => invoke<ThemePreset>("themePresets:rename", id, name),
    update: (id: number, fields: Partial<NewThemePreset>) => invoke<ThemePreset>("themePresets:update", id, fields),
    remove: (id: number) => invoke<void>("themePresets:remove", id)
  },
  habits: {
    list: (month?: string) => invoke<HabitWithLogs[]>("habits:list", month),
    add: (input: NewHabit) => invoke<HabitWithLogs>("habits:add", input),
    update: (id: number, fields: Partial<NewHabit>) => invoke<HabitWithLogs>("habits:update", id, fields),
    archive: (id: number) => invoke<void>("habits:archive", id),
    remove: (id: number) => invoke<void>("habits:remove", id),
    toggleDate: (id: number, date: string, month?: string) =>
      invoke<HabitWithLogs>("habits:toggleDate", id, date, month)
  },
  foods: {
    list: () => invoke<Food[]>("foods:list"),
    add: (input: NewFood) => invoke<Food>("foods:add", input),
    update: (id: number, fields: Partial<NewFood>) => invoke<Food>("foods:update", id, fields),
    remove: (id: number) => invoke<void>("foods:remove", id)
  },
  journal: {
    getByDate: (date: string) => invoke<JournalEntry | null>("journal:getByDate", date),
    save: (date: string, fields: { morningIntentions?: string; eveningReflection?: string }) =>
      invoke<JournalEntry>("journal:save", date, fields),
    listDumpsByDate: (date: string) => invoke<BrainDump[]>("journal:listDumpsByDate", date),
    addDump: (date: string, content: string) => invoke<BrainDump>("journal:addDump", date, content),
    removeDump: (id: number) => invoke<void>("journal:removeDump", id),
    datesWithEntries: () => invoke<string[]>("journal:datesWithEntries")
  },
  notes: {
    list: () => invoke<Note[]>("notes:list"),
    add: (input: NewNote) => invoke<Note>("notes:add", input),
    update: (id: number, fields: Partial<NewNote>) => invoke<Note>("notes:update", id, fields),
    remove: (id: number) => invoke<void>("notes:remove", id),
    saveImage: (dataUrl: string, suggestedName?: string) => invoke<string>("notes:saveImage", dataUrl, suggestedName),
    search: (query: string) => invoke<Note[]>("notes:search", query)
  },
  system: {
    exportAll: () => invoke<BackupFile>("system:exportAll")
  },
  backup: {
    /** Opens a save dialog; resolves to the written path, or null if cancelled. */
    exportToFile: () => invoke<string | null>("backup:export"),
    /** Opens an open dialog; resolves to a restore summary, or null if cancelled. */
    importFromFile: () => invoke<ImportSummary | null>("backup:import")
  },
  updates: {
    version: () => invoke<string>("updates:version"),
    check: () => invoke<UpdateCheck>("updates:check"),
    openRelease: (url: string) => invoke<void>("updates:openRelease", url),
    whatsNew: () => invoke<WhatsNew>("updates:whatsNew"),
    acknowledge: () => invoke<void>("updates:acknowledge"),
    releaseNotes: () => invoke<WhatsNew>("updates:releaseNotes")
  },
  events: {
    /** Fires in every window whenever the focus session changes anywhere. */
    onFocusChanged: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on("focusTimer:changed", listener);
      // Returns void, not the IpcRenderer that .off() hands back, so it can be
      // used directly as a useEffect cleanup.
      return () => {
        ipcRenderer.off("focusTimer:changed", listener);
      };
    }
  },
  widget: {
    /** Opens the pinned timer and hides the main window. */
    open: () => invoke<void>("widget:open"),
    close: () => invoke<void>("widget:close"),
    isOpen: () => invoke<boolean>("widget:isOpen"),
    /** From the widget: dismiss it and bring the app back. */
    restoreMain: () => invoke<void>("widget:restoreMain")
  },
  window: {
    /** Pops the native application menu just below the burger button (x, y). */
    showMenu: (x: number, y: number) => invoke<void>("window:showMenu", x, y),
    /** Repaints the Windows window-control overlay to match the theme. */
    setTitleBarOverlay: (overlay: { color: string; symbolColor: string }) =>
      invoke<void>("window:setTitleBarOverlay", overlay)
  }
};

export type Api = typeof api;

contextBridge.exposeInMainWorld("api", api);
