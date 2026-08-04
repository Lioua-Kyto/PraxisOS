import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { Button } from "../ui/button";
import { AddHabitDialog } from "./AddHabitDialog";
import { HabitCard } from "./HabitCard";
import { useHabits } from "../../queries/habits";
import { localDateString } from "@shared/datetime";

function shiftMonth(month: string, delta: number): string {
  const [year, monthNum] = month.split("-").map(Number);
  const d = new Date(year, monthNum - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(year, monthNum - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function HabitMatrixPanel() {
  const currentMonth = localDateString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const { data: habits = [] } = useHabits(month);

  return (
    <div>
      <PageHeader kicker="Recurring rituals" title="Habit Matrix" action={<AddHabitDialog month={month} />} />

      <div className="mb-4 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-44 text-center font-display text-base">{monthLabel(month)}</div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={month >= currentMonth}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {month !== currentMonth && (
          <Button variant="ghost" size="sm" onClick={() => setMonth(currentMonth)}>
            This month
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {habits.map((h) => (
          <HabitCard key={h.id} habit={h} month={month} />
        ))}
        {habits.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No habits yet — add one to start tracking a streak.
          </div>
        )}
      </div>
    </div>
  );
}
