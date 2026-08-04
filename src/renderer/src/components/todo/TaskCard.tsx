import { memo } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Badge } from "../ui/badge";
import type { Task, TaskPriority } from "@shared/types";

const PRIORITY_META: Record<TaskPriority, { label: string; variant: "destructive" | "default" | "warning" | "secondary" }> = {
  urgent_important: { label: "Do now", variant: "destructive" },
  important_not_urgent: { label: "Schedule", variant: "default" },
  urgent_not_important: { label: "Quick win", variant: "warning" },
  not_urgent_not_important: { label: "Later", variant: "secondary" }
};

// Memoized: a column can hold many cards, and only the card whose task
// actually changed (or the remove callback identity) needs to re-render when
// the tasks query refetches.
export const TaskCard = memo(function TaskCard({ task, onRemove }: { task: Task; onRemove: (id: number) => void }) {
  const meta = PRIORITY_META[task.priority];

  return (
    // Native HTML5 drag-and-drop lives on this plain element — motion.div
    // reserves onDragStart/onDrag/onDragEnd for its own pointer-gesture
    // system, so mixing native `draggable` onto the motion element itself
    // silently breaks dataTransfer. The inner motion.div only handles the
    // shared-layout animation when a card moves between columns.
    <div draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", String(task.id))} className="cursor-grab active:cursor-grabbing">
      <motion.div
        layoutId={`task-${task.id}`}
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 500, damping: 38 }}
        className="group rounded-md border border-border-soft bg-sunken p-3 text-[12.5px]"
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <Badge variant={meta.variant}>{meta.label}</Badge>
          <button
            onClick={() => onRemove(task.id)}
            className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className={task.status === "completed" ? "text-muted-foreground line-through" : ""}>{task.text}</div>
        {task.dueDate && <div className="mt-1.5 text-[10.5px] text-muted-foreground">Due {task.dueDate}</div>}
      </motion.div>
    </div>
  );
});
