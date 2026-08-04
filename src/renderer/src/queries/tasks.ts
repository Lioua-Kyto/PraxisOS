import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewTask, TaskStatus } from "@shared/types";

const KEY = ["tasks"] as const;

export function useTasks() {
  return useQuery({ queryKey: KEY, queryFn: () => window.api.tasks.list() });
}

export function useAddTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTask) => window.api.tasks.add(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useSetTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => window.api.tasks.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<NewTask> }) => window.api.tasks.update(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useRemoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.tasks.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}
