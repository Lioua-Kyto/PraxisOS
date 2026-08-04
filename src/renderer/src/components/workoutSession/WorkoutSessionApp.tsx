import { ArrowLeft, Check, Pause, Play, RotateCcw, SkipForward, Trophy, X } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { ExerciseGroupList } from "../workout/ExerciseGroupList";
import { PhaseCountdown } from "./PhaseCountdown";
import { ExerciseDetailCard } from "./ExerciseDetailCard";
import { RestDurationControl } from "./RestDurationControl";
import { SetLogInput } from "./SetLogInput";
import {
  useCancelWorkoutSession,
  useCloseWorkoutSession,
  useFinishSet,
  usePauseRest,
  useRefreshWorkoutGroups,
  useResetRest,
  useResumeRest,
  useSkipRest,
  useStartExercise,
  useWorkoutGroups,
  useWorkoutSessionState,
  useWorkoutSessionSync
} from "../../queries/workoutSession";
import { useSettings } from "../../queries/settings";
import type { WorkoutExerciseGroup } from "@shared/types";

function groupTitle(group: WorkoutExerciseGroup): string {
  return group.exercises.map((e) => e.name).join(" + ");
}

function ProgressDots({ total, currentIndex }: { total: number; currentIndex: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i < currentIndex ? "bg-success" : i === currentIndex ? "bg-primary" : "bg-border-soft"
          )}
        />
      ))}
    </div>
  );
}

function SetPips({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-2 rounded-full",
            i < current - 1 ? "bg-success" : i === current - 1 ? "bg-primary ring-2 ring-primary/30" : "bg-border"
          )}
        />
      ))}
    </div>
  );
}

