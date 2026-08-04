import { ipcMain } from "electron";
import { db } from "../db/client";
import { settings } from "../db/schema";
import { syncWorkoutScheduleHabit } from "./habits";
import type { AppSettings } from "../../shared/types";

const DEFAULT_WORKOUT_DAYS = ["Push", "Pull", "Legs"];

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

function rowsToSettings(rows: Array<{ key: string; value: string }>): AppSettings {
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const workoutDays = parseJson<string[]>(map.workoutDays, DEFAULT_WORKOUT_DAYS);
  return {
    theme: (map.theme as AppSettings["theme"]) ?? "dark",
    font: (map.font as AppSettings["font"]) ?? "sans",
    waterGoalMl: Number(map.waterGoalMl ?? 2500),
    calorieGoal: Number(map.calorieGoal ?? 2400),
    dailyBudgetLimit: Number(map.dailyBudgetLimit ?? 60),
    activePresetId: map.activePresetId ? Number(map.activePresetId) : null,
    workoutDays: workoutDays.length ? workoutDays : DEFAULT_WORKOUT_DAYS,
    workoutSchedule: parseJson<Record<string, string>>(map.workoutSchedule, {}),
    proteinGoal: Number(map.proteinGoal ?? 150),
    weekStartsOn: Number(map.weekStartsOn ?? 1),
    defaultRestSeconds: Number(map.defaultRestSeconds ?? 60),
    defaultFocusCategory: map.defaultFocusCategory ?? "deep_work",
    currencySymbol: map.currencySymbol ?? "",
    confirmBeforeEndingWorkout: map.confirmBeforeEndingWorkout !== "false",
    habitRemindersEnabled: map.habitRemindersEnabled === "true",
    habitReminderTime: map.habitReminderTime ?? "20:00"
  };
}

export function getSettings(): AppSettings {
  return rowsToSettings(db().select().from(settings).all());
}

export function registerSettingsHandlers(): void {
  ipcMain.handle("settings:get", (): AppSettings => getSettings());

  ipcMain.handle("settings:set", (_e, patch: Partial<AppSettings>): AppSettings => {
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      const stringValue =
        value === null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
      db()
        .insert(settings)
        .values({ key, value: stringValue })
        .onConflictDoUpdate({ target: settings.key, set: { value: stringValue } })
        .run();
    }

    const next = getSettings();
    // Keep the auto-managed "Workout" habit in step with the schedule so the
    // Habit Matrix only expects a workout on days the plan actually has one.
    if (patch.workoutSchedule !== undefined) syncWorkoutScheduleHabit(next.workoutSchedule);
    return next;
  });
}
