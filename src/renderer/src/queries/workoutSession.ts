import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const STATE_KEY = ["workoutSession", "state"] as const;

// Subscribes once to the main process's "state changed" broadcast and keeps
// the query cache in sync — this is how the session view picks up
// auto-transitions (countdown -> work, rest -> next exercise) that happen on
// a main-process timer, not from a user action in this window.
export function useWorkoutSessionSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const unsubscribe = window.api.workoutSession.onChanged(() => {
      qc.invalidateQueries({ queryKey: STATE_KEY });
    });
    return unsubscribe;
  }, [qc]);
}

export function useWorkoutSessionState(enabled = true) {
  return useQuery({
    queryKey: STATE_KEY,
    queryFn: () => window.api.workoutSession.getState(),
    enabled
  });
}

export function useWorkoutGroups(day: string, enabled: boolean) {
  return useQuery({
    queryKey: ["workoutSession", "groups", day],
    queryFn: () => window.api.workoutSession.getGroups(day),
    enabled
  });
}

export function useStartWorkoutSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (day: string) => window.api.workoutSession.start(day),
    onSuccess: (data) => qc.setQueryData(STATE_KEY, data)
  });
}

export function useStartExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => window.api.workoutSession.startExercise(),
    onSuccess: (data) => qc.setQueryData(STATE_KEY, data)
  });
}

export function useFinishSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => window.api.workoutSession.finishSet(),
    onSuccess: (data) => qc.setQueryData(STATE_KEY, data)
  });
}

export function useSetRestSeconds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (seconds: number) => window.api.workoutSession.setRestSeconds(seconds),
    onSuccess: (data) => qc.setQueryData(STATE_KEY, data)
  });
}

export function usePauseRest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => window.api.workoutSession.pauseRest(),
    onSuccess: (data) => qc.setQueryData(STATE_KEY, data)
  });
}

export function useResumeRest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => window.api.workoutSession.resumeRest(),
    onSuccess: (data) => qc.setQueryData(STATE_KEY, data)
  });
}

export function useResetRest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => window.api.workoutSession.resetRest(),
    onSuccess: (data) => qc.setQueryData(STATE_KEY, data)
  });
}

export function useSkipRest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => window.api.workoutSession.skipRest(),
    onSuccess: (data) => qc.setQueryData(STATE_KEY, data)
  });
}

export function useRefreshWorkoutGroups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => window.api.workoutSession.refreshGroups(),
    onSuccess: (data) => qc.setQueryData(STATE_KEY, data)
  });
}

export function useCancelWorkoutSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => window.api.workoutSession.cancel(),
    onSuccess: () => qc.setQueryData(STATE_KEY, null)
  });
}

export function useCloseWorkoutSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => window.api.workoutSession.close(),
    onSuccess: () => qc.setQueryData(STATE_KEY, null)
  });
}
