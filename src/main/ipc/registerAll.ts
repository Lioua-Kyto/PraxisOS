import { registerBackupHandlers } from "./backup";
import { registerBudgetHandlers } from "./budget";
import { registerCourseHandlers } from "./courses";
import { registerFocusTimerHandlers } from "./focusTimer";
import { registerFoodHandlers } from "./foods";
import { registerHabitHandlers } from "./habits";
import { registerJournalHandlers } from "./journal";
import { registerNoteHandlers } from "./notes";
import { registerNutritionHandlers } from "./nutrition";
import { registerSettingsHandlers } from "./settings";
import { registerSystemHandlers } from "./system";
import { registerTaskHandlers } from "./tasks";
import { registerThemePresetHandlers } from "./themePresets";
import { registerWorkoutHandlers } from "./workouts";
import { registerWorkoutSessionHandlers } from "./workoutSession";
import { registerWidgetHandlers } from "./widget";
import { registerUpdateHandlers } from "./updates";

export function registerAllIpcHandlers(): void {
  registerTaskHandlers();
  registerCourseHandlers();
  registerWorkoutHandlers();
  registerWorkoutSessionHandlers();
  registerNutritionHandlers();
  registerFocusTimerHandlers();
  registerBudgetHandlers();
  registerSettingsHandlers();
  registerSystemHandlers();
  registerBackupHandlers();
  registerHabitHandlers();
  registerFoodHandlers();
  registerJournalHandlers();
  registerNoteHandlers();
  registerThemePresetHandlers();
  registerWidgetHandlers();
  registerUpdateHandlers();
}
