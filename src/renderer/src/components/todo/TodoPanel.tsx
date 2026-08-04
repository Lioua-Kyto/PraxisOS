import { useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Progress } from "../ui/progress";
import { KanbanColumn } from "./KanbanColumn";
import { AddTaskDialog } from "./AddTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import { useRemoveTask, useSetTaskStatus, useTasks } from "../../queries/tasks";
import type { Task, TaskStatus } from "@shared/types";

const COLUMNS: Array<{ key: TaskStatus; title: string }> = [
  { key: "todo", title: "To Do" },
  { key: "in_progress", title: "In Progress" },
  { key: "completed", title: "Completed" }
];

export function TodoPanel() {
  const { data: tasks = [] } = useTasks();
  const setStatus = useSetTaskStatus();
  const removeTask = useRemoveTask();
  const [editing, setEditing] = useState<Task | null>(null);

  const done = tasks.filter((t) => t.status === "completed").length;
  const completionRate = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div>
      <PageHeader kicker="Command center" title="Tasks" action={<AddTaskDialog />} />

      <div className="mb-6 flex items-center gap-4 rounded-lg border border-border-soft bg-card p-4">
        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Productivity snapshot</span>
            <span className="text-muted-foreground">
              {done}/{tasks.length} done ({completionRate}%)
            </span>
          </div>
          <Progress value={completionRate} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            title={col.title}
            tasks={tasks.filter((t) => t.status === col.key)}
            onDropTask={(id) => setStatus.mutate({ id, status: col.key })}
            onRemove={removeTask.mutate}
            onEdit={setEditing}
          />
        ))}
      </div>

      <EditTaskDialog task={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  );
}
