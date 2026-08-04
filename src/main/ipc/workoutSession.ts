import { ipcMain } from "electron";
import {
  cancelSession,
  closeSession,
  finishSet,
  getSessionState,
  pauseRest,
  refreshGroups,
  resetRest,
  resumeRest,
  setRestSeconds,
  skipRest,
  startExercise,
  startSession
} from "../workout/workoutSessionEngine";
import { getExerciseGroupsForDay } from "./workoutHelpers";
import type { WorkoutExerciseGroup, WorkoutSessionState } from "../../shared/types";

export function registerWorkoutSessionHandlers(): void {
  ipcMain.handle("workoutSession:start", (_e, day: string): WorkoutSessionState => startSession(day));

  ipcMain.handle("workoutSession:getState", (): WorkoutSessionState | null => getSessionState());

  ipcMain.handle("workoutSession:getGroups", (_e, day: string): WorkoutExerciseGroup[] => getExerciseGroupsForDay(day));

  ipcMain.handle("workoutSession:startExercise", (): WorkoutSessionState => startExercise());

  ipcMain.handle("workoutSession:finishSet", (): WorkoutSessionState => finishSet());

  ipcMain.handle("workoutSession:setRestSeconds", (_e, seconds: number): WorkoutSessionState | null =>
    setRestSeconds(seconds)
  );

  ipcMain.handle("workoutSession:pauseRest", (): WorkoutSessionState | null => pauseRest());
  ipcMain.handle("workoutSession:resumeRest", (): WorkoutSessionState | null => resumeRest());
  ipcMain.handle("workoutSession:resetRest", (): WorkoutSessionState | null => resetRest());
  ipcMain.handle("workoutSession:skipRest", (): WorkoutSessionState | null => skipRest());

  ipcMain.handle("workoutSession:refreshGroups", (): WorkoutSessionState | null => refreshGroups());

  ipcMain.handle("workoutSession:cancel", (): void => cancelSession());

  ipcMain.handle("workoutSession:close", (): void => closeSession());
}