export function WorkoutSessionApp({ onReturn }: { onReturn: () => void }) {
  useWorkoutSessionSync();
  const { data: state } = useWorkoutSessionState();
  const { data: groups = [] } = useWorkoutGroups(state?.day ?? "", Boolean(state));
  const startExercise = useStartExercise();
  const finishSet = useFinishSet();
  const pauseRest = usePauseRest();
  const resumeRest = useResumeRest();
  const resetRest = useResetRest();
  const skipRest = useSkipRest();
  const refreshGroups = useRefreshWorkoutGroups();
  const cancelSession = useCancelWorkoutSession();
  const closeSession = useCloseWorkoutSession();
  const { data: settings } = useSettings();

  const finishAndReturn = async () => {
    await closeSession.mutateAsync();
    onReturn();
  };

  const cancel = async () => {
    if (settings?.confirmBeforeEndingWorkout && !confirm("End this workout now? Logged focus time is kept, but the habit won't be checked off.")) {
      return;
    }
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
  const nextGroup = groups.find((g) => g.key === state.groupOrder[state.currentGroupIndex + 1]);
  const isSuperset = (currentGroup?.exercises.length ?? 0) > 1;
  const isTimed = currentGroup?.exercises.some((e) => e.exerciseType === "time") ?? false;

  return (
    <div className="scrollbar-thin h-screen overflow-y-auto bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={onReturn}>
            <ArrowLeft className="h-4 w-4" /> Return
          </Button>
          <div className="text-center">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{state.day} day</div>
            <div className="text-xs text-muted-foreground">
              Exercise {Math.min(state.currentGroupIndex + 1, state.groupOrder.length)} of {state.groupOrder.length}
            </div>
          </div>
          {state.phase !== "complete" ? (
            <Button variant="ghost" size="icon" onClick={cancel} title="End workout">
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <div className="w-8" />
          )}
        </div>

        <ProgressDots total={state.groupOrder.length} currentIndex={state.currentGroupIndex} />

        {/* PREVIEW */}
        {state.phase === "preview" && currentGroup && (
          <div className="rounded-lg border border-border-soft bg-card p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Up next</div>
                <div className="mt-1 font-display text-2xl leading-tight">{groupTitle(currentGroup)}</div>
                {isSuperset && (
                  <div className="mt-1 font-mono text-[11px]" style={{ color: currentGroup.color ?? "hsl(var(--primary))" }}>
                    SUPERSET — back to back, no rest between them
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Sets</div>
                <div className="tabular font-display text-xl">{state.totalSets}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {currentGroup.exercises.map((ex) => (
                <ExerciseDetailCard key={ex.id} exercise={ex} accentColor={isSuperset ? currentGroup.color : null} />
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-4">
              <RestDurationControl restSeconds={state.restSeconds} />
              <Button size="lg" onClick={() => startExercise.mutate()} disabled={startExercise.isPending}>
                <Play className="h-4 w-4" /> Start exercise
              </Button>
            </div>
          </div>
        )}

        {/* COUNTDOWN */}
        {state.phase === "countdown" && currentGroup && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border-soft bg-card py-12">
            <div className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Get ready</div>
            {state.phaseEndsAt && (
              <PhaseCountdown mode="fixed" endsAt={state.phaseEndsAt} className="font-display tabular text-8xl leading-none text-primary" />
            )}
            <div className="font-display text-xl">{groupTitle(currentGroup)}</div>
            {state.totalSets > 1 && <SetPips total={state.totalSets} current={state.currentSet} />}
          </div>
        )}

        {/* WORK */}
        {state.phase === "work" && currentGroup && (
          <div className="rounded-lg border border-primary/60 bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="font-mono text-[10.5px] uppercase tracking-wide text-primary">Working</div>
              {state.totalSets > 1 && (
                <div className="flex items-center gap-2.5">
                  <span className="tabular text-xs text-muted-foreground">
                    Set {state.currentSet} of {state.totalSets}
                  </span>
                  <SetPips total={state.totalSets} current={state.currentSet} />
                </div>
              )}
            </div>

            <div className="font-display text-2xl leading-tight">{groupTitle(currentGroup)}</div>

            {isTimed && state.phaseEndsAt && (
              <div className="my-6 text-center">
                <PhaseCountdown mode="fixed" endsAt={state.phaseEndsAt} className="font-display tabular text-7xl leading-none text-primary" />
                <div className="mt-1 text-xs text-muted-foreground">seconds remaining</div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3">
              {currentGroup.exercises.map((ex) => (
                <ExerciseDetailCard key={ex.id} exercise={ex} accentColor={isSuperset ? currentGroup.color : null} compact={isTimed} />
              ))}
            </div>

            {!isTimed && (
              <SetLogInput
                exercises={currentGroup.exercises}
                setNumber={state.currentSet}
                onFinish={() => finishSet.mutate()}
                disabled={finishSet.isPending}
              />
            )}
          </div>
        )}

        {/* REST */}
        {state.phase === "rest" && (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border-soft bg-card py-8">
            <div className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
              {state.restRunning ? "Resting" : "Rest paused"}
            </div>
            <PhaseCountdown
              mode="rest"
              restSeconds={state.restSeconds}
              restElapsedSeconds={state.restElapsedSeconds}
              restRunning={state.restRunning}
              restStartedAt={state.restStartedAt}
              className="font-display tabular text-8xl leading-none text-warning"
            />

            <div className="flex items-center gap-2">
              {state.restRunning ? (
                <Button variant="outline" size="sm" onClick={() => pauseRest.mutate()}>
                  <Pause className="h-3.5 w-3.5" /> Pause
                </Button>
              ) : (
                <Button size="sm" onClick={() => resumeRest.mutate()}>
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

            <RestDurationControl restSeconds={state.restSeconds} label="Duration" />

            <div className="border-t border-border-soft pt-3 text-center text-sm text-muted-foreground">
              {state.currentSet < state.totalSets ? (
                <>
                  Next: <span className="text-foreground">Set {state.currentSet + 1} of {state.totalSets}</span>
                  {currentGroup && <> — {groupTitle(currentGroup)}</>}
                </>
              ) : nextGroup ? (
                <>
                  Up next: <span className="text-foreground">{groupTitle(nextGroup)}</span>
                </>
              ) : (
                "Last set — finish to complete the workout."
              )}
            </div>
          </div>
        )}

        {/* COMPLETE */}
        {state.phase === "complete" && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border-soft bg-card py-12">
            <Trophy className="h-10 w-10 text-warning" />
            <div className="font-display text-2xl">Workout complete</div>
            <div className="max-w-sm text-center text-sm text-muted-foreground">
              {state.groupOrder.length} exercise{state.groupOrder.length === 1 ? "" : "s"} finished · focus timer stopped · habit checked off
            </div>
            <Button className="mt-2" onClick={finishAndReturn}>
              Done
            </Button>
          </div>
        )}

        {/* SEQUENCE */}
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
                      "flex items-center justify-between gap-3 rounded-md border border-border-soft bg-card px-3.5 py-2.5",
                      status === "current" && "border-primary",
                      status === "done" && "opacity-50"
                    )}
                    style={group.color ? { borderLeftColor: group.color, borderLeftWidth: 3 } : undefined}
                  >
                    <div className="min-w-0 truncate text-[13px]">{groupTitle(group)}</div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="tabular text-[11px] text-muted-foreground">
                        {group.exercises[0].exerciseType === "time"
                          ? `${group.exercises[0].sets ?? 1} × ${group.exercises[0].durationSeconds ?? 30}s`
                          : `${group.exercises[0].sets ?? 1} × ${group.exercises[0].repsRange || "—"}`}
                      </span>
                      {status === "done" && <Check className="h-3.5 w-3.5 text-success" />}
                      {status === "current" && <Badge>Now</Badge>}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
