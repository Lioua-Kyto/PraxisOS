import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewHabit } from "@shared/types";

const habitsKey = (month: string) => ["habits", month] as const;

export function useHabits(month: string) {
  return useQuery({ queryKey: habitsKey(month), queryFn: () => window.api.habits.list(month) });
}

function useHabitMutation<TVars>(month: string, mutationFn: (vars: TVars) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
    onSettled: () => qc.invalidateQueries({ queryKey: habitsKey(month) })
  });
}

export function useAddHabit(month: string) {
  return useHabitMutation<NewHabit>(month, (input) => window.api.habits.add(input));
}

export function useUpdateHabit(month: string) {
  return useHabitMutation<{ id: number; fields: Partial<NewHabit> }>(month, ({ id, fields }) =>
    window.api.habits.update(id, fields)
  );
}

export function useArchiveHabit(month: string) {
  return useHabitMutation<number>(month, (id) => window.api.habits.archive(id));
}

export function useRemoveHabit(month: string) {
  return useHabitMutation<number>(month, (id) => window.api.habits.remove(id));
}

export function useToggleHabitDate(month: string) {
  return useHabitMutation<{ id: number; date: string }>(month, ({ id, date }) =>
    window.api.habits.toggleDate(id, date, month)
  );
}
