import { ipcMain } from "electron";
import { buildBackup } from "./backup";
import type { BackupFile } from "../../shared/types";

export function registerSystemHandlers(): void {
  // Kept so the renderer can preview/inspect a backup payload without going
  // through the save dialog; the on-disk format is identical.
  ipcMain.handle("system:exportAll", (): BackupFile => buildBackup());
}
