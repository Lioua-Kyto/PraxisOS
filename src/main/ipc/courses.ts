import { ipcMain } from "electron";
import { asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { courses } from "../db/schema";
import { reseedCourses } from "../db/seed";
import type { Course, NewCourse } from "../../shared/types";

function rowToCourse(row: typeof courses.$inferSelect): Course {
  return { ...row, status: row.status as Course["status"] };
}

export function registerCourseHandlers(): void {
  ipcMain.handle("courses:list", (): Course[] =>
    db().select().from(courses).orderBy(asc(courses.phase), asc(courses.id)).all().map(rowToCourse)
  );

  ipcMain.handle("courses:add", (_e, input: Partial<NewCourse> & { title: string }): Course => {
    const row = db()
      .insert(courses)
      .values({
        title: input.title,
        provider: input.provider ?? "",
        category: input.category ?? "",
        phase: input.phase ?? 1,
        url: input.url ?? "",
        status: input.status ?? "planned",
        notes: input.notes ?? ""
      })
      .returning()
      .get();
    return rowToCourse(row);
  });

  ipcMain.handle("courses:update", (_e, id: number, fields: Partial<NewCourse>): Course => {
    const row = db().update(courses).set(fields).where(eq(courses.id, id)).returning().get();
    return rowToCourse(row);
  });

  ipcMain.handle("courses:remove", (_e, id: number): void => {
    db().delete(courses).where(eq(courses.id, id)).run();
  });

  ipcMain.handle("courses:restoreDefaults", (): Course[] => reseedCourses(db()).map(rowToCourse));
}
