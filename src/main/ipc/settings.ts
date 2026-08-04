import { ipcMain } from "electron";
import { db } from "../db/client";
import { settings } from "../db/schema";
import type { AppSettings } from "../../shared/types";

const DEFAULT_WORKOUT_DAYS = ["Push", "Pull", "Legs"];

function rowsToSettings(rows: Array<{ key: string; value: string }>): AppSettings {
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  let workoutDays = DEFAULT_WORKOUT_DAYS;
  if (map.workoutDays) {
    try {
      const parsed = JSON.parse(map.workoutDays);
      if (Array.isArray(parsed) && parsed.length > 0) workoutDays = parsed;
    } catch {
      // fall back to defaults on corrupt data
    }
  }
  return {
    theme: (map.theme as AppSettings["theme"]) ?? "dark",
    font: (map.font as AppSettings["font"]) ?? "sans",
    waterGoalMl: Number(map.waterGoalMl ?? 2500),
    calorieGoal: Number(map.calorieGoal ?? 2400),
    dailyBudgetLimit: Number(map.dailyBudgetLimit ?? 60),
    activePresetId: map.activePresetId ? Number(map.activePresetId) : null,
    workoutDays
  };
}

export function registerSettingsHandlers(): void {
  ipcMain.handle("settings:get", (): AppSettings => rowsToSettings(db().select().from(settings).all()));

  ipcMain.handle("settings:set", (_e, patch: Partial<AppSettings>): AppSettings => {
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      const stringValue = value === null ? "" : Array.isArray(value) ? JSON.stringify(value) : String(value);
      db()
        .insert(settings)
        .values({ key, value: stringValue })
        .onConflictDoUpdate({ target: settings.key, set: { value: stringValue } })
        .run();
    }
    return rowsToSettings(db().select().from(settings).all());
  });
}
