import { Badge } from "../ui/badge";
import { toFileUrl } from "../../lib/fileUrl";
import type { WorkoutExercise } from "@shared/types";

export function ExerciseDetailCard({
  exercise,
  accentColor,
  compact = false
}: {
  exercise: WorkoutExercise;
  accentColor?: string | null;
  compact?: boolean;
}) {
  const target =
    exercise.exerciseType === "time"
      ? `${exercise.sets ?? 1} × ${exercise.durationSeconds ?? 30}s`
      : `${exercise.sets ?? 1} × ${exercise.repsRange || "—"}`;

  return (
    <div
      className="rounded-lg border border-border-soft bg-sunken p-4"
      style={accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 3 } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="font-display text-base leading-tight">{exercise.name}</div>
        <Badge variant="secondary" className="shrink-0 tabular">
          {target}
        </Badge>
      </div>

      {!compact && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          {exercise.videoPath && (
            <video
              key={exercise.videoPath}
              className="w-full shrink-0 rounded-md border border-border sm:w-56"
              src={toFileUrl(exercise.videoPath)}
              controls
              preload="metadata"
              playsInline
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {exercise.progression && (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Progression</div>
                <div className="text-xs text-muted-foreground">{exercise.progression}</div>
              </div>
            )}
            {exercise.tips && (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Form cues</div>
                <div className="text-[13px]">{exercise.tips}</div>
              </div>
            )}
            {!exercise.progression && !exercise.tips && !exercise.videoPath && (
              <div className="text-xs text-muted-foreground">No notes or clip for this exercise yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
