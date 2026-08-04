import type { BrowserWindow } from "electron";
import { randomUUID } from "node:crypto";
import { startFocusSession, stopFocusSession } from "../ipc/focusTimer";
import { completeHabitToday } from "../ipc/habits";
import { WORKOUT_HABIT_NAME } from "../db/seed";
import { getExerciseGroupsForDay } from "../ipc/workoutHelpers";
import type { WorkoutExerciseGroup, WorkoutSessionState } from "../../shared/types";

const COUNTDOWN_SECONDS = 5;
const DEFAULT_REST_SECONDS = 60;

let state: WorkoutSessionState | null = null;
let phaseTimer: NodeJS.Timeout | null = null;
let mainWindow: BrowserWindow | null = null;

export function registerMainWindow(win: BrowserWindow): void {
  mainWindow = win;
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });
}

function clearPhaseTimer(): void {
  if (phaseTimer) clearTimeout(phaseTimer);
  phaseTimer = null;
}

function broadcast(): void {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("workoutSession:changed");
}

function scheduleTransition(seconds: number, onElapsed: () => void): void {
  clearPhaseTimer();
  phaseTimer = setTimeout(() => {
    onElapsed();
    broadcast();
  }, Math.max(0, seconds) * 1000);
}

function currentGroup(): WorkoutExerciseGroup | null {
  if (!state) return null;
  const groups = getExerciseGroupsForDay(state.day);
  return groups.find((g) => g.key === state!.groupOrder[state!.currentGroupIndex]) ?? null;
}

function totalSetsFor(group: WorkoutExerciseGroup): number {
  return Math.max(1, ...group.exercises.map((e) => e.sets ?? 1));
}

function timeBasedDuration(group: WorkoutExerciseGroup): number | null {
  const durations = group.exercises.filter((e) => e.exerciseType === "time").map((e) => e.durationSeconds ?? 30);
  return durations.length ? Math.max(...durations) : null;
}

function beginPreview(groupIndex: number): void {
  if (!state) return;
  state.currentGroupIndex = groupIndex;
  state.currentSet = 1;
  state.phase = "preview";
  state.phaseEndsAt = null;
  const group = currentGroup();
  state.totalSets = group ? totalSetsFor(group) : 1;
  clearPhaseTimer();
  restResumeAction = null;
}

function beginCountdown(): void {
  if (!state) return;
  state.phase = "countdown";
  state.phaseEndsAt = new Date(Date.now() + COUNTDOWN_SECONDS * 1000).toISOString();
  scheduleTransition(COUNTDOWN_SECONDS, beginWork);
}

function beginWork(): void {
  if (!state) return;
  state.phase = "work";
  const group = currentGroup();
  const timedDuration = group ? timeBasedDuration(group) : null;
  if (timedDuration) {
    state.phaseEndsAt = new Date(Date.now() + timedDuration * 1000).toISOString();
    scheduleTransition(timedDuration, completeCurrentSet);
  } else {
    state.phaseEndsAt = null;
  }
}

// Stored so pause/resume/reset/skip can reschedule (or immediately invoke)
// the same "what happens after this rest" callback.
let restResumeAction: (() => void) | null = null;

function beginRest(afterElapsed: () => void): void {
  if (!state) return;
  state.phase = "rest";
  state.phaseEndsAt = null;
  state.restElapsedSeconds = 0;
  state.restRunning = true;
  state.restStartedAt = new Date().toISOString();
  restResumeAction = afterElapsed;
  scheduleTransition(state.restSeconds, afterElapsed);
}

function completeCurrentSet(): void {
  if (!state) return;
  const isLastSetOfExercise = state.currentSet >= state.totalSets;
  const isLastGroup = state.currentGroupIndex >= state.groupOrder.length - 1;

  if (isLastSetOfExercise && isLastGroup) {
    completeSession();
    return;
  }

  const afterRest = isLastSetOfExercise
    ? () => beginPreview(state!.currentGroupIndex + 1)
    : () => {
        state!.currentSet += 1;
        beginCountdown();
      };

  beginRest(afterRest);
}

function completeSession(): void {
  if (!state) return;
  clearPhaseTimer();
  restResumeAction = null;
  if (state.focusSessionId) stopFocusSession(state.focusSessionId);
  completeHabitToday(WORKOUT_HABIT_NAME);
  state.phase = "complete";
  state.phaseEndsAt = null;
  state.restRunning = false;
  state.restStartedAt = null;
}

function secondsSince(iso: string): number {
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
}

