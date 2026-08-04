import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewWorkoutExercise, WorkoutExercise } from "@shared/types";

const EXERCISES_KEY = ["workouts", "exercises"] as const;
const logsKey = (exerciseId: number) => ["workouts", "logs", exerciseId] as const;
const volumeKey = (exerciseId: number) => ["workouts", "volume", exerciseId] as const;

export function useExercises() {
  return useQuery({ queryKey: EXERCISES_KEY, queryFn: () => window.api.workouts.listExercises() });
}

export function useExerciseLogs(exerciseId: number, enabled: boolean) {
  return useQuery({
    queryKey: logsKey(exerciseId),
    queryFn: () => window.api.workouts.logsForExercise(exerciseId, 10),
    enabled
  });
}

export function useExerciseVolume(exerciseId: number, enabled: boolean) {
  return useQuery({
    queryKey: volumeKey(exerciseId),
    queryFn: () => window.api.workouts.volumeByExercise(exerciseId, 14),
    enabled
  });
}

export function useAddExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewWorkoutExercise) => window.api.workouts.addExercise(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXERCISES_KEY })
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<WorkoutExercise> }) =>
      window.api.workouts.updateExercise(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXERCISES_KEY })
  });
}

export function useArchiveExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.workouts.archiveExercise(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXERCISES_KEY })
  });
}

export function useMergeToSuperset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idA, idB }: { idA: number; idB: number }) => window.api.workouts.mergeToSuperset(idA, idB),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXERCISES_KEY })
  });
}

export function useUnlinkSuperset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.workouts.unlinkSuperset(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXERCISES_KEY })
  });
}

export function useLogSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      exerciseId,
      setNumber,
      reps,
      weightKg,
      notes
    }: {
      exerciseId: number;
      setNumber: number;
      reps: number;
      weightKg: number | null;
      notes: string;
    }) => window.api.workouts.logSet(exerciseId, setNumber, reps, weightKg, notes),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: logsKey(vars.exerciseId) });
      qc.invalidateQueries({ queryKey: volumeKey(vars.exerciseId) });
    }
  });
}

export function useAttachVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: number) => window.api.workouts.pickVideo(exerciseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXERCISES_KEY })
  });
}

export function useRemoveVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.workouts.updateExercise(id, { videoPath: null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXERCISES_KEY })
  });
}

export function useRestoreDefaultWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => window.api.workouts.restoreDefaults(),
    onSuccess: (data) => qc.setQueryData(EXERCISES_KEY, data)
  });
}
