import { ipcMain } from "electron";
import { asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { foods } from "../db/schema";
import type { Food, NewFood } from "../../shared/types";

export function registerFoodHandlers(): void {
  ipcMain.handle("foods:list", (): Food[] => db().select().from(foods).orderBy(asc(foods.name)).all());

  ipcMain.handle("foods:add", (_e, input: NewFood): Food =>
    db()
      .insert(foods)
      .values({
        name: input.name,
        category: input.category || "Any",
        calories: input.calories ?? 0,
        proteinG: input.proteinG ?? 0,
        carbsG: input.carbsG ?? 0,
        servingLabel: input.servingLabel || "1 serving"
      })
      .returning()
      .get()
  );

  ipcMain.handle("foods:update", (_e, id: number, fields: Partial<NewFood>): Food =>
    db().update(foods).set(fields).where(eq(foods.id, id)).returning().get()
  );

  ipcMain.handle("foods:remove", (_e, id: number): void => {
    db().delete(foods).where(eq(foods.id, id)).run();
  });
}
