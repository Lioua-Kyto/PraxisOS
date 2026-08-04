import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAddHabit } from "../../queries/habits";
import { HABIT_COLORS } from "./habitColors";
import type { HabitCadence } from "@shared/types";

export function AddHabitDialog() {
  const addHabit = useAddHabit();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cadence, setCadence] = useState<HabitCadence>("daily");
  const [color, setColor] = useState("primary");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addHabit.mutate({ name: name.trim(), cadence, color });
    setName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-3.5 w-3.5" /> Add habit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New habit</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={submit}>
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Read 20 pages" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cadence</Label>
            <Select value={cadence} onValueChange={(v) => setCadence(v as HabitCadence)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  title={c.label}
                  className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c.css, borderColor: color === c.key ? c.css : "transparent" }}
                />
              ))}
            </div>
          </div>
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
