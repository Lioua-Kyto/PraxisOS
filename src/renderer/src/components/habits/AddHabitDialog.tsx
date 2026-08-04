import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../../lib/utils";
import { useAddHabit } from "../../queries/habits";
import { HABIT_COLORS, WEEKDAY_LABELS } from "./habitColors";
import type { HabitCadence } from "@shared/types";

export function AddHabitDialog({ month }: { month: string }) {
  const addHabit = useAddHabit(month);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cadence, setCadence] = useState<HabitCadence>("daily");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [color, setColor] = useState("primary");
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setCadence("daily");
    setWeekdays([]);
    setColor("primary");
    setError("");
  };

  const toggleWeekday = (day: number) => {
    setError("");
    if (cadence === "weekly") {
      setWeekdays([day]);
      return;
    }
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give the habit a name.");
      return;
    }
    if (cadence !== "daily" && weekdays.length === 0) {
      setError(cadence === "weekly" ? "Pick the day of the week." : "Pick at least one day.");
      return;
    }
    addHabit.mutate({ name: name.trim(), cadence, weekdays, color });
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-3.5 w-3.5" /> Add habit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New habit</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="Read 20 pages"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Cadence</Label>
            <Select
              value={cadence}
              onValueChange={(v) => {
                setCadence(v as HabitCadence);
                setWeekdays([]);
                setError("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily — every day</SelectItem>
                <SelectItem value="weekly">Weekly — one day a week</SelectItem>
                <SelectItem value="custom">Custom — pick specific days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {cadence !== "daily" && (
            <div className="flex flex-col gap-1.5">
              <Label>{cadence === "weekly" ? "Which day" : "Which days"}</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_LABELS.map((label, day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    className={cn(
                      "rounded-md border border-border px-2.5 py-1.5 text-[11px] transition-colors hover:border-primary/50",
                      weekdays.includes(day) && "border-primary bg-primary/10 text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  title={c.label}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c.css, borderColor: color === c.key ? "hsl(var(--foreground))" : "transparent" }}
                >
                  {color === c.key && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {error && <span className="text-[11px] text-destructive">{error}</span>}

          <DialogFooter>
            <Button type="submit" disabled={addHabit.isPending}>
              Add habit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
