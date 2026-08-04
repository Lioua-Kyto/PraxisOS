import { ipcMain } from "electron";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { themePresets } from "../db/schema";
import type { NewThemePreset, ThemePreset } from "../../shared/types";

function rowToPreset(row: typeof themePresets.$inferSelect): ThemePreset {
  return { ...row, baseTheme: row.baseTheme as ThemePreset["baseTheme"] };
}

export function registerThemePresetHandlers(): void {
  ipcMain.handle("themePresets:list", (): ThemePreset[] =>
    db().select().from(themePresets).orderBy(desc(themePresets.id)).all().map(rowToPreset)
  );

  ipcMain.handle("themePresets:add", (_e, input: NewThemePreset): ThemePreset => {
    const row = db().insert(themePresets).values(input).returning().get();
    return rowToPreset(row);
  });

  ipcMain.handle("themePresets:rename", (_e, id: number, name: string): ThemePreset => {
    const row = db().update(themePresets).set({ name }).where(eq(themePresets.id, id)).returning().get();
    return rowToPreset(row);
  });

  ipcMain.handle(
    "themePresets:update",
    (_e, id: number, fields: Partial<NewThemePreset>): ThemePreset => {
      const row = db().update(themePresets).set(fields).where(eq(themePresets.id, id)).returning().get();
      return rowToPreset(row);
    }
  );

  ipcMain.handle("themePresets:remove", (_e, id: number): void => {
    db().delete(themePresets).where(eq(themePresets.id, id)).run();
  });
}
