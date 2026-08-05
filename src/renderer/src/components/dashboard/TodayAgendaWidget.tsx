import { CalendarCheck, Dumbbell, Flame } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { localDateString } from "@shared/datetime";
import type { HabitWithLogs, PageKeyLike } from "./dashboardTypes";

/**
 * What today actually asks of you — the scheduled workout plus every habit
 * due today, with its check state. Turns the dashboard from a set of numbers
 * into something you can act on.
 */
export function TodayAgendaWidget({
  habits,
  scheduledWorkout,
  onNavigate
}: {
  habits: HabitWithLogs[];
  scheduledWorkout: string | null;
  onNavigate: (page: PageKeyLike) => void;
}) {
  const today = localDateString();
  const dueToday = habits.filter((h) => h.scheduledDates.includes(today));
  const done = dueToday.filter((h) => h.completedDates.includes(today));

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Today's plan</h3>
          {dueToday.length > 0 && (
            <span className="tabular text-[11px] text-muted-foreground">
              {done.length}/{dueToday.length} done
            </span>
          )}
        </div>

        <button
          onClick={() => onNavigate("workout")}
          className="mb-3 flex w-full items-center gap-2.5 rounded-md bg-sunken px-3 py-2.5 text-left transition-colors hover:bg-accent"
        >
          <Dumbbell className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-[13px]">
            {scheduledWorkout ? `${scheduledWorkout} day` : "Rest day"}
          </span>
          {scheduledWorkout && <Badge variant="secondary">Scheduled</Badge>}
        </button>

        <div className="flex flex-col gap-1.5">
          {dueToday.slice(0, 5).map((h) => {
            const isDone = h.completedDates.includes(today);
            return (
              <button
                key={h.id}
                onClick={() => onNavigate("habits")}
                className="flex items-center gap-2.5 rounded-md px-1 py-1 text-left transition-colors hover:bg-accent"
              >
                <Flame className={cn("h-3.5 w-3.5 shrink-0", isDone ? "text-success" : "text-muted-foreground")} />
                <span className={cn("min-w-0 flex-1 truncate text-[12.5px]", isDone && "text-muted-foreground line-through")}>
                  {h.name}
                </span>
                {h.streak > 0 && <span className="tabular shrink-0 text-[10.5px] text-muted-foreground">{h.streak}d</span>}
              </button>
            );
          })}
          {dueToday.length === 0 && (
            <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
              <CalendarCheck className="h-3.5 w-3.5" /> No habits scheduled today.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
