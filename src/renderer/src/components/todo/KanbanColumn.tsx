import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { TaskCard } from "./TaskCard";
import type { Task } from "@shared/types";

export function KanbanColumn({
  title,
  tasks,
  onDropTask,
  onRemove,
  onEdit
}: {
  title: string;
  tasks: Task[];
  onDropTask: (id: number) => void;
  onRemove: (id: number) => void;
  onEdit: (task: Task) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const id = Number(e.dataTransfer.getData("text/plain"));
        if (id) onDropTask(id);
      }}
      className={cn(
        "flex min-h-[420px] flex-col gap-2.5 rounded-lg border border-border-soft bg-card p-3 transition-colors",
        isOver && "border-primary/60 bg-accent/40"
      )}
    >
      <div className="mb-1 flex items-center justify-between px-1">
        <h4 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{title}</h4>
        <span className="text-[11px] text-muted-foreground">{tasks.length}</span>
      </div>
      <AnimatePresence initial={false}>
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onRemove={onRemove} onEdit={onEdit} />
        ))}
      </AnimatePresence>
      {tasks.length === 0 && <div className="px-1 py-6 text-center text-xs text-muted-foreground">Drop a task here</div>}
    </div>
  );
}
