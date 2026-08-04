import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { workoutExercises } from "../db/schema";
import type { WorkoutExercise, WorkoutExerciseGroup } from "../../shared/types";

export function rowToExercise(row: typeof workoutExercises.$inferSelect): WorkoutExercise {
  return { ...row, archived: Boolean(row.archived), exerciseType: row.exerciseType as WorkoutExercise["exerciseType"] };
}

// Collapses same-day exercises into ordered groups — a group is either a
// single exercise or a superset (2+ exercises sharing superset_group).
// Shared between the exercise editor (main WorkoutPanel) and the workout
// session engine, which sequences by group rather than raw exercise rows.
export function getExerciseGroupsForDay(day: string): WorkoutExerciseGroup[] {
  const rows = db()
    .select()
    .from(workoutExercises)
    .where(and(eq(workoutExercises.day, day), eq(workoutExercises.archived, false)))
    .orderBy(asc(workoutExercises.orderIndex))
    .all();

  const groups: WorkoutExerciseGroup[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (row.supersetGroup) {
      if (seen.has(row.supersetGroup)) continue;
      seen.add(row.supersetGroup);
      const members = rows.filter((r) => r.supersetGroup === row.supersetGroup).map(rowToExercise);
      groups.push({ key: row.supersetGroup, exercises: members, color: row.supersetColor });
    } else {
      groups.push({ key: `single-${row.id}`, exercises: [rowToExercise(row)], color: null });
    }
  }
  return groups;
}
