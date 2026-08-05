import { BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db, getMediaDir } from "../db/client";
import { workoutExercises, workoutLogs } from "../db/schema";
import { reseedWorkout } from "../db/seed";
import { rowToExercise } from "./workoutHelpers";
import type { ExerciseVolumePoint, NewWorkoutExercise, WorkoutExercise, WorkoutLog } from "../../shared/types";

function rowToLog(row: typeof workoutLogs.$inferSelect): WorkoutLog {
  return row;
}

const SUPERSET_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))"
];

export type ExerciseMediaKind = "video" | "image";

const MEDIA_DIALOG: Record<ExerciseMediaKind, { title: string; name: string; extensions: string[] }> = {
  video: {
    title: "Choose a form-check video",
    name: "Videos",
    extensions: ["mp4", "mov", "webm", "mkv", "avi"]
  },
  image: {
    title: "Choose a reference photo",
    name: "Images",
    extensions: ["png", "jpg", "jpeg", "webp", "gif", "avif"]
  }
};

async function pickAndCopyMedia(
  win: Electron.BrowserWindow | null,
  kind: ExerciseMediaKind
): Promise<string | null> {
  const { title, name, extensions } = MEDIA_DIALOG[kind];
  const options: Electron.OpenDialogOptions = {
    title,
    properties: ["openFile"],
    filters: [{ name, extensions }]
  };
  const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
  if (result.canceled || !result.filePaths.length) return null;

  const src = result.filePaths[0];
  const dest = path.join(getMediaDir(), `ex-${kind}-${Date.now()}${path.extname(src)}`);
  fs.copyFileSync(src, dest);
  return dest;
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
        exerciseType: input.exerciseType ?? "reps",
        durationSeconds: input.durationSeconds ?? null,
        progression: input.progression ?? "",
        tips: input.tips ?? "",
        videoPath: input.videoPath ?? null,
        imagePath: input.imagePath ?? null,
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
    const a = db().select().from(workoutExercises).where(eq(workoutExercises.id, idA)).get();
    // Dropping one exercise onto an existing superset folds it into that
    // group (and keeps its color); dropping two standalone exercises
    // together mints a fresh group with the next unused color.
    const existingGroup = a?.supersetGroup;
    const group = existingGroup ?? `ss-${idA}-${idB}-${Date.now()}`;
    const color =
      (existingGroup ? a?.supersetColor : null) ??
      SUPERSET_COLORS[
        db()
          .select()
          .from(workoutExercises)
          .where(sql`${workoutExercises.supersetGroup} IS NOT NULL`)
          .all()
          .reduce((acc, r) => (r.supersetGroup ? acc.add(r.supersetGroup) : acc), new Set<string>()).size %
          SUPERSET_COLORS.length
      ];
    db().update(workoutExercises).set({ supersetGroup: group, supersetColor: color }).where(eq(workoutExercises.id, idA)).run();
    db().update(workoutExercises).set({ supersetGroup: group, supersetColor: color }).where(eq(workoutExercises.id, idB)).run();
  });

  ipcMain.handle("workouts:unlinkSuperset", (_e, id: number): void => {
    db().update(workoutExercises).set({ supersetGroup: null, supersetColor: null }).where(eq(workoutExercises.id, id)).run();
  });

  ipcMain.handle("workouts:reorder", (_e, orderedIds: number[]): void => {
    orderedIds.forEach((id, index) => {
      db().update(workoutExercises).set({ orderIndex: index }).where(eq(workoutExercises.id, id)).run();
    });
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

  // Attaches media to an existing exercise immediately (quick-action from the
  // exercise list/detail view).
  ipcMain.handle(
    "workouts:pickMedia",
    async (event, exerciseId: number, kind: ExerciseMediaKind): Promise<string | null> => {
      const win = BrowserWindow.fromWebContents(event.sender);
      const dest = await pickAndCopyMedia(win, kind);
      if (!dest) return null;
      const field = kind === "video" ? { videoPath: dest } : { imagePath: dest };
      db().update(workoutExercises).set(field).where(eq(workoutExercises.id, exerciseId)).run();
      return dest;
    }
  );

  // Just picks + copies into the media dir without touching any row — used by
  // the add/edit exercise form, which may not have an exercise id yet (a
  // brand-new exercise) and instead includes the returned path in the
  // create/update payload itself.
  ipcMain.handle("workouts:pickMediaFile", async (event, kind: ExerciseMediaKind): Promise<string | null> => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return pickAndCopyMedia(win, kind);
  });
}
