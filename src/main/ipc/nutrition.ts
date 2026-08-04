import { ipcMain } from "electron";
import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/client";
import { hydrationLogs, nutritionLogs } from "../db/schema";
import type { HydrationDayTotal, HydrationLog, NewNutritionLog, NutritionDayTotal, NutritionLog } from "../../shared/types";

export function registerNutritionHandlers(): void {
  ipcMain.handle("nutrition:listToday", (): NutritionLog[] =>
    db()
      .select()
      .from(nutritionLogs)
      .where(eq(nutritionLogs.date, sql`date('now')`))
      .orderBy(desc(nutritionLogs.id))
      .all()
  );

  ipcMain.handle("nutrition:listByDate", (_e, date: string): NutritionLog[] =>
    db().select().from(nutritionLogs).where(eq(nutritionLogs.date, date)).orderBy(desc(nutritionLogs.id)).all()
  );

  ipcMain.handle("nutrition:add", (_e, entry: NewNutritionLog): NutritionLog =>
    db()
      .insert(nutritionLogs)
      .values({
        meal: entry.meal ?? "",
        food: entry.food,
        calories: entry.calories ?? 0,
        proteinG: entry.proteinG ?? 0
      })
      .returning()
      .get()
  );

  ipcMain.handle("nutrition:remove", (_e, id: number): void => {
    db().delete(nutritionLogs).where(eq(nutritionLogs.id, id)).run();
  });

  ipcMain.handle("nutrition:weeklyTotals", (): NutritionDayTotal[] =>
    db()
      .select({
        date: nutritionLogs.date,
        calories: sql<number>`SUM(${nutritionLogs.calories})`,
        protein: sql<number>`SUM(${nutritionLogs.proteinG})`
      })
      .from(nutritionLogs)
      .where(gte(nutritionLogs.date, sql`date('now','-6 days')`))
      .groupBy(nutritionLogs.date)
      .orderBy(nutritionLogs.date)
      .all()
  );

  // Hydration lives alongside nutrition in the UI (consolidated panel) but
  // keeps its own table/channel namespace since it's a distinct log type.
  ipcMain.handle("hydration:listToday", (): HydrationLog[] =>
    db()
      .select()
      .from(hydrationLogs)
      .where(eq(hydrationLogs.date, sql`date('now')`))
      .orderBy(desc(hydrationLogs.id))
      .all()
  );

  ipcMain.handle("hydration:add", (_e, amountMl: number): HydrationLog =>
    db().insert(hydrationLogs).values({ amountMl }).returning().get()
  );

  ipcMain.handle("hydration:remove", (_e, id: number): void => {
    db().delete(hydrationLogs).where(eq(hydrationLogs.id, id)).run();
  });

  ipcMain.handle("hydration:weeklyTotals", (): HydrationDayTotal[] =>
    db()
      .select({ date: hydrationLogs.date, ml: sql<number>`SUM(${hydrationLogs.amountMl})` })
      .from(hydrationLogs)
      .where(gte(hydrationLogs.date, sql`date('now','-6 days')`))
      .groupBy(hydrationLogs.date)
      .orderBy(hydrationLogs.date)
      .all()
  );

  ipcMain.handle("hydration:totalToday", (): number => {
    const row = db()
      .select({ total: sql<number>`COALESCE(SUM(${hydrationLogs.amountMl}), 0)` })
      .from(hydrationLogs)
      .where(eq(hydrationLogs.date, sql`date('now')`))
      .get();
    return row?.total ?? 0;
  });
}
