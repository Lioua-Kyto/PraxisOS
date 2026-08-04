import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewNote } from "@shared/types";

const KEY = ["notes"] as const;

export function useNotes() {
  return useQuery({ queryKey: KEY, queryFn: () => window.api.notes.list() });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewNote) => window.api.notes.add(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<NewNote> }) => window.api.notes.update(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}

export function useRemoveNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.notes.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  });
}
