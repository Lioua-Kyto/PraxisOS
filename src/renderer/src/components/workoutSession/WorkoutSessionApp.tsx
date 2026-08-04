import { useState } from "react";
import { ArrowLeft, Check, Minus, Pause, Play, Plus, RotateCcw, SkipForward, Trophy, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { ExerciseGroupList } from "../workout/ExerciseGroupList";
import { PhaseCountdown } from "./PhaseCountdown";
import {
  useCancelWorkoutSession,
  useCloseWorkoutSession,
  useFinishSet,
  usePauseRest,
  useRefreshWorkoutGroups,
  useResetRest,
  useResumeRest,
  useSetRestSeconds,
  useSkipRest,
  useStartExercise,
  useWorkoutGroups,
  useWorkoutSessionState,
  useWorkoutSessionSync
} from "../../queries/workoutSession";
import type { WorkoutExerciseGroup } from "@shared/types";

function GroupLabel({ group }: { group: WorkoutExerciseGroup }) {
  return <div className="font-display text-2xl leading-tight">{group.exercises.map((e) => e.name).join(" + ")}</div>;
}

function ExerciseFacts({ group }: { group: WorkoutExerciseGroup }) {
  return (
    <div className="mt-3 flex flex-col gap-4">
      {group.exercises.map((ex) => (
        <div key={ex.id}>
          <div className="tabular text-sm text-muted-foreground">
            {ex.sets} × {ex.exerciseType === "time" ? `${ex.durationSeconds ?? 30}s` : ex.repsRange}
          </div>
          {ex.progression && <div className="mt-1 text-xs text-muted-foreground">{ex.progression}</div>}
          {ex.tips && <div className="mt-1 text-[13px]">{ex.tips}</div>}
          {ex.videoPath && <video className="mt-2 max-w-full rounded-md border border-border" src={`file://${ex.videoPath}`} controls />}
        </div>
      ))}
    </div>
  );
}

function RestControls({
  restSeconds,
  restElapsedSeconds,
  restRunning,
  restStartedAt
}: {
  restSeconds: number;
  restElapsedSeconds: number;
  restRunning: boolean;
  restStartedAt: string | null;
}) {
  const setRestSeconds = useSetRestSeconds();
  const pauseRest = usePauseRest();
  const resumeRest = useResumeRest();
  const resetRest = useResetRest();
  const skipRest = useSkipRest();
  const [draft, setDraft] = useState<number | null>(null);
  const value = draft ?? restSeconds;

  return (
    <div className="flex flex-col items-center gap-4">
      <PhaseCountdown
        mode="rest"
        restSeconds={restSeconds}
        restElapsedSeconds={restElapsedSeconds}
        restRunning={restRunning}
        restStartedAt={restStartedAt}
        className="font-display tabular text-7xl text-warning"
      />
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={() => {
            const next = Math.max(5, value - 10);
            setDraft(next);
            setRestSeconds.mutate(next);
          }}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Input
          type="number"
          value={value}
          onChange={(e) => setDraft(Number(e.target.value))}
          onBlur={() => setRestSeconds.mutate(value)}
          className="w-20 text-center"
        />
        <Button
          size="icon"
          variant="outline"
          onClick={() => {
            const next = value + 10;
            setDraft(next);
            setRestSeconds.mutate(next);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground">seconds rest</span>
      </div>
      <div className="flex items-center gap-2">
        {restRunning ? (
          <Button variant="outline" size="sm" onClick={() => pauseRest.mutate()}>
            <Pause className="h-3.5 w-3.5" /> Pause
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => resumeRest.mutate()}>
            <Play className="h-3.5 w-3.5" /> Resume
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => resetRest.mutate()}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
        <Button variant="ghost" size="sm" onClick={() => skipRest.mutate()}>
          <SkipForward className="h-3.5 w-3.5" /> Skip
        </Button>
      </div>
    </div>
  );
}

export function WorkoutSessionApp({ onReturn }: { onReturn: () => void }) {
  useWorkoutSessionSync();
  const { data: state } = useWorkoutSessionState();
  const { data: groups = [] } = useWorkoutGroups(state?.day ?? "", Boolean(state));
  const startExercise = useStartExercise();
  const finishSet = useFinishSet();
  const refreshGroups = useRefreshWorkoutGroups();
  const cancelSession = useCancelWorkoutSession();
  const closeSession = useCloseWorkoutSession();

  const finishAndReturn = async () => {
    await closeSession.mutateAsync();
    onReturn();
  };

  const cancel = async () => {
    await cancelSession.mutateAsync();
    onReturn();
  };

  if (!state) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="font-display text-lg">No active workout session</div>
        <Button variant="outline" onClick={onReturn}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
      </div>
    );
  }

  const currentKey = state.groupOrder[state.currentGroupIndex];
  const currentGroup = groups.find((g) => g.key === currentKey);
  const nextKey = state.groupOrder[state.currentGroupIndex + 1];
  const nextGroup = groups.find((g) => g.key === nextKey);

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-background p-6">
      <div className="mb-5 flex items-center justify-between">
        <Button variant="ghost" onClick={onReturn}>
          <ArrowLeft className="h-4 w-4" /> Return
        </Button>
        <div className="text-right">
          <div className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">{state.day} day</div>
          <div className="text-xs text-muted-foreground">
            Exercise {Math.min(state.currentGroupIndex + 1, state.groupOrder.length)} of {state.groupOrder.length}
          </div>
        </div>
        {state.phase !== "complete" && (
          <Button variant="ghost" size="icon" onClick={cancel} title="End workout">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {state.phase === "preview" && currentGroup && (
        <div className="mb-6 rounded-lg border border-border-soft bg-card p-6">
          <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Up next</div>
          <GroupLabel group={currentGroup} />
          {state.totalSets > 1 && <div className="tabular mt-1 text-sm text-muted-foreground">Set 1 of {state.totalSets}</div>}
          <ExerciseFacts group={currentGroup} />
          <Button className="mt-5 w-full" size="lg" onClick={() => startExercise.mutate()} disabled={startExercise.isPending}>
            <Play className="h-4 w-4" /> Start exercise
          </Button>
        </div>
      )}

      {state.phase === "countdown" && currentGroup && (
        <div className="mb-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-border-soft bg-card py-10">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Get ready</div>
          {state.phaseEndsAt && <PhaseCountdown mode="fixed" endsAt={state.phaseEndsAt} className="font-display tabular text-7xl text-primary" />}
          <GroupLabel group={currentGroup} />
          {state.totalSets > 1 && <div className="tabular text-sm text-muted-foreground">Set {state.currentSet} of {state.totalSets}</div>}
        </div>
      )}

      {state.phase === "work" && currentGroup && (
        <div className="mb-6 rounded-lg border border-border-soft bg-card p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Working</div>
            {state.totalSets > 1 && <Badge variant="secondary">Set {state.currentSet} of {state.totalSets}</Badge>}
          </div>
          <GroupLabel group={currentGroup} />
          {currentGroup.exercises.some((e) => e.exerciseType === "time") && state.phaseEndsAt ? (
            <PhaseCountdown mode="fixed" endsAt={state.phaseEndsAt} className="font-display tabular mt-3 text-6xl text-primary" />
          ) : (
            <ExerciseFacts group={currentGroup} />
          )}
          {!currentGroup.exercises.some((e) => e.exerciseType === "time") && (
            <Button className="mt-5 w-full" size="lg" onClick={() => finishSet.mutate()} disabled={finishSet.isPending}>
              <Check className="h-4 w-4" /> Finish set
            </Button>
          )}
        </div>
      )}

      {state.phase === "rest" && (
        <div className="mb-6 flex flex-col items-center justify-center gap-2 rounded-lg border border-border-soft bg-card py-8">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Resting</div>
          <RestControls
            restSeconds={state.restSeconds}
            restElapsedSeconds={state.restElapsedSeconds}
            restRunning={state.restRunning}
            restStartedAt={state.restStartedAt}
          />
          <div className="mt-2 text-center text-sm text-muted-foreground">
            {state.currentSet < state.totalSets ? (
              <>
                Next: <span className="text-foreground">Set {state.currentSet + 1} of {state.totalSets}</span>
                {currentGroup && <> — {currentGroup.exercises.map((e) => e.name).join(" + ")}</>}
              </>
            ) : (
              nextGroup && (
                <>
                  Up next: <span className="text-foreground">{nextGroup.exercises.map((e) => e.name).join(" + ")}</span>
                </>
              )
            )}
          </div>
        </div>
      )}

      {state.phase === "complete" && (
        <div className="mb-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-border-soft bg-card py-12">
          <Trophy className="h-10 w-10 text-warning" />
          <div className="font-display text-2xl">Workout complete</div>
          <div className="text-sm text-muted-foreground">
            {state.groupOrder.length} exercise{state.groupOrder.length === 1 ? "" : "s"} logged · focus timer stopped · habit checked off
          </div>
          <Button className="mt-2" onClick={finishAndReturn}>
            Done
          </Button>
        </div>
      )}

      {state.phase !== "complete" && groups.length > 0 && (
        <div>
          <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Sequence</div>
          <ExerciseGroupList
            groups={groups}
            onChanged={() => refreshGroups.mutate()}
            renderGroup={(group) => {
              const index = state.groupOrder.indexOf(group.key);
              const status = index < state.currentGroupIndex ? "done" : index === state.currentGroupIndex ? "current" : "upcoming";
              return (
                <div
                  className={cn(
                    "flex items-center justify-between rounded-md border border-border-soft bg-card px-3.5 py-2.5",
                    status === "current" && "border-primary",
                    status === "done" && "opacity-50"
                  )}
                >
                  <div className="text-[13px]">{group.exercises.map((e) => e.name).join(" + ")}</div>
                  {status === "done" && <Check className="h-3.5 w-3.5 text-success" />}
                  {status === "current" && <Badge>Now</Badge>}
                </div>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
