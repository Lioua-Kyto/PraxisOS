import { ipcMain } from "electron";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { habitLogs, habits } from "../db/schema";
import { localDateString } from "../../shared/datetime";
import type { Habit, HabitCadence, HabitWithLogs, NewHabit } from "../../shared/types";

export const WORKOUT_SCHEDULE_MANAGER = "workout-schedule";

function parseWeekdays(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function rowToHabit(row: typeof habits.$inferSelect): Habit {
  return {
    ...row,
    cadence: row.cadence as HabitCadence,
    weekdays: parseWeekdays(row.weekdays),
    archived: Boolean(row.archived)
  };
}

function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getDay();
}

/** Is this habit supposed to be performed on the given date? */
export function isScheduledOn(habit: Pick<Habit, "cadence" | "weekdays">, dateStr: string): boolean {
  if (habit.cadence === "daily") return true;
  if (!habit.weekdays.length) return true;
  return habit.weekdays.includes(weekdayOf(dateStr));
}

/** Every date in the given month (YYYY-MM) this habit is scheduled for. */
function scheduledDatesInMonth(habit: Pick<Habit, "cadence" | "weekdays">, month: string): string[] {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const dates: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;
    if (isScheduledOn(habit, dateStr)) dates.push(dateStr);
  }
  return dates;
}

/**
 * Counts back over the habit's own scheduled dates, so a Friday-only habit
 * doesn't lose its streak on Saturday and a custom 3-day habit only counts
 * the days it actually asks for.
 */
function computeStreak(habit: Pick<Habit, "cadence" | "weekdays">, completed: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // An unfinished *today* shouldn't zero out an otherwise-live streak.
  if (isScheduledOn(habit, localDateString(cursor)) && !completed.has(localDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  // Bounded lookback so a long-dormant habit can't spin here forever.
  for (let i = 0; i < 366 * 2; i++) {
    const dateStr = localDateString(cursor);
    if (isScheduledOn(habit, dateStr)) {
      if (!completed.has(dateStr)) break;
      streak += 1;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function withLogs(habit: Habit, month: string): HabitWithLogs {
  const logs = db().select({ date: habitLogs.date }).from(habitLogs).where(eq(habitLogs.habitId, habit.id)).all();
  const allCompleted = new Set(logs.map((l) => l.date));
  return {
    ...habit,
    completedDates: [...allCompleted].filter((d) => d.startsWith(month)),
    scheduledDates: scheduledDatesInMonth(habit, month),
    streak: computeStreak(habit, allCompleted)
  };
}

function currentMonth(): string {
  return localDateString().slice(0, 7);
}

export function registerHabitHandlers(): void {
  ipcMain.handle("habits:list", (_e, month?: string): HabitWithLogs[] => {
    const target = month ?? currentMonth();
    return db()
      .select()
      .from(habits)
      .where(eq(habits.archived, false))
      .orderBy(asc(habits.orderIndex), asc(habits.id))
      .all()
      .map(rowToHabit)
      .map((h) => withLogs(h, target));
  });

  ipcMain.handle("habits:add", (_e, input: NewHabit): HabitWithLogs => {
    const row = db()
      .insert(habits)
      .values({
        name: input.name,
        cadence: input.cadence,
        weekdays: JSON.stringify(input.weekdays ?? []),
        color: input.color ?? "primary"
      })
      .returning()
      .get();
    return withLogs(rowToHabit(row), currentMonth());
  });

  ipcMain.handle("habits:update", (_e, id: number, fields: Partial<NewHabit>): HabitWithLogs => {
    const { weekdays, ...rest } = fields;
    const row = db()
      .update(habits)
      .set({ ...rest, ...(weekdays !== undefined ? { weekdays: JSON.stringify(weekdays) } : {}) })
      .where(eq(habits.id, id))
      .returning()
      .get();
    return withLogs(rowToHabit(row), currentMonth());
  });

  ipcMain.handle("habits:archive", (_e, id: number): void => {
    db().update(habits).set({ archived: true }).where(eq(habits.id, id)).run();
  });

  ipcMain.handle("habits:remove", (_e, id: number): void => {
    db().delete(habits).where(eq(habits.id, id)).run();
  });

  ipcMain.handle("habits:toggleDate", (_e, id: number, date: string, month?: string): HabitWithLogs => {
    const habitRow = db().select().from(habits).where(eq(habits.id, id)).get();
    if (!habitRow) throw new Error("Habit not found");
    const habit = rowToHabit(habitRow);

    // Off-schedule check-ins are allowed on purpose. A workout done outside or
    // at a gym still counts, so the schedule decides what the app asks for, not
    // what the user is permitted to record. Only the future is refused.
    if (date > localDateString()) {
      throw new Error("You can't check in for a day that hasn't happened yet.");
    }

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
    return withLogs(habit, month ?? currentMonth());
  });
}

/**
 * Mirrors the Settings workout schedule onto a single auto-managed habit:
 * a custom-cadence habit whose weekdays are exactly the days that have a
 * workout assigned. Removing every assignment archives it.
 */
export function syncWorkoutScheduleHabit(schedule: Record<string, string>): void {
  const weekdays = Object.entries(schedule)
    .filter(([, dayName]) => Boolean(dayName))
    .map(([weekday]) => Number(weekday))
    .sort();

  const existing = db().select().from(habits).where(eq(habits.managedBy, WORKOUT_SCHEDULE_MANAGER)).get();

  if (!weekdays.length) {
    if (existing) db().update(habits).set({ archived: true }).where(eq(habits.id, existing.id)).run();
    return;
  }

  if (existing) {
    db()
      .update(habits)
      .set({ cadence: "custom", weekdays: JSON.stringify(weekdays), archived: false })
      .where(eq(habits.id, existing.id))
      .run();
    return;
  }

  db()
    .insert(habits)
    .values({
      name: "Workout",
      cadence: "custom",
      weekdays: JSON.stringify(weekdays),
      color: "primary",
      managedBy: WORKOUT_SCHEDULE_MANAGER
    })
    .run();
}

/**
 * Marks today complete for the auto-managed workout habit (falling back to a
 * plain habit named "Workout"). Idempotent, and never un-marks.
 */
export function completeWorkoutHabitToday(fallbackName: string): void {
  const managed = db().select().from(habits).where(eq(habits.managedBy, WORKOUT_SCHEDULE_MANAGER)).get();
  const habit = managed ?? db().select().from(habits).where(eq(habits.name, fallbackName)).get();
  if (!habit) return;

  const date = localDateString();
  const existing = db()
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habit.id), eq(habitLogs.date, date)))
    .get();
  if (!existing) db().insert(habitLogs).values({ habitId: habit.id, date }).run();
}
