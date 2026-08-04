import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewThemePreset } from "@shared/types";

const KEY = ["themePresets"] as const;

export function useThemePresets() {
  return useQuery({ queryKey: KEY, queryFn: () => window.api.themePresets.list() });
}

export function useAddThemePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewThemePreset) => window.api.themePresets.add(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useRenameThemePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => window.api.themePresets.rename(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useUpdateThemePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<NewThemePreset> }) =>
      window.api.themePresets.update(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useRemoveThemePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.themePresets.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}