export function getSessionState(): WorkoutSessionState | null {
  return state;
}

export function startSession(day: string): WorkoutSessionState {
  if (state) return state;

  const groups = getExerciseGroupsForDay(day);
  if (groups.length === 0) throw new Error(`No exercises found for ${day}`);

  const focusSession = startFocusSession("training", `Workout: ${day}`);

  state = {
    id: randomUUID(),
    day,
    groupOrder: groups.map((g) => g.key),
    currentGroupIndex: 0,
    currentSet: 1,
    totalSets: totalSetsFor(groups[0]),
    phase: "preview",
    phaseEndsAt: null,
    restSeconds: DEFAULT_REST_SECONDS,
    restElapsedSeconds: 0,
    restRunning: false,
    restStartedAt: null,
    focusSessionId: focusSession.id,
    startedAt: new Date().toISOString()
  };

  broadcast();
  return state;
}

// User-initiated: leaves "preview" and starts the 5s countdown for the
// exercise currently being previewed.
export function startExercise(): WorkoutSessionState {
  if (!state) throw new Error("No active workout session");
  if (state.phase === "preview") beginCountdown();
  broadcast();
  return state;
}

// User-initiated "Finish set" (reps-based exercises only — time-based work
// phases complete themselves via the scheduled timer).
export function finishSet(): WorkoutSessionState {
  if (!state) throw new Error("No active workout session");
  if (state.phase === "work") completeCurrentSet();
  broadcast();
  return state;
}

export function setRestSeconds(seconds: number): WorkoutSessionState | null {
  if (!state) return null;
  state.restSeconds = Math.max(5, Math.round(seconds));
  if (state.phase === "rest" && restResumeAction) {
    const remaining = Math.max(0, state.restSeconds - state.restElapsedSeconds - (state.restRunning ? secondsSince(state.restStartedAt!) : 0));
    if (state.restRunning) scheduleTransition(remaining, restResumeAction);
  }
  broadcast();
  return state;
}

export function pauseRest(): WorkoutSessionState | null {
  if (!state || state.phase !== "rest" || !state.restRunning) return state;
  state.restElapsedSeconds += secondsSince(state.restStartedAt!);
  state.restRunning = false;
  state.restStartedAt = null;
  clearPhaseTimer();
  broadcast();
  return state;
}

export function resumeRest(): WorkoutSessionState | null {
  if (!state || state.phase !== "rest" || state.restRunning || !restResumeAction) return state;
  state.restRunning = true;
  state.restStartedAt = new Date().toISOString();
  const remaining = Math.max(0, state.restSeconds - state.restElapsedSeconds);
  scheduleTransition(remaining, restResumeAction);
  broadcast();
  return state;
}

export function resetRest(): WorkoutSessionState | null {
  if (!state || state.phase !== "rest" || !restResumeAction) return state;
  state.restElapsedSeconds = 0;
  if (state.restRunning) {
    state.restStartedAt = new Date().toISOString();
    scheduleTransition(state.restSeconds, restResumeAction);
  }
  broadcast();
  return state;
}

export function skipRest(): WorkoutSessionState | null {
  if (!state || state.phase !== "rest" || !restResumeAction) return state;
  clearPhaseTimer();
  const action = restResumeAction;
  restResumeAction = null;
  action();
  broadcast();
  return state;
}

// Recomputes group order (and the current group's set count) from the DB —
// exercises may have been reordered, merged, or had their set count edited
// live during the session.
export function refreshGroups(): WorkoutSessionState | null {
  if (!state) return null;
  const currentKey = state.groupOrder[state.currentGroupIndex];
  const groups = getExerciseGroupsForDay(state.day);
  state.groupOrder = groups.map((g) => g.key);
  const newIndex = state.groupOrder.indexOf(currentKey);
  if (newIndex >= 0) {
    state.currentGroupIndex = newIndex;
    const group = groups[newIndex];
    state.totalSets = totalSetsFor(group);
    if (state.currentSet > state.totalSets) state.currentSet = state.totalSets;
  }
  broadcast();
  return state;
}

export function cancelSession(): void {
  if (!state) return;
  clearPhaseTimer();
  restResumeAction = null;
  if (state.focusSessionId) {
    try {
      stopFocusSession(state.focusSessionId);
    } catch {
      // already stopped
    }
  }
  state = null;
  broadcast();
}

export function closeSession(): void {
  clearPhaseTimer();
  restResumeAction = null;
  state = null;
  broadcast();
}
