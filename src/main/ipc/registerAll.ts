import { registerBudgetHandlers } from "./budget";
import { registerCourseHandlers } from "./courses";
import { registerFocusTimerHandlers } from "./focusTimer";
import { registerNutritionHandlers } from "./nutrition";
import { registerSettingsHandlers } from "./settings";
import { registerSystemHandlers } from "./system";
import { registerTaskHandlers } from "./tasks";
import { registerWorkoutHandlers } from "./workouts";

export function registerAllIpcHandlers(): void {
  registerTaskHandlers();
  registerCourseHandlers();
  registerWorkoutHandlers();
  registerNutritionHandlers();
  registerFocusTimerHandlers();
  registerBudgetHandlers();
  registerSettingsHandlers();
  registerSystemHandlers();
}
