import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useLogSet } from "../../queries/workouts";
import type { WorkoutExercise } from "@shared/types";

/**
 * Logs reps/weight for the set you just finished, inline, so the volume
 * history fills itself in during the workout instead of having to be
 * re-entered afterwards from the exercise detail view.
 *
 * Logging is optional — "Finish set" always advances the session whether or
 * not numbers were entered, so it never blocks the flow.
 */
export function SetLogInput({
  exercises,
  setNumber,
  onFinish,
  disabled
}: {
  exercises: WorkoutExercise[];
  setNumber: number;
  onFinish: () => void;
  disabled?: boolean;
}) {
  const logSet = useLogSet();
  const [entries, setEntries] = useState<Record<number, { reps: string; weight: string }>>({});

  const update = (id: number, patch: Partial<{ reps: string; weight: string }>) =>
    setEntries((prev) => {
      const current = prev[id] ?? { reps: "", weight: "" };
      return { ...prev, [id]: { ...current, ...patch } };
    });

  const finish = () => {
    for (const ex of exercises) {
      const entry = entries[ex.id];
      if (!entry?.reps) continue;
      logSet.mutate({
        exerciseId: ex.id,
        setNumber,
        reps: Number(entry.reps),
        weightKg: entry.weight ? Number(entry.weight) : null,
        notes: ""
      });
    }
    setEntries({});
    onFinish();
  };

  return (
    <div className="mt-4 rounded-md border border-border-soft bg-sunken p-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        Log set {setNumber} <span className="normal-case tracking-normal">(optional)</span>
      </div>

      <div className="flex flex-col gap-2">
        {exercises.map((ex) => (
          <div key={ex.id} className="flex flex-wrap items-end gap-2">
            {exercises.length > 1 && (
              <span className="min-w-24 flex-1 truncate text-[12px] text-muted-foreground">{ex.name}</span>
            )}
            <div className="flex flex-col gap-1">
              <Label htmlFor={`reps-${ex.id}`}>Reps</Label>
              <Input
                id={`reps-${ex.id}`}
                type="number"
                inputMode="numeric"
                value={entries[ex.id]?.reps ?? ""}
                onChange={(e) => update(ex.id, { reps: e.target.value })}
                className="w-20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`weight-${ex.id}`}>Weight kg</Label>
              <Input
                id={`weight-${ex.id}`}
                type="number"
                inputMode="decimal"
                value={entries[ex.id]?.weight ?? ""}
                onChange={(e) => update(ex.id, { weight: e.target.value })}
                className="w-24"
              />
            </div>
          </div>
        ))}
      </div>

      <Button className="mt-3 w-full" size="lg" onClick={finish} disabled={disabled}>
        <Check className="h-4 w-4" /> Finish set {setNumber}
      </Button>
    </div>
  );
}
