import { useMemo, useRef, useState } from "react";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { useFoods } from "../../queries/foods";
import type { Food } from "@shared/types";

/**
 * Food name field that suggests from the food library as you type. Results
 * are scoped to the selected meal (plus "Any" foods), and picking one fills
 * in its calories/protein so logging a known food is a single click.
 */
export function FoodAutocomplete({
  value,
  meal,
  onChange,
  onPick,
  className
}: {
  value: string;
  meal: string;
  onChange: (value: string) => void;
  onPick: (food: Food) => void;
  className?: string;
}) {
  const { data: foods = [] } = useFoods();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const inMeal = foods.filter((f) => f.category === meal || f.category === "Any");
    const query = value.trim().toLowerCase();
    const pool = query ? inMeal.filter((f) => f.name.toLowerCase().includes(query)) : inMeal;
    return pool.slice(0, 8);
  }, [foods, meal, value]);

  const choose = (food: Food) => {
    onPick(food);
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        value={value}
        placeholder="Food"
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so a click on a suggestion lands before the list unmounts.
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => (h + 1) % matches.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => (h - 1 + matches.length) % matches.length);
          } else if (e.key === "Enter" && matches[highlight]) {
            e.preventDefault();
            choose(matches[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />

      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border-soft bg-popover p-1 shadow-lg">
          {matches.map((food, i) => (
            <button
              key={food.id}
              type="button"
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                choose(food);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-left text-[13px]",
                i === highlight && "bg-accent text-accent-foreground"
              )}
            >
              <span className="min-w-0 truncate">
                {food.name}
                <span className="ml-1.5 text-[10.5px] text-muted-foreground">{food.servingLabel}</span>
              </span>
              <span className="tabular shrink-0 text-[11px] text-muted-foreground">
                {food.calories} kcal · {food.proteinG}g
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
