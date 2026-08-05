import { ipcMain, shell } from "electron";
import { db } from "../db/client";
import { settings } from "../db/schema";
import { checkForUpdate, currentVersion, readReleaseNotes } from "../updates";
import type { UpdateCheck, WhatsNew } from "../../shared/types";

const LAST_SEEN_KEY = "lastSeenVersion";

function readLastSeen(): string {
  const row = db().select().from(settings).all().find((r) => r.key === LAST_SEEN_KEY);
  return row?.value ?? "";
}

function writeLastSeen(version: string): void {
  db()
    .insert(settings)
    .values({ key: LAST_SEEN_KEY, value: version })
    .onConflictDoUpdate({ target: settings.key, set: { value: version } })
    .run();
}

export function registerUpdateHandlers(): void {
  ipcMain.handle("updates:version", (): string => currentVersion());

  ipcMain.handle("updates:check", (): Promise<UpdateCheck> => checkForUpdate());

  ipcMain.handle("updates:openRelease", (_e, url: string): Promise<void> => shell.openExternal(url));

  /**
   * Patch notes for the version that's actually running, shown once after an
   * update lands. A fresh install has no previously-seen version, so it gets a
   * clean first run rather than release notes for software it never had.
   */
  ipcMain.handle("updates:whatsNew", (): WhatsNew => {
    const version = currentVersion();
    const lastSeen = readLastSeen();

    if (!lastSeen) {
      writeLastSeen(version);
      return { version, notes: "", show: false };
    }
    if (lastSeen === version) return { version, notes: "", show: false };

    const notes = readReleaseNotes(version);
    return { version, previousVersion: lastSeen, notes, show: true };
  });

  /** Called once the user has dismissed the notes, so they don't reappear. */
  ipcMain.handle("updates:acknowledge", (): void => writeLastSeen(currentVersion()));
}
