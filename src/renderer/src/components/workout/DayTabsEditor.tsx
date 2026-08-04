import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { useSettings, useUpdateSettings } from "../../queries/settings";

export function DayTabsEditor() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [newDay, setNewDay] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const openDialog = () => {
    setDays(settings?.workoutDays ?? ["Push", "Pull", "Legs"]);
    setOpen(true);
  };

  const save = (next: string[]) => {
    setDays(next);
    updateSettings.mutate({ workoutDays: next });
  };

  const addDay = () => {
    const name = newDay.trim();
    if (!name || days.includes(name)) {
      setNewDay("");
      return;
    }
    save([...days, name]);
    setNewDay("");
  };

  const removeDay = (index: number) => {
    if (days.length <= 1) return;
    save(days.filter((_, i) => i !== index));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= days.length) return;
    const next = [...days];
    [next[index], next[target]] = [next[target], next[index]];
    save(next);
  };

  const commitRename = () => {
    if (editingIndex === null) return;
    const name = editValue.trim();
    if (name) {
      const next = [...days];
      next[editingIndex] = name;
      save(next);
    }
    setEditingIndex(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? openDialog() : setOpen(false))}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-3.5 w-3.5" /> Edit plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workout plan days</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {days.map((d, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-border-soft bg-sunken px-2.5 py-1.5">
              {editingIndex === i ? (
                <Input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => e.key === "Enter" && commitRename()}
                  className="h-7 flex-1"
                />
              ) : (
                <button
                  className="flex-1 text-left text-sm"
                  onClick={() => {
                    setEditingIndex(i);
                    setEditValue(d);
                  }}
                >
                  {d}
                </button>
              )}
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                ↑
              </button>
              <button onClick={() => move(i, 1)} disabled={i === days.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                ↓
              </button>
              <button onClick={() => removeDay(i)} disabled={days.length <= 1} className="text-muted-foreground hover:text-destructive disabled:opacity-30">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addDay();
          }}
        >
          <Input placeholder="e.g. Upper" value={newDay} onChange={(e) => setNewDay(e.target.value)} className="flex-1" />
          <Button type="submit" size="sm">
            <Plus className="h-3.5 w-3.5" /> Add day
          </Button>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
