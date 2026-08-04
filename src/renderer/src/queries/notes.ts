import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewNote } from "@shared/types";

const KEY = ["notes"] as const;

export function useNotes() {
  return useQuery({ queryKey: KEY, queryFn: () => window.api.notes.list() });
}

/**
 * Full-text search over notes. Falls back to the plain list when the query is
 * empty, and keeps the previous results visible while a new query resolves so
 * the list doesn't flash empty on every keystroke.
 */
export function useNoteSearch(query: string) {
  return useQuery({
    queryKey: [...KEY, "search", query],
    queryFn: () => window.api.notes.search(query),
    placeholderData: (previous) => previous
  });
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
