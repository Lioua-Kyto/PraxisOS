import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewNutritionLog } from "@shared/types";

const TODAY_KEY = ["nutrition", "today"] as const;
const WEEKLY_KEY = ["nutrition", "weekly"] as const;
const HYDRATION_TODAY_KEY = ["hydration", "today"] as const;
const HYDRATION_TOTAL_KEY = ["hydration", "total"] as const;

export function useNutritionToday() {
  return useQuery({ queryKey: TODAY_KEY, queryFn: () => window.api.nutrition.listToday() });
}

export function useNutritionWeekly() {
  return useQuery({ queryKey: WEEKLY_KEY, queryFn: () => window.api.nutrition.weeklyTotals() });
}

export function useAddNutrition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: NewNutritionLog) => window.api.nutrition.add(entry),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TODAY_KEY });
      qc.invalidateQueries({ queryKey: WEEKLY_KEY });
    }
  });
}

export function useRemoveNutrition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.nutrition.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TODAY_KEY });
      qc.invalidateQueries({ queryKey: WEEKLY_KEY });
    }
  });
}

export function useHydrationToday() {
  return useQuery({ queryKey: HYDRATION_TODAY_KEY, queryFn: () => window.api.hydration.listToday() });
}

export function useHydrationTotalToday() {
  return useQuery({ queryKey: HYDRATION_TOTAL_KEY, queryFn: () => window.api.hydration.totalToday() });
}

export function useAddHydration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amountMl: number) => window.api.hydration.add(amountMl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HYDRATION_TODAY_KEY });
      qc.invalidateQueries({ queryKey: HYDRATION_TOTAL_KEY });
    }
  });
}

export function useRemoveHydration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.api.hydration.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HYDRATION_TODAY_KEY });
      qc.invalidateQueries({ queryKey: HYDRATION_TOTAL_KEY });
    }
  });
}
