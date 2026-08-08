import { BrowserWindow, ipcMain } from "electron";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { focusSessions } from "../db/schema";
import { daysAgo, localDateString, localDateTimeString, parseStoredDateTime, secondsBetween, signedSecondsBetween } from "../../shared/datetime";
import type {
  FocusCategoryTotal,
  FocusDayCategoryTotal,
  FocusSession,
  ManualFocusEntry
} from "../../shared/types";

export const FOCUS_CHANGED_CHANNEL = "focusTimer:changed";

/**
 * Tells every open window that the session changed.
 *
 * The main window and the pinned widget are separate renderer processes with
 * separate query caches, so a mutation in one is invisible to the other. Polling
 * papered over it at the cost of up to a second of drift — and left the two
 * clocks disagreeing about whether the timer was running. A broadcast from the
 * one process that owns the data keeps them exact.
 */
function broadcastFocusChange(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(FOCUS_CHANGED_CHANNEL);
  }
}

/** Wraps a mutation so no handler can change a session without announcing it. */
function announce<T>(result: T): T {
  broadcastFocusChange();
  return result;
}

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

/** True while a session is running or paused — used to warn before quitting. */
export function hasActiveFocusSession(): boolean {
  return getActiveRow()?.status === "running";
}

function secondsSince(stored: string): number {
  return Math.max(0, Math.floor((Date.now() - parseStoredDateTime(stored).getTime()) / 1000));
}

// Guards against duplicate "in progress" sessions: if one is already
// running/paused, hand it back instead of inserting a second row. Exported
// (not just an IPC handler) so the workout-session engine can auto-start a
// "training" session without round-tripping through IPC.
export function startFocusSession(
  category: string,
  label: string,
  options?: { replaceActive?: boolean }
): FocusSession {
  const existing = getActiveRow();
  if (existing) {
    // A workout starting while, say, deep work is on the clock shouldn't
    // silently adopt that session — it would be filed under the wrong
    // category and then clocked out when the workout ends. Close the old one
    // cleanly and start a properly-labelled training session instead.
    if (!options?.replaceActive) return rowToSession(existing);
    stopFocusSession(existing.id);
  }

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
  return announce(rowToSession(row));
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
  return announce(rowToSession(row));
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
    return announce(rowToSession(row));
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
    return announce(rowToSession(row));
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
      return announce(rowToSession(row));
    }
  );

  ipcMain.handle(
    "focusTimer:update",
    (_e, id: number, fields: Partial<Pick<FocusSession, "category" | "label" | "date" | "startTime" | "endTime">>): FocusSession => {
      const before = db().select().from(focusSessions).where(eq(focusSessions.id, id)).get();
      if (!before) throw new Error(`Focus session ${id} not found`);

      db().update(focusSessions).set(fields).where(eq(focusSessions.id, id)).run();
      const updated = db().select().from(focusSessions).where(eq(focusSessions.id, id)).get()!;

      const isActive = updated.status === "running" || updated.status === "paused";

      // Correcting the start time of a session that's still running (clocked
      // in at 09:30 but actually started at 08:30) has to move the elapsed
      // clock too, otherwise the display keeps counting from the original
      // moment. Shifting accumulated time by the same delta is correct for
      // both running and paused: running elapsed is accumulated + time since
      // resume, so both gain exactly the backdated amount.
      if (isActive && fields.startTime && fields.startTime !== before.startTime) {
        // Signed on purpose. Moving the start *later* is a negative shift, and
        // clamping it to zero is what made only the first edit take effect —
        // any correction back towards the present silently did nothing.
        const shiftSeconds = signedSecondsBetween(fields.startTime, before.startTime);
        const row = db()
          .update(focusSessions)
          .set({ accumulatedSeconds: Math.max(0, updated.accumulatedSeconds + shiftSeconds) })
          .where(eq(focusSessions.id, id))
          .returning()
          .get();
        return announce(rowToSession(row));
      }

      // Completed sessions derive their duration from the edited bounds.
      if (!isActive && updated.startTime && updated.endTime) {
        const durationSeconds = secondsBetween(updated.startTime, updated.endTime);
        const row = db()
          .update(focusSessions)
          .set({ durationSeconds, accumulatedSeconds: durationSeconds })
          .where(eq(focusSessions.id, id))
          .returning()
          .get();
        return announce(rowToSession(row));
      }
      return announce(rowToSession(updated));
    }
  );

  /**
   * Undo a mis-clicked clock-out: puts a completed session back on the clock
   * with its logged time intact, rather than forcing a fresh session that
   * splits the same block of work in two.
   */
  ipcMain.handle("focusTimer:reopen", (_e, id: number): FocusSession => {
    const active = getActiveRow();
    if (active && active.id !== id) {
      throw new Error("Clock out of the running session before resuming another one.");
    }
    const current = db().select().from(focusSessions).where(eq(focusSessions.id, id)).get();
    if (!current) throw new Error(`Focus session ${id} not found`);
    if (current.status !== "completed") return rowToSession(current);

    const row = db()
      .update(focusSessions)
      .set({
        status: "running",
        endTime: null,
        durationSeconds: null,
        accumulatedSeconds: current.durationSeconds ?? current.accumulatedSeconds,
        lastStartedAt: localDateTimeString()
      })
      .where(eq(focusSessions.id, id))
      .returning()
      .get();
    return announce(rowToSession(row));
  });

  ipcMain.handle("focusTimer:remove", (_e, id: number): void => {
    db().delete(focusSessions).where(eq(focusSessions.id, id)).run();
    broadcastFocusChange();
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
