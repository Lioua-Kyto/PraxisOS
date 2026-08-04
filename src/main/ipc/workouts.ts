import { BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db, getMediaDir } from "../db/client";
import { workoutExercises, workoutLogs } from "../db/schema";
import { reseedWorkout } from "../db/seed";
import type { ExerciseVolumePoint, NewWorkoutExercise, WorkoutExercise, WorkoutLog } from "../../shared/types";

function rowToExercise(row: typeof workoutExercises.$inferSelect): WorkoutExercise {
  return { ...row, archived: Boolean(row.archived) };
}

function rowToLog(row: typeof workoutLogs.$inferSelect): WorkoutLog {
  return row;
}

export function registerWorkoutHandlers(): void {
  ipcMain.handle("workouts:listExercises", (): WorkoutExercise[] =>
    db()
      .select()
      .from(workoutExercises)
      .where(eq(workoutExercises.archived, false))
      .orderBy(asc(workoutExercises.day), asc(workoutExercises.orderIndex))
      .all()
      .map(rowToExercise)
  );

  ipcMain.handle("workouts:addExercise", (_e, input: NewWorkoutExercise): WorkoutExercise => {
    const row = db()
      .insert(workoutExercises)
      .values({
        day: input.day,
        name: input.name,
        sets: input.sets ?? 3,
        repsRange: input.repsRange ?? "",
        progression: input.progression ?? "",
        tips: input.tips ?? "",
        link: input.link ?? "",
        orderIndex: input.orderIndex ?? 0
      })
      .returning()
      .get();
    return rowToExercise(row);
  });

  ipcMain.handle(
    "workouts:updateExercise",
    (_e, id: number, fields: Partial<WorkoutExercise>): WorkoutExercise => {
      const row = db().update(workoutExercises).set(fields).where(eq(workoutExercises.id, id)).returning().get();
      return rowToExercise(row);
    }
  );

  ipcMain.handle("workouts:archiveExercise", (_e, id: number): void => {
    db().update(workoutExercises).set({ archived: true }).where(eq(workoutExercises.id, id)).run();
  });

  ipcMain.handle("workouts:mergeToSuperset", (_e, idA: number, idB: number): void => {
    const group = `ss-${idA}-${idB}-${Date.now()}`;
    db().update(workoutExercises).set({ supersetGroup: group }).where(eq(workoutExercises.id, idA)).run();
    db().update(workoutExercises).set({ supersetGroup: group }).where(eq(workoutExercises.id, idB)).run();
  });

  ipcMain.handle("workouts:unlinkSuperset", (_e, id: number): void => {
    db().update(workoutExercises).set({ supersetGroup: null }).where(eq(workoutExercises.id, id)).run();
  });

  ipcMain.handle("workouts:logSet", (_e, exerciseId: number, setNumber: number, reps: number, weightKg: number | null, notes: string): WorkoutLog => {
    const row = db()
      .insert(workoutLogs)
      .values({ exerciseId, setNumber, reps, weightKg, notes })
      .returning()
      .get();
    return rowToLog(row);
  });

  ipcMain.handle("workouts:logsForExercise", (_e, exerciseId: number, limit = 30): WorkoutLog[] =>
    db()
      .select()
      .from(workoutLogs)
      .where(eq(workoutLogs.exerciseId, exerciseId))
      .orderBy(desc(workoutLogs.date), desc(workoutLogs.id))
      .limit(limit)
      .all()
      .map(rowToLog)
  );

  ipcMain.handle("workouts:logsToday", (): WorkoutLog[] =>
    db()
      .select()
      .from(workoutLogs)
      .where(eq(workoutLogs.date, sql`date('now')`))
      .all()
      .map(rowToLog)
  );

  ipcMain.handle("workouts:removeLog", (_e, id: number): void => {
    db().delete(workoutLogs).where(eq(workoutLogs.id, id)).run();
  });

  ipcMain.handle("workouts:volumeByExercise", (_e, exerciseId: number, days = 14): ExerciseVolumePoint[] =>
    db()
      .select({
        date: workoutLogs.date,
        vol: sql<number>`SUM(${workoutLogs.reps} * COALESCE(${workoutLogs.weightKg}, 1))`
      })
      .from(workoutLogs)
      .where(and(eq(workoutLogs.exerciseId, exerciseId), gte(workoutLogs.date, sql`date('now', ${"-" + days + " days"})`)))
      .groupBy(workoutLogs.date)
      .orderBy(asc(workoutLogs.date))
      .all()
  );

  ipcMain.handle("workouts:restoreDefaults", (): WorkoutExercise[] => reseedWorkout(db()).map(rowToExercise));

  ipcMain.handle("workouts:pickVideo", async (event, exerciseId: number): Promise<string | null> => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const options: Electron.OpenDialogOptions = {
      title: "Choose a form-check video",
      properties: ["openFile"],
      filters: [{ name: "Videos", extensions: ["mp4", "mov", "webm", "mkv", "avi"] }]
    };
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    if (result.canceled || !result.filePaths.length) return null;

    const src = result.filePaths[0];
    const mediaDir = getMediaDir();
    const destName = `ex${exerciseId}-${Date.now()}${path.extname(src)}`;
    const dest = path.join(mediaDir, destName);
    fs.copyFileSync(src, dest);

    db().update(workoutExercises).set({ videoPath: dest }).where(eq(workoutExercises.id, exerciseId)).run();
    return dest;
  });
}
