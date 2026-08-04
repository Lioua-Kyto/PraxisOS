import { ipcMain } from "electron";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { focusSessions } from "../db/schema";
import { daysAgo, localDateString, localDateTimeString, parseStoredDateTime, secondsBetween } from "../../shared/datetime";
import type {
  FocusCategoryTotal,
  FocusDayCategoryTotal,
  FocusSession,
  ManualFocusEntry
} from "../../shared/types";

type Row = typeof focusSessions.$inferSelect;

function rowToSession(row: Row): FocusSession {
  return {
    id: row.id,
    category: row.category,
    label: row.label,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    durationSeconds: row.durationSeconds,
    status: row.status as FocusSession["status"],
    accumulatedSeconds: row.accumulatedSeconds,
    lastStartedAt: row.lastStartedAt
  };
}

const ACTIVE_STATUSES = ["running", "paused"] as const;

function getActiveRow(): Row | undefined {
  return db()
    .select()
    .from(focusSessions)
    .where(inArray(focusSessions.status, [...ACTIVE_STATUSES]))
    .get();
}

function secondsSince(stored: string): number {
  return Math.max(0, Math.floor((Date.now() - parseStoredDateTime(stored).getTime()) / 1000));
}

// Guards against duplicate "in progress" sessions: if one is already
// running/paused, hand it back instead of inserting a second row. Exported
// (not just an IPC handler) so the workout-session engine can auto-start a
// "training" session without round-tripping through IPC.
export function startFocusSession(category: string, label: string): FocusSession {
  const existing = getActiveRow();
  if (existing) return rowToSession(existing);

  const now = new Date();
  const row = db()
    .insert(focusSessions)
    .values({
      category,
      label: label || null,
      // Explicit local date/time — the column default is SQLite's UTC
      // date('now'), which files late-evening sessions under tomorrow.
      date: localDateString(now),
      startTime: localDateTimeString(now),
      status: "running",
      accumulatedSeconds: 0,
      lastStartedAt: localDateTimeString(now)
    })
    .returning()
    .get();
  return rowToSession(row);
}

export function stopFocusSession(id: number): FocusSession {
  const current = db().select().from(focusSessions).where(eq(focusSessions.id, id)).get();
  if (!current) throw new Error(`Focus session ${id} not found`);

  const finalAccumulated =
    current.status === "running" && current.lastStartedAt
      ? current.accumulatedSeconds + secondsSince(current.lastStartedAt)
      : current.accumulatedSeconds;

  const row = db()
    .update(focusSessions)
    .set({
      status: "completed",
      endTime: localDateTimeString(),
      durationSeconds: finalAccumulated,
      accumulatedSeconds: finalAccumulated,
      lastStartedAt: null
    })
    .where(eq(focusSessions.id, id))
    .returning()
    .get();
  return rowToSession(row);
}

export function registerFocusTimerHandlers(): void {
  ipcMain.handle("focusTimer:getActive", (): FocusSession | null => {
    const row = getActiveRow();
    return row ? rowToSession(row) : null;
  });

  ipcMain.handle("focusTimer:start", (_e, category: string, label: string): FocusSession =>
    startFocusSession(category, label)
  );

  ipcMain.handle("focusTimer:pause", (_e, id: number): FocusSession => {
    const current = db().select().from(focusSessions).where(eq(focusSessions.id, id)).get();
    if (!current || current.status !== "running" || !current.lastStartedAt) {
      return rowToSession(current ?? getActiveRow()!);
    }
    const addedSeconds = secondsSince(current.lastStartedAt);
    const row = db()
      .update(focusSessions)
      .set({ status: "paused", accumulatedSeconds: current.accumulatedSeconds + addedSeconds, lastStartedAt: null })
      .where(eq(focusSessions.id, id))
      .returning()
      .get();
    return rowToSession(row);
  });

  ipcMain.handle("focusTimer:resume", (_e, id: number): FocusSession => {
    const current = db().select().from(focusSessions).where(eq(focusSessions.id, id)).get();
    if (!current || current.status !== "paused") return rowToSession(current ?? getActiveRow()!);

    const row = db()
      .update(focusSessions)
      .set({ status: "running", lastStartedAt: localDateTimeString() })
      .where(eq(focusSessions.id, id))
      .returning()
      .get();
    return rowToSession(row);
  });

  ipcMain.handle("focusTimer:stop", (_e, id: number): FocusSession => stopFocusSession(id));

  ipcMain.handle(
    "focusTimer:addManual",
    (_e, entry: ManualFocusEntry): FocusSession => {
      const start = `${entry.date} ${entry.startClock}:00`;
      const end = `${entry.date} ${entry.endClock}:00`;
      const durationSeconds = secondsBetween(start, end);
      const row = db()
        .insert(focusSessions)
        .values({
          category: entry.category,
          label: entry.label || null,
          date: entry.date,
          startTime: start,
          endTime: end,
          durationSeconds,
          accumulatedSeconds: durationSeconds,
          status: "completed"
        })
        .returning()
        .get();
      return rowToSession(row);
    }
  );

  ipcMain.handle(
    "focusTimer:update",
    (_e, id: number, fields: Partial<Pick<FocusSession, "category" | "label" | "date" | "startTime" | "endTime">>): FocusSession => {
      db().update(focusSessions).set(fields).where(eq(focusSessions.id, id)).run();
      const updated = db().select().from(focusSessions).where(eq(focusSessions.id, id)).get()!;
      if (updated.startTime && updated.endTime) {
        const durationSeconds = secondsBetween(updated.startTime, updated.endTime);
        const row = db()
          .update(focusSessions)
          .set({ durationSeconds, accumulatedSeconds: durationSeconds })
          .where(eq(focusSessions.id, id))
          .returning()
          .get();
        return rowToSession(row);
      }
      return rowToSession(updated);
    }
  );

  ipcMain.handle("focusTimer:remove", (_e, id: number): void => {
    db().delete(focusSessions).where(eq(focusSessions.id, id)).run();
  });

  ipcMain.handle("focusTimer:recent", (_e, limit = 20): FocusSession[] =>
    db().select().from(focusSessions).orderBy(desc(focusSessions.id)).limit(limit).all().map(rowToSession)
  );

  ipcMain.handle("focusTimer:listByDate", (_e, date: string): FocusSession[] =>
    db()
      .select()
      .from(focusSessions)
      .where(eq(focusSessions.date, date))
      .orderBy(focusSessions.startTime)
      .all()
      .map(rowToSession)
  );

  ipcMain.handle("focusTimer:todayTotals", (): FocusCategoryTotal[] =>
    db()
      .select({
        category: focusSessions.category,
        seconds: sql<number>`SUM(COALESCE(${focusSessions.durationSeconds}, 0))`
      })
      .from(focusSessions)
      .where(and(eq(focusSessions.date, localDateString()), eq(focusSessions.status, "completed")))
      .groupBy(focusSessions.category)
      .all()
  );

  ipcMain.handle("focusTimer:weeklyTotals", (): FocusDayCategoryTotal[] =>
    db()
      .select({
        date: focusSessions.date,
        category: focusSessions.category,
        seconds: sql<number>`SUM(COALESCE(${focusSessions.durationSeconds}, 0))`
      })
      .from(focusSessions)
      .where(and(gte(focusSessions.date, localDateString(daysAgo(6))), eq(focusSessions.status, "completed")))
      .groupBy(focusSessions.date, focusSessions.category)
      .orderBy(focusSessions.date)
      .all()
  );
}
