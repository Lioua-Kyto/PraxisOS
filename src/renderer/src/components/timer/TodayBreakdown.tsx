import { Card, CardContent } from "../ui/card";
import { focusCategoryMeta } from "./focusCategories";
import type { FocusCategoryTotal } from "@shared/types";

function formatHours(seconds: number): string {
  const hours = seconds / 3600;
  if (hours >= 1) return `${hours.toFixed(1)}h`;
  return `${Math.round(seconds / 60)}m`;
}

/**
 * Replaces the grid of one card per category — which meant eleven mostly-zero
 * tiles for anyone who doesn't use every category. Only categories with time
 * logged appear, as a proportional bar plus a ranked legend, so the panel says
 * what the day was actually spent on.
 */
export function TodayBreakdown({ totals }: { totals: FocusCategoryTotal[] }) {
  const used = totals
    .filter((t) => t.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds);
  const total = used.reduce((sum, t) => sum + t.seconds, 0);

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Today's breakdown</h3>
          <span className="tabular font-display text-lg">{formatHours(total)}</span>
        </div>

        {used.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Nothing tracked yet today — clock in to start building the picture.
          </div>
        ) : (
          <>
            <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-sunken">
              {used.map((t) => {
                const meta = focusCategoryMeta(t.category);
                return (
                  <div
                    key={t.category}
                    style={{ width: `${(t.seconds / total) * 100}%`, background: meta.color }}
                    title={`${meta.label}: ${formatHours(t.seconds)}`}
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {used.map((t) => {
                const meta = focusCategoryMeta(t.category);
                const share = Math.round((t.seconds / total) * 100);
                return (
                  <div key={t.category} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                    <span className="min-w-0 flex-1 truncate text-[12.5px]">{meta.label}</span>
                    <span className="tabular shrink-0 text-[12.5px]">{formatHours(t.seconds)}</span>
                    <span className="tabular w-9 shrink-0 text-right text-[11px] text-muted-foreground">{share}%</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
