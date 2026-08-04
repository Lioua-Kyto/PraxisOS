import { useState } from "react";
import { Check, Flame, Lock, Trash2 } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { habitColorCss, WEEKDAY_LABELS } from "./habitColors";
import { useArchiveHabit, useToggleHabitDate } from "../../queries/habits";
import { localDateString } from "@shared/datetime";
import type { HabitWithLogs } from "@shared/types";

function cadenceLabel(habit: HabitWithLogs): string {
  if (habit.cadence === "daily") return "Daily";
  if (habit.cadence === "weekly") return habit.weekdays.length ? `Weekly · ${WEEKDAY_LABELS[habit.weekdays[0]]}` : "Weekly";
  return habit.weekdays.length ? `Custom · ${habit.weekdays.map((d) => WEEKDAY_LABELS[d]).join(", ")}` : "Custom";
}

export function HabitCard({ habit, month }: { habit: HabitWithLogs; month: string }) {
  const toggle = useToggleHabitDate(month);
  const archive = useArchiveHabit(month);
  const [error, setError] = useState("");
  const color = habitColorCss(habit.color);

  const today = localDateString();
  const completed = new Set(habit.completedDates);
  const doneToday = completed.has(today);
  const scheduledToday = habit.scheduledDates.includes(today);
  const doneCount = habit.scheduledDates.filter((d) => completed.has(d)).length;

  const check = (date: string) => {
    setError("");
    toggle.mutate({ id: habit.id, date }, { onError: (e) => setError((e as Error).message) });
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
              <span className="truncate font-display text-base">{habit.name}</span>
              {habit.managedBy && (
                <span title="Managed by your workout schedule in Settings">
                  <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" style={{ color }} />
                {habit.streak} {habit.streak === 1 ? "day" : "days"}
              </span>
              <span>·</span>
              <span>{cadenceLabel(habit)}</span>
              <span>·</span>
              <span className="tabular">
                {doneCount}/{habit.scheduledDates.length} this month
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant={doneToday ? "default" : "outline"}
              style={doneToday ? { background: color, borderColor: color } : undefined}
              disabled={!scheduledToday}
              title={scheduledToday ? (doneToday ? "Undo today's check-in" : "Check in for today") : "Not scheduled today"}
              onClick={() => check(today)}
            >
              <Check className="h-3.5 w-3.5" /> {doneToday ? "Done" : "Check in"}
            </Button>
            {!habit.managedBy && (
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => archive.mutate(habit.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* One square per scheduled day this month, filling the card width. */}
        <div className="flex flex-wrap gap-1.5">
          {habit.scheduledDates.map((date) => {
            const isDone = completed.has(date);
            const isToday = date === today;
            const isFuture = date > today;
            const dayNum = Number(date.slice(-2));
            return (
              <button
                key={date}
                type="button"
                disabled={isFuture}
                title={`${date}${isFuture ? " — upcoming" : ""}`}
                onClick={() => check(date)}
                className={cn(
                  "flex h-8 min-w-8 flex-1 items-center justify-center rounded-md border text-[10px] tabular transition-transform",
                  isFuture ? "cursor-default opacity-40" : "hover:scale-105",
                  isToday && "ring-2 ring-offset-1 ring-offset-background"
                )}
                style={{
                  background: isDone ? color : "hsl(var(--sunken))",
                  borderColor: isDone ? color : "hsl(var(--border-soft))",
                  color: isDone ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                  ...(isToday ? ({ "--tw-ring-color": color } as React.CSSProperties) : {})
                }}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {habit.scheduledDates.length === 0 && (
          <div className="text-xs text-muted-foreground">No scheduled days this month.</div>
        )}

        {error && (
          <Badge variant="destructive" className="mt-3">
            {error}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
