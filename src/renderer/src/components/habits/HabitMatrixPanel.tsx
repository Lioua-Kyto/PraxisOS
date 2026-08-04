import { PageHeader } from "../layout/PageHeader";
import { AddHabitDialog } from "./AddHabitDialog";
import { HabitCard } from "./HabitCard";
import { useHabits } from "../../queries/habits";

export function HabitMatrixPanel() {
  const { data: habits = [] } = useHabits();

  return (
    <div>
      <PageHeader kicker="Recurring rituals" title="Habit Matrix" action={<AddHabitDialog />} />

      <div className="grid grid-cols-2 gap-4">
        {habits.map((h) => (
          <HabitCard key={h.id} habit={h} />
        ))}
        {habits.length === 0 && (
          <div className="col-span-2 py-10 text-center text-sm text-muted-foreground">
            No habits yet — add one to start tracking a streak.
          </div>
        )}
      </div>
    </div>
  );
}
