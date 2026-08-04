import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useJournalEntry(date: string) {
  return useQuery({ queryKey: ["journal", "entry", date], queryFn: () => window.api.journal.getByDate(date) });
}

export function useSaveJournalEntry(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields: { morningIntentions?: string; eveningReflection?: string }) =>
      window.api.journal.save(date, fields),
    onSuccess: (data) => {
      qc.setQueryData(["journal", "entry", date], data);
      qc.invalidateQueries({ queryKey: ["journal", "dates"] });
    }
  });
}

export function useBrainDumps(date: string) {
  return useQuery({ queryKey: ["journal", "dumps", date], queryFn: () => window.api.journal.listDumpsByDate(date) });
}

export function useAddBrainDump(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => window.api.journal.addDump(date, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal", "dumps", date] })
  });
}

export function useRemoveBrainDump(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.journal.removeDump(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal", "dumps", date] })
  });
}

export function useJournalDatesWithEntries() {
  return useQuery({ queryKey: ["journal", "dates"], queryFn: () => window.api.journal.datesWithEntries() });
}
