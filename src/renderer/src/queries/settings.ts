import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppSettings } from "@shared/types";

const KEY = ["settings"] as const;

export function useSettings() {
  return useQuery({ queryKey: KEY, queryFn: () => window.api.settings.get() });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<AppSettings>) => window.api.settings.set(patch),
    onSuccess: (data) => qc.setQueryData(KEY, data)
  });
}
