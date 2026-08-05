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

  // Days done outside the schedule still belong on the grid — a workout taken
  // outside or at a gym is a real check-in, not an anomaly to hide.
  const scheduled = new Set(habit.scheduledDates);
  const gridDates = [...new Set([...habit.scheduledDates, ...habit.completedDates])].sort();
  const bonusCount = habit.completedDates.filter((d) => !scheduled.has(d)).length;

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
                <span title="Its schedule follows your workout plan in Settings — you can still check in any day">
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
              {bonusCount > 0 && (
                <>
                  <span>·</span>
                  <span className="tabular" title="Check-ins on days the schedule didn't ask for">
                    +{bonusCount} extra
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant={doneToday ? "default" : "outline"}
              style={doneToday ? { background: color, borderColor: color } : undefined}
              title={
                doneToday
                  ? "Undo today's check-in"
                  : scheduledToday
                    ? "Check in for today"
                    : "Not scheduled today — check in anyway if you did it"
              }
              onClick={() => check(today)}
            >
              <Check className="h-3.5 w-3.5" /> {doneToday ? "Done" : "Check in"}
            </Button>
            {!habit.managedBy && (
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                aria-label={`Archive habit ${habit.name}`}
                title="Archive habit"
                onClick={() => archive.mutate(habit.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* One square per scheduled day this month, filling the card width. */}
        <div className="flex flex-wrap gap-1.5">
          {gridDates.map((date) => {
            const isDone = completed.has(date);
            const isToday = date === today;
            const isFuture = date > today;
            const isBonus = !scheduled.has(date);
            const dayNum = Number(date.slice(-2));
            return (
              <button
                key={date}
                type="button"
                disabled={isFuture}
                title={`${date}${isFuture ? " — upcoming" : isBonus ? " — extra, not scheduled" : ""}`}
                aria-label={`${habit.name} on ${date}: ${isDone ? "completed" : isFuture ? "upcoming" : "not completed"}`}
                aria-pressed={isDone}
                onClick={() => check(date)}
                className={cn(
                  "flex h-8 min-w-8 flex-1 items-center justify-center rounded-md border text-[10px] tabular transition-transform",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isFuture ? "cursor-default opacity-40" : "hover:scale-105",
                  isBonus && "border-dashed",
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
