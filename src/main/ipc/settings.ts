import { ipcMain } from "electron";
import { db } from "../db/client";
import { settings } from "../db/schema";
import type { AppSettings } from "../../shared/types";

const NUMERIC_KEYS: Array<keyof AppSettings> = ["waterGoalMl", "calorieGoal", "dailyBudgetLimit"];

function rowsToSettings(rows: Array<{ key: string; value: string }>): AppSettings {
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    theme: (map.theme as AppSettings["theme"]) ?? "dark",
    font: (map.font as AppSettings["font"]) ?? "sans",
    waterGoalMl: Number(map.waterGoalMl ?? 2500),
    calorieGoal: Number(map.calorieGoal ?? 2400),
    dailyBudgetLimit: Number(map.dailyBudgetLimit ?? 60)
  };
}

export function registerSettingsHandlers(): void {
  ipcMain.handle("settings:get", (): AppSettings => rowsToSettings(db().select().from(settings).all()));

  ipcMain.handle("settings:set", (_e, patch: Partial<AppSettings>): AppSettings => {
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      const stringValue = NUMERIC_KEYS.includes(key as keyof AppSettings) ? String(value) : String(value);
      db()
        .insert(settings)
        .values({ key, value: stringValue })
        .onConflictDoUpdate({ target: settings.key, set: { value: stringValue } })
        .run();
    }
    return rowsToSettings(db().select().from(settings).all());
  });
}
