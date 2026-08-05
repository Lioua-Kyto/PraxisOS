import type { WorkoutExercise, WorkoutExerciseGroup } from "@shared/types";

export function exerciseTarget(exercise: WorkoutExercise): string {
  return exercise.exerciseType === "time"
    ? `${exercise.sets ?? 1} × ${exercise.durationSeconds ?? 30}s`
    : `${exercise.sets ?? 1} × ${exercise.repsRange || "—"}`;
}

/** Summary for the sequence list — collapses a superset to a single line. */
export function groupTargetLabel(group: WorkoutExerciseGroup): string {
  const targets = [...new Set(group.exercises.map(exerciseTarget))];
  return targets.length === 1 ? targets[0] : `${group.exercises.length} exercises`;
}

/** Exercises in this group that still owe the given set. */
export function activeExercisesForSet(group: WorkoutExerciseGroup, currentSet: number): WorkoutExercise[] {
  return group.exercises.filter((e) => (e.sets ?? 1) >= currentSet);
}

/**
 * Exercises whose set count is already satisfied. Shown as done so an uneven
 * superset (4 sets + 3 sets) makes it obvious that one half has finished
 * while the other still has a round to go.
 */
export function finishedExercisesForSet(group: WorkoutExerciseGroup, currentSet: number): WorkoutExercise[] {
  return group.exercises.filter((e) => (e.sets ?? 1) < currentSet);
}

/** True when every exercise still in play is time-based (drives auto-advance). */
export function isFullyTimed(group: WorkoutExerciseGroup, currentSet: number): boolean {
  const active = activeExercisesForSet(group, currentSet);
  return active.length > 0 && active.every((e) => e.exerciseType === "time");
}
