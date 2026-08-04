import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FocusSession, ManualFocusEntry } from "@shared/types";

const ACTIVE_KEY = ["focusTimer", "active"] as const;
const RECENT_KEY = ["focusTimer", "recent"] as const;
const TODAY_TOTALS_KEY = ["focusTimer", "todayTotals"] as const;
const WEEKLY_TOTALS_KEY = ["focusTimer", "weeklyTotals"] as const;

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ACTIVE_KEY });
  qc.invalidateQueries({ queryKey: RECENT_KEY });
  qc.invalidateQueries({ queryKey: TODAY_TOTALS_KEY });
  qc.invalidateQueries({ queryKey: WEEKLY_TOTALS_KEY });
}

// The active session is the single source of truth for the running timer —
// it lives in SQLite (main process), not component state, so switching tabs
// or remounting the panel never resets or duplicates it.
export function useActiveFocusSession() {
  return useQuery({ queryKey: ACTIVE_KEY, queryFn: () => window.api.focusTimer.getActive() });
}

export function useRecentFocusSessions(limit = 20) {
  return useQuery({ queryKey: [...RECENT_KEY, limit], queryFn: () => window.api.focusTimer.recent(limit) });
}

export function useFocusTodayTotals() {
  return useQuery({ queryKey: TODAY_TOTALS_KEY, queryFn: () => window.api.focusTimer.todayTotals() });
}

export function useFocusWeeklyTotals() {
  return useQuery({ queryKey: WEEKLY_TOTALS_KEY, queryFn: () => window.api.focusTimer.weeklyTotals() });
}

export function useStartFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ category, label }: { category: string; label: string }) =>
      window.api.focusTimer.start(category, label),
    onSuccess: (data: FocusSession) => {
      qc.setQueryData(ACTIVE_KEY, data);
      invalidateAll(qc);
    }
  });
}

export function usePauseFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.focusTimer.pause(id),
    onSuccess: (data: FocusSession) => qc.setQueryData(ACTIVE_KEY, data)
  });
}

export function useResumeFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.focusTimer.resume(id),
    onSuccess: (data: FocusSession) => qc.setQueryData(ACTIVE_KEY, data)
  });
}

export function useStopFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.focusTimer.stop(id),
    onSuccess: () => {
      qc.setQueryData(ACTIVE_KEY, null);
      invalidateAll(qc);
    }
  });
}

export function useAddManualFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: ManualFocusEntry) => window.api.focusTimer.addManual(entry),
    onSuccess: () => invalidateAll(qc)
  });
}

export function useUpdateFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<FocusSession> }) =>
      window.api.focusTimer.update(id, fields),
    onSuccess: () => invalidateAll(qc)
  });
}

export function useRemoveFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.focusTimer.remove(id),
    onSuccess: () => invalidateAll(qc)
  });
}
