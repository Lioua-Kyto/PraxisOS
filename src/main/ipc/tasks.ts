import { ipcMain } from "electron";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { tasks } from "../db/schema";
import { localDateTimeString } from "../../shared/datetime";
import type { NewTask, Task, TaskStatus } from "../../shared/types";

function rowToTask(row: typeof tasks.$inferSelect): Task {
  return {
    id: row.id,
    text: row.text,
    priority: row.priority as Task["priority"],
    status: row.status as TaskStatus,
    dueDate: row.dueDate,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    createdAt: row.createdAt,
    completedAt: row.completedAt
  };
}

/**
 * Status drives the lifecycle stamps:
 *   todo        -> both cleared (a task pulled back is genuinely restarted)
 *   in_progress -> startedAt stamped once, finishedAt cleared
 *   completed   -> finishedAt stamped, startedAt backfilled if the task
 *                  jumped straight from todo to done
 */
function lifecycleFields(status: TaskStatus, current: typeof tasks.$inferSelect) {
  const now = localDateTimeString();
  if (status === "todo") return { startedAt: null, finishedAt: null, completedAt: null };
  if (status === "in_progress") return { startedAt: current.startedAt ?? now, finishedAt: null, completedAt: null };
  return { startedAt: current.startedAt ?? now, finishedAt: now, completedAt: now };
}

export function registerTaskHandlers(): void {
  ipcMain.handle("tasks:list", (): Task[] => {
    const rows = db().select().from(tasks).orderBy(desc(tasks.createdAt)).all();
    return rows.map(rowToTask);
  });

  ipcMain.handle("tasks:add", (_e, input: NewTask): Task => {
    const row = db()
      .insert(tasks)
      .values({ text: input.text, priority: input.priority, dueDate: input.dueDate ?? null })
      .returning()
      .get();
    return rowToTask(row);
  });

  ipcMain.handle("tasks:setStatus", (_e, id: number, status: TaskStatus): Task => {
    const current = db().select().from(tasks).where(eq(tasks.id, id)).get();
    if (!current) throw new Error(`Task ${id} not found`);
    const row = db()
      .update(tasks)
      .set({ status, ...lifecycleFields(status, current) })
      .where(eq(tasks.id, id))
      .returning()
      .get();
    return rowToTask(row);
  });

  ipcMain.handle("tasks:update", (_e, id: number, fields: Partial<NewTask>): Task => {
    const row = db().update(tasks).set(fields).where(eq(tasks.id, id)).returning().get();
    return rowToTask(row);
  });

  ipcMain.handle("tasks:remove", (_e, id: number): void => {
    db().delete(tasks).where(eq(tasks.id, id)).run();
  });
}
