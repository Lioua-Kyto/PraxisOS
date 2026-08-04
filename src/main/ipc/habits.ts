import { ipcMain } from "electron";
import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "../db/client";
import { habitLogs, habits } from "../db/schema";
import type { Habit, HabitCadence, HabitWithLogs, NewHabit } from "../../shared/types";

const HEATMAP_DAYS = 140;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

function computeDailyStreak(completedDates: Set<string>): number {
  let streak = 0;
  let cursor = new Date();
  // If today isn't done yet, the streak still counts from yesterday backward
  // (an in-progress day shouldn't zero out an otherwise-live streak).
  if (!completedDates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (completedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function computeWeeklyStreak(completedDates: Set<string>): number {
  const weeks = new Set([...completedDates].map(isoWeekKey));
  let streak = 0;
  const cursor = new Date();
  let weekKey = isoWeekKey(cursor.toISOString().slice(0, 10));
  if (!weeks.has(weekKey)) {
    cursor.setDate(cursor.getDate() - 7);
    weekKey = isoWeekKey(cursor.toISOString().slice(0, 10));
  }
  while (weeks.has(weekKey)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
    weekKey = isoWeekKey(cursor.toISOString().slice(0, 10));
  }
  return streak;
}

function rowToHabit(row: typeof habits.$inferSelect): Habit {
  return { ...row, cadence: row.cadence as HabitCadence, archived: Boolean(row.archived) };
}

function withLogs(habit: Habit): HabitWithLogs {
  const logs = db()
    .select({ date: habitLogs.date })
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habit.id), gte(habitLogs.date, daysAgoStr(HEATMAP_DAYS))))
    .all();
  const completedDates = [...new Set(logs.map((l) => l.date))];
  const dateSet = new Set(completedDates);
  const streak = habit.cadence === "weekly" ? computeWeeklyStreak(dateSet) : computeDailyStreak(dateSet);
  return { ...habit, completedDates, streak };
}

export function registerHabitHandlers(): void {
  ipcMain.handle("habits:list", (): HabitWithLogs[] =>
    db()
      .select()
      .from(habits)
      .where(eq(habits.archived, false))
      .orderBy(asc(habits.orderIndex), asc(habits.id))
      .all()
      .map(rowToHabit)
      .map(withLogs)
  );

  ipcMain.handle("habits:add", (_e, input: NewHabit): HabitWithLogs => {
    const row = db()
      .insert(habits)
      .values({ name: input.name, cadence: input.cadence, color: input.color ?? "primary" })
      .returning()
      .get();
    return withLogs(rowToHabit(row));
  });

  ipcMain.handle("habits:update", (_e, id: number, fields: Partial<NewHabit>): HabitWithLogs => {
    const row = db().update(habits).set(fields).where(eq(habits.id, id)).returning().get();
    return withLogs(rowToHabit(row));
  });

  ipcMain.handle("habits:archive", (_e, id: number): void => {
    db().update(habits).set({ archived: true }).where(eq(habits.id, id)).run();
  });

  ipcMain.handle("habits:remove", (_e, id: number): void => {
    db().delete(habits).where(eq(habits.id, id)).run();
  });

  ipcMain.handle("habits:toggleDate", (_e, id: number, date: string): HabitWithLogs => {
    const existing = db()
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, id), eq(habitLogs.date, date)))
      .get();
    if (existing) {
      db().delete(habitLogs).where(eq(habitLogs.id, existing.id)).run();
    } else {
      db().insert(habitLogs).values({ habitId: id, date }).run();
    }
    const habit = db().select().from(habits).where(eq(habits.id, id)).get()!;
    return withLogs(rowToHabit(habit));
  });
}

// Used by the workout-session automation to mark today's "Workout" habit
// complete without going through the toggle (idempotent — never un-marks).
export function completeHabitToday(habitName: string): void {
  const habit = db().select().from(habits).where(eq(habits.name, habitName)).get();
  if (!habit) return;
  const date = todayStr();
  const existing = db()
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habit.id), eq(habitLogs.date, date)))
    .get();
  if (!existing) {
    db().insert(habitLogs).values({ habitId: habit.id, date }).run();
  }
}
