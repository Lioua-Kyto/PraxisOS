import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useSetRestSeconds } from "../../queries/workoutSession";

// Shared by the preview screen (set rest before you start) and the rest
// screen itself (adjust mid-rest), so the value is always editable rather
// than only once the rest countdown is already running.
export function RestDurationControl({ restSeconds, label = "Rest between sets" }: { restSeconds: number; label?: string }) {
  const setRestSeconds = useSetRestSeconds();
  const [draft, setDraft] = useState<number | null>(null);
  const value = draft ?? restSeconds;

  const commit = (next: number) => {
    const clamped = Math.max(5, next);
    setDraft(clamped);
    setRestSeconds.mutate(clamped);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Button size="icon" variant="outline" onClick={() => commit(value - 10)} aria-label="Decrease rest">
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={(e) => setDraft(Number(e.target.value))}
        onBlur={() => commit(value)}
        className="w-20 text-center tabular"
      />
      <Button size="icon" variant="outline" onClick={() => commit(value + 10)} aria-label="Increase rest">
        <Plus className="h-3.5 w-3.5" />
      </Button>
      <span className="text-xs text-muted-foreground">sec</span>
    </div>
  );
}
