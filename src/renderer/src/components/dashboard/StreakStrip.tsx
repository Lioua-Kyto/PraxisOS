import { Card, CardContent } from "../ui/card";
import { habitColorCss } from "../habits/habitColors";
import { localDateString } from "@shared/datetime";
import type { HabitWithLogs } from "@shared/types";

/**
 * A compact 14-day consistency strip per habit — the "am I actually keeping
 * this up?" view, without leaving the dashboard.
 */
export function StreakStrip({ habits, onNavigate }: { habits: HabitWithLogs[]; onNavigate: () => void }) {
  const today = localDateString();
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(localDateString(d));
  }

  return (
    <Card className="cursor-pointer transition-colors hover:border-primary/50" onClick={onNavigate}>
      <CardContent className="pt-5">
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Last 14 days</h3>

        {habits.length === 0 ? (
          <div className="py-4 text-xs text-muted-foreground">No habits yet — add one to start a streak.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {habits.slice(0, 5).map((h) => {
              const color = habitColorCss(h.color);
              const completed = new Set(h.completedDates);
              const scheduled = new Set(h.scheduledDates);
              return (
                <div key={h.id} className="flex items-center gap-2.5">
                  <span className="min-w-0 flex-1 truncate text-[12px]">{h.name}</span>
                  <div className="flex shrink-0 gap-[3px]">
                    {days.map((date) => {
                      const isScheduled = scheduled.has(date) || date > today;
                      const isDone = completed.has(date);
                      return (
                        <span
                          key={date}
                          title={`${h.name} · ${date}`}
                          className="h-3.5 w-3.5 rounded-[3px] border border-border-soft"
                          style={{
                            background: isDone ? color : "hsl(var(--sunken))",
                            // Days the habit isn't scheduled for read as
                            // neutral rather than as a missed day.
                            opacity: isScheduled ? 1 : 0.3
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="tabular w-8 shrink-0 text-right text-[11px] text-muted-foreground">{h.streak}d</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
