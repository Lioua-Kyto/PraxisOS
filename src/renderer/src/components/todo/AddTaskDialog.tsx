import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAddTask } from "../../queries/tasks";
import type { TaskPriority } from "@shared/types";

const PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: "urgent_important", label: "Do Now — Urgent & Important" },
  { value: "important_not_urgent", label: "Schedule — Important, Not Urgent" },
  { value: "urgent_not_important", label: "Quick Win — Urgent, Not Important" },
  { value: "not_urgent_not_important", label: "Later — Neither" }
];

export function AddTaskDialog() {
  const addTask = useAddTask();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("urgent_important");
  const [dueDate, setDueDate] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addTask.mutate({ text: text.trim(), priority, dueDate: dueDate || null });
    setText("");
    setDueDate("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-3.5 w-3.5" /> Add task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={submit}>
          <div className="flex flex-col gap-1.5">
            <Label>What needs doing?</Label>
            <Input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Write the next PraxisOS release notes" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Due date (optional)</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={addTask.isPending}>
              Add to board
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
