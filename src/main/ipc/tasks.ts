import { ipcMain } from "electron";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { tasks } from "../db/schema";
import type { NewTask, Task, TaskStatus } from "../../shared/types";

function rowToTask(row: typeof tasks.$inferSelect): Task {
  return {
    id: row.id,
    text: row.text,
    priority: row.priority as Task["priority"],
    status: row.status as TaskStatus,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    completedAt: row.completedAt
  };
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
    const row = db()
      .update(tasks)
      .set({ status, completedAt: status === "completed" ? new Date().toISOString() : null })
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
