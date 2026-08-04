import { ipcMain } from "electron";
import { db } from "../db/client";
import {
  brainDumps,
  budgetCategories,
  budgetTransactions,
  courses,
  focusSessions,
  foods,
  habitLogs,
  habits,
  hydrationLogs,
  journalEntries,
  notes,
  nutritionLogs,
  tasks,
  workoutExercises,
  workoutLogs
} from "../db/schema";
import { rowToNote } from "./notes";
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
      budget_categories: dbi.select().from(budgetCategories).all() as DataExport["budget_categories"],
      habits: dbi
        .select()
        .from(habits)
        .all()
        .map((h) => ({
          ...h,
          cadence: h.cadence as DataExport["habits"][number]["cadence"],
          weekdays: h.weekdays ? (JSON.parse(h.weekdays) as number[]) : [],
          archived: Boolean(h.archived)
        })),
      habit_logs: dbi.select().from(habitLogs).all() as DataExport["habit_logs"],
      journal_entries: dbi.select().from(journalEntries).all() as DataExport["journal_entries"],
      brain_dumps: dbi.select().from(brainDumps).all() as DataExport["brain_dumps"],
      notes: dbi.select().from(notes).all().map(rowToNote),
      foods: dbi.select().from(foods).all()
    };
  });
}
