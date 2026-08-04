import { Check, Flame, Trash2 } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Heatmap } from "../viz/Heatmap";
import { habitColorCss } from "./habitColors";
import { useArchiveHabit, useToggleHabitDate } from "../../queries/habits";
import type { HabitWithLogs } from "@shared/types";

const today = () => new Date().toISOString().slice(0, 10);

export function HabitCard({ habit }: { habit: HabitWithLogs }) {
  const toggle = useToggleHabitDate();
  const archive = useArchiveHabit();
  const color = habitColorCss(habit.color);
  const doneToday = habit.completedDates.includes(today());

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="font-display text-base">{habit.name}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flame className="h-3.5 w-3.5" style={{ color }} />
              {habit.streak} {habit.cadence === "weekly" ? "week" : "day"} streak
              <span className="capitalize"> · {habit.cadence}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant={doneToday ? "default" : "outline"}
              className={doneToday ? "" : undefined}
              style={doneToday ? { background: color, borderColor: color } : undefined}
              onClick={() => toggle.mutate({ id: habit.id, date: today() })}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => archive.mutate(habit.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Heatmap
          completedDates={habit.completedDates}
          color={color}
          onToggle={(date) => toggle.mutate({ id: habit.id, date })}
        />
      </CardContent>
    </Card>
  );
}
