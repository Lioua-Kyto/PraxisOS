import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useUpdateTask } from "../../queries/tasks";
import { clockFromStored, dateFromStored } from "@shared/datetime";
import type { Task, TaskPriority } from "@shared/types";

const PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: "urgent_important", label: "Do Now — Urgent & Important" },
  { value: "important_not_urgent", label: "Schedule — Important, Not Urgent" },
  { value: "urgent_not_important", label: "Quick Win — Urgent, Not Important" },
  { value: "not_urgent_not_important", label: "Later — Neither" }
];

function stampLine(label: string, value: string | null) {
  if (!value) return null;
  const date = dateFromStored(value);
  const clock = clockFromStored(value);
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular">
        {date} {clock}
      </span>
    </div>
  );
}

export function EditTaskDialog({ task, onOpenChange }: { task: Task | null; onOpenChange: (open: boolean) => void }) {
  const updateTask = useUpdateTask();
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("urgent_important");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!task) return;
    setText(task.text);
    setPriority(task.priority);
    setDueDate(task.dueDate ?? "");
    setError("");
  }, [task]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (!text.trim()) {
      setError("Task text can't be empty.");
      return;
    }
    updateTask.mutate({ id: task.id, fields: { text: text.trim(), priority, dueDate: dueDate || null } });
    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(task)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={submit}>
          <div className="flex flex-col gap-1.5">
            <Label>Task</Label>
            <Input
              autoFocus
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError("");
              }}
            />
            {error && <span className="text-[11px] text-destructive">{error}</span>}
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
            <Label>Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          {task && (task.startedAt || task.finishedAt) && (
            <div className="flex flex-col gap-1 rounded-md border border-border-soft bg-sunken p-2.5">
              {stampLine("Started", task.startedAt)}
              {stampLine("Finished", task.finishedAt)}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTask.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
