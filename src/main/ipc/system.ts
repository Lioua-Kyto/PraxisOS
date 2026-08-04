import { ipcMain } from "electron";
import { db } from "../db/client";
import {
  budgetCategories,
  budgetTransactions,
  courses,
  focusSessions,
  hydrationLogs,
  nutritionLogs,
  tasks,
  workoutExercises,
  workoutLogs
} from "../db/schema";
import type { DataExport } from "../../shared/types";

export function registerSystemHandlers(): void {
  ipcMain.handle("system:exportAll", (): DataExport => {
    const dbi = db();
    return {
      tasks: dbi.select().from(tasks).all() as DataExport["tasks"],
      courses: dbi.select().from(courses).all() as DataExport["courses"],
      workout_exercises: dbi.select().from(workoutExercises).all() as DataExport["workout_exercises"],
      workout_logs: dbi.select().from(workoutLogs).all() as DataExport["workout_logs"],
      nutrition_logs: dbi.select().from(nutritionLogs).all() as DataExport["nutrition_logs"],
      hydration_logs: dbi.select().from(hydrationLogs).all() as DataExport["hydration_logs"],
      focus_sessions: dbi.select().from(focusSessions).all() as DataExport["focus_sessions"],
      budget_transactions: dbi.select().from(budgetTransactions).all() as DataExport["budget_transactions"],
      budget_categories: dbi.select().from(budgetCategories).all() as DataExport["budget_categories"]
    };
  });
}
