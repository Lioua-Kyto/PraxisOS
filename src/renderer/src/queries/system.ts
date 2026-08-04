import { useMutation, useQuery } from "@tanstack/react-query";

export function useExportAll() {
  return useMutation({ mutationFn: () => window.api.system.exportAll() });
}

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [tasks, budgetSummary, hydrationTotal, nutritionToday, focusTodayTotals, focusWeekly] =
        await Promise.all([
          window.api.tasks.list(),
          window.api.budget.summary(),
          window.api.hydration.totalToday(),
          window.api.nutrition.listToday(),
          window.api.focusTimer.todayTotals(),
          window.api.focusTimer.weeklyTotals()
        ]);
      return { tasks, budgetSummary, hydrationTotal, nutritionToday, focusTodayTotals, focusWeekly };
    }
  });
}
