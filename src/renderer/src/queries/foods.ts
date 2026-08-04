import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewFood } from "@shared/types";

const KEY = ["foods"] as const;

export function useFoods() {
  return useQuery({ queryKey: KEY, queryFn: () => window.api.foods.list() });
}

export function useAddFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewFood) => window.api.foods.add(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useUpdateFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<NewFood> }) => window.api.foods.update(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useRemoveFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.foods.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}
