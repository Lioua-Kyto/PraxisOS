import { ipcMain, shell } from "electron";
import { db } from "../db/client";
import { settings } from "../db/schema";
import { compareVersions, currentVersion, readReleaseNotes } from "../updates";
import type { WhatsNew } from "../../shared/types";

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

  // Opens external links (docs, bug/feedback) in the browser. The old
  // "download the update in a browser" flow is gone — updates install in-app
  // via electron-updater now (see src/main/updater.ts).
  ipcMain.handle("updates:openRelease", (_e, url: string): Promise<void> => shell.openExternal(url));

  /**
   * Patch notes for the version that's actually running, shown once after an
   * update lands.
   *
   * Gated on a real version increase rather than a mismatch: running an older
   * build against a database that has seen a newer one — a rollback, or a
   * restored backup from a machine that was further ahead — must not present
   * that older build's notes as if something had just been installed.
   */
  ipcMain.handle("updates:whatsNew", (): WhatsNew => {
    const version = currentVersion();
    const lastSeen = readLastSeen();

    // A fresh install has nothing to compare against, so it gets a clean first
    // run instead of release notes for software it never had.
    if (!lastSeen) {
      writeLastSeen(version);
      return { version, notes: "", show: false };
    }

    if (compareVersions(version, lastSeen) <= 0) return { version, notes: "", show: false };

    return { version, previousVersion: lastSeen, notes: readReleaseNotes(version), show: true };
  });

  /** Called once the user has dismissed the notes, so they don't reappear. */
  ipcMain.handle("updates:acknowledge", (): void => writeLastSeen(currentVersion()));

  /**
   * The same notes on demand, from Settings. Without this the feature is only
   * observable by actually shipping an update, which makes it impossible to
   * check that the changelog reads well before releasing.
   */
  ipcMain.handle("updates:releaseNotes", (): WhatsNew => {
    const version = currentVersion();
    return { version, notes: readReleaseNotes(version), show: true };
  });
}
