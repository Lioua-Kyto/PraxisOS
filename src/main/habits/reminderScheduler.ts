import { Notification } from "electron";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { habitLogs, habits } from "../db/schema";
import { isScheduledOn } from "../ipc/habits";
import { getSettings } from "../ipc/settings";
import { localDateString } from "../../shared/datetime";
import type { Habit, HabitCadence } from "../../shared/types";

const CHECK_INTERVAL_MS = 60_000;

let timer: NodeJS.Timeout | null = null;
/** Guards against re-notifying for the same day if the app stays open. */
let lastNotifiedDate = "";

function parseWeekdays(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function pendingHabitsToday(): Habit[] {
  const date = localDateString();
  return db()
    .select()
    .from(habits)
    .where(eq(habits.archived, false))
    .all()
    .map((row) => ({
      ...row,
      cadence: row.cadence as HabitCadence,
      weekdays: parseWeekdays(row.weekdays),
      archived: Boolean(row.archived)
    }))
    .filter((habit) => {
      if (!isScheduledOn(habit, date)) return false;
      const done = db()
        .select()
        .from(habitLogs)
        .where(and(eq(habitLogs.habitId, habit.id), eq(habitLogs.date, date)))
        .get();
      return !done;
    });
}

function maybeNotify(): void {
  const settings = getSettings();
  if (!settings.habitRemindersEnabled) return;

  const now = new Date();
  const [hour, minute] = settings.habitReminderTime.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return;

  const today = localDateString();
  if (lastNotifiedDate === today) return;
  // Fire once we're at or past the configured time — so the reminder still
  // arrives if the app was closed when the moment passed.
  if (now.getHours() < hour || (now.getHours() === hour && now.getMinutes() < minute)) return;

  const pending = pendingHabitsToday();
  lastNotifiedDate = today;
  if (!pending.length || !Notification.isSupported()) return;

  const names = pending.map((h) => h.name);
  const body = names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;

  new Notification({
    title: pending.length === 1 ? "1 habit still open today" : `${pending.length} habits still open today`,
    body
  }).show();
}

export function startHabitReminders(): void {
  stopHabitReminders();
  // Poll rather than schedule a single timeout: it survives the machine
  // sleeping through the target time, and picks up settings changes without
  // needing to be re-armed.
  timer = setInterval(maybeNotify, CHECK_INTERVAL_MS);
  maybeNotify();
}

export function stopHabitReminders(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
