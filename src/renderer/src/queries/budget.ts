import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BudgetTransactionType, NewBudgetTransaction } from "@shared/types";

const LIST_KEY = ["budget", "transactions"] as const;
const SUMMARY_KEY = ["budget", "summary"] as const;
const TODAY_SPEND_KEY = ["budget", "todaySpend"] as const;
const CATEGORIES_KEY = ["budget", "categories"] as const;

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: LIST_KEY });
  qc.invalidateQueries({ queryKey: SUMMARY_KEY });
  qc.invalidateQueries({ queryKey: TODAY_SPEND_KEY });
}

export function useBudgetCategories() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: () => window.api.budget.listCategories() });
}

export function useBudgetCategoriesByType(type: BudgetTransactionType | null) {
  return useQuery({
    queryKey: [...CATEGORIES_KEY, type],
    queryFn: () => window.api.budget.categoriesByType(type as BudgetTransactionType),
    enabled: type !== null
  });
}

export function useBudgetTransactions() {
  return useQuery({ queryKey: LIST_KEY, queryFn: () => window.api.budget.list() });
}

export function useBudgetSummary() {
  return useQuery({ queryKey: SUMMARY_KEY, queryFn: () => window.api.budget.summary() });
}

export function useBudgetTodaySpend() {
  return useQuery({ queryKey: TODAY_SPEND_KEY, queryFn: () => window.api.budget.todaySpend() });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tx: NewBudgetTransaction) => window.api.budget.add(tx),
    onSuccess: () => invalidateAll(qc)
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<NewBudgetTransaction> }) =>
      window.api.budget.update(id, fields),
    onSuccess: () => invalidateAll(qc)
  });
}

export function useRemoveTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.budget.remove(id),
    onSuccess: () => invalidateAll(qc)
  });
}
