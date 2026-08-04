import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewHabit } from "@shared/types";

const KEY = ["habits"] as const;

export function useHabits() {
  return useQuery({ queryKey: KEY, queryFn: () => window.api.habits.list() });
}

export function useAddHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewHabit) => window.api.habits.add(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<NewHabit> }) => window.api.habits.update(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useArchiveHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.habits.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useRemoveHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.habits.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useToggleHabitDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) => window.api.habits.toggleDate(id, date),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}
