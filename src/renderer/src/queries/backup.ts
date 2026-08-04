import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useExportBackup() {
  return useMutation({ mutationFn: () => window.api.backup.exportToFile() });
}

export function useImportBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => window.api.backup.importFromFile(),
    // A restore replaces every table, so nothing in the cache is trustworthy.
    onSuccess: (summary) => {
      if (summary) qc.invalidateQueries();
    }
  });
}
