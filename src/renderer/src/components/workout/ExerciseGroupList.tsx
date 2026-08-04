import { useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { useMergeToSuperset, useReorderExercises } from "../../queries/workouts";
import type { WorkoutExerciseGroup } from "@shared/types";

interface DropIndicator {
  groupKey: string;
  mode: "before" | "after" | "merge";
}

// Shared drag mechanics for both the main Workout editor and the live
// session window: click-and-hold drag on a group's row either reorders it
// among its day (dropped near the top/bottom edge of another group) or
// merges it into that group as a superset (dropped near the middle) — a
// single exercise can only be merged into another group; a group that's
// already a superset can still be reordered, just not merged further.
export function ExerciseGroupList({
  groups,
  renderGroup,
  disabled = false,
  onChanged
}: {
  groups: WorkoutExerciseGroup[];
  renderGroup: (group: WorkoutExerciseGroup, dragging: boolean) => ReactNode;
  disabled?: boolean;
  onChanged?: () => void;
}) {
  const reorder = useReorderExercises();
  const merge = useMergeToSuperset();
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [indicator, setIndicator] = useState<DropIndicator | null>(null);

  const handleDrop = (targetKey: string) => {
    if (!draggingKey || draggingKey === targetKey || !indicator) return;
    const draggedGroup = groups.find((g) => g.key === draggingKey);
    const targetGroup = groups.find((g) => g.key === targetKey);
    if (!draggedGroup || !targetGroup) return;

    if (indicator.mode === "merge" && draggedGroup.exercises.length === 1) {
      merge.mutate({ idA: targetGroup.exercises[0].id, idB: draggedGroup.exercises[0].id }, { onSuccess: onChanged });
    } else {
      const withoutDragged = groups.filter((g) => g.key !== draggingKey);
      const targetIndex = withoutDragged.findIndex((g) => g.key === targetKey);
      const insertAt = indicator.mode === "after" ? targetIndex + 1 : targetIndex;
      const reordered = [...withoutDragged];
      reordered.splice(insertAt, 0, draggedGroup);
      reorder.mutate(reordered.flatMap((g) => g.exercises.map((e) => e.id)), { onSuccess: onChanged });
    }
    setDraggingKey(null);
    setIndicator(null);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {groups.map((group) => (
        <div
          key={group.key}
          draggable={!disabled}
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", group.key);
            setDraggingKey(group.key);
          }}
          onDragEnd={() => {
            setDraggingKey(null);
            setIndicator(null);
          }}
          onDragOver={(e) => {
            if (disabled || !draggingKey || draggingKey === group.key) return;
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientY - rect.top) / rect.height;
            const draggedGroup = groups.find((g) => g.key === draggingKey);
            const canMerge = draggedGroup && draggedGroup.exercises.length === 1;
            const mode: DropIndicator["mode"] =
              canMerge && ratio > 0.28 && ratio < 0.72 ? "merge" : ratio < 0.5 ? "before" : "after";
            setIndicator({ groupKey: group.key, mode });
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(group.key);
          }}
          className={cn(
            "relative rounded-md transition-transform",
            !disabled && "cursor-grab active:cursor-grabbing",
            draggingKey === group.key && "opacity-40"
          )}
        >
          {indicator?.groupKey === group.key && indicator.mode === "before" && (
            <div className="absolute -top-1.5 left-0 right-0 h-0.5 rounded-full bg-primary" />
          )}
          {indicator?.groupKey === group.key && indicator.mode === "after" && (
            <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-primary" />
          )}
          <div
            className={cn(
              "rounded-md transition-colors",
              indicator?.groupKey === group.key && indicator.mode === "merge" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
          >
            {renderGroup(group, draggingKey === group.key)}
          </div>
        </div>
      ))}
    </div>
  );
}
