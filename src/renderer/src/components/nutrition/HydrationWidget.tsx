import { useState } from "react";
import { Droplet } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { useAddHydration, useHydrationToday, useRemoveHydration } from "../../queries/nutrition";

const QUICK_ADD = [250, 330, 500, 750];

export function HydrationWidget({ goalMl }: { goalMl: number }) {
  const { data: entries = [] } = useHydrationToday();
  const addHydration = useAddHydration();
  const removeHydration = useRemoveHydration();
  const [custom, setCustom] = useState("");

  const total = entries.reduce((a, e) => a + e.amountMl, 0);
  const pct = Math.min(100, Math.round((total / goalMl) * 100));

  const add = (ml: number) => {
    if (!ml) return;
    addHydration.mutate(ml);
    setCustom("");
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Droplet className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Hydration</h3>
      </div>
      <div className="font-display text-[26px]">
        {(total / 1000).toFixed(2)}
        <span className="ml-1 text-sm text-muted-foreground">/ {(goalMl / 1000).toFixed(1)}L</span>
      </div>
      <Progress value={pct} className="mt-2 mb-4" />

      <div className="flex flex-wrap items-center gap-2">
        {QUICK_ADD.map((ml) => (
          <Button key={ml} variant="outline" size="sm" onClick={() => add(ml)}>
            +{ml}ml
          </Button>
        ))}
        <Input type="number" placeholder="Custom ml" value={custom} onChange={(e) => setCustom(e.target.value)} className="w-24" />
        <Button size="sm" onClick={() => add(Number(custom))}>
          Add
        </Button>
      </div>

      {entries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entries.map((e) => (
            <button
              key={e.id}
              onClick={() => removeHydration.mutate(e.id)}
              title="Click to remove"
              className="rounded-full border border-border-soft bg-sunken px-2 py-0.5 text-[11px] text-muted-foreground hover:border-destructive hover:text-destructive"
            >
              {e.amountMl}ml · {e.time.slice(0, 5)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
