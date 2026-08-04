import { app, dialog, ipcMain, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
import { getRawDb, getMediaDir } from "../db/client";
import { BACKUP_FORMAT_VERSION, type BackupFile, type BackupTableName, type ImportSummary } from "../../shared/types";

// Insert order matters: parents before children so foreign keys resolve.
const TABLES: BackupTableName[] = [
  "settings",
  "theme_presets",
  "courses",
  "tasks",
  "workout_exercises",
  "workout_logs",
  "budget_categories",
  "budget_transactions",
  "nutrition_logs",
  "hydration_logs",
  "focus_sessions",
  "habits",
  "habit_logs",
  "journal_entries",
  "brain_dumps",
  "notes",
  "foods"
];

/** Collects media filenames referenced anywhere, so a restore can flag gaps. */
function collectMediaFilenames(tables: BackupFile["tables"]): string[] {
  const names = new Set<string>();

  for (const row of tables.workout_exercises ?? []) {
    const videoPath = row.video_path;
    if (typeof videoPath === "string" && videoPath) names.add(path.basename(videoPath));
  }
  for (const row of tables.notes ?? []) {
    const content = row.content;
    if (typeof content !== "string") continue;
    for (const match of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
      const decoded = decodeURIComponent(match[1].replace(/^file:\/\//, ""));
      names.add(path.basename(decoded));
    }
  }
  return [...names].sort();
}

export function buildBackup(): BackupFile {
  const sqlite = getRawDb();
  const tables = {} as BackupFile["tables"];
  for (const table of TABLES) {
    tables[table] = sqlite.prepare(`SELECT * FROM ${table}`).all() as Array<Record<string, unknown>>;
  }
  return {
    format: "praxisos-backup",
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: app.getVersion(),
    exportedAt: new Date().toISOString(),
    tables,
    mediaFiles: collectMediaFilenames(tables)
  };
}

function assertValidBackup(data: unknown): asserts data is BackupFile {
  if (!data || typeof data !== "object") throw new Error("That file isn't a PraxisOS backup.");
  const candidate = data as Partial<BackupFile>;
  if (candidate.format !== "praxisos-backup") {
    throw new Error("That file isn't a PraxisOS backup (missing format marker).");
  }
  if (typeof candidate.formatVersion !== "number" || candidate.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new Error(
      `This backup was made by a newer version of PraxisOS (format ${candidate.formatVersion}). Update the app to restore it.`
    );
  }
  if (!candidate.tables || typeof candidate.tables !== "object") throw new Error("Backup file has no table data.");
}

/**
 * Media paths are absolute and machine-specific, so a backup restored on
 * another machine (or another user account) would point at nothing. Any file
 * that exists in this install's media dir is repointed at the local path.
 */
function remapMediaPath(value: string, mediaDir: string): string {
  const basename = path.basename(decodeURIComponent(value.replace(/^file:\/\//, "")));
  const localPath = path.join(mediaDir, basename);
  if (!fs.existsSync(localPath)) return value;
  return value.startsWith("file://") ? `file://${localPath.replace(/\\/g, "/")}` : localPath;
}

export function restoreBackup(backup: BackupFile): ImportSummary {
  assertValidBackup(backup);
  const sqlite = getRawDb();
  const mediaDir = getMediaDir();
  const restored: Record<string, number> = {};

  const run = sqlite.transaction(() => {
    // Children first on the way out, so deletes don't trip foreign keys.
    for (const table of [...TABLES].reverse()) sqlite.prepare(`DELETE FROM ${table}`).run();

    for (const table of TABLES) {
      const rows = backup.tables[table] ?? [];
      restored[table] = rows.length;
      if (!rows.length) continue;

      // Only restore columns this build actually has, so a backup from a
      // slightly different version imports instead of hard-failing.
      const liveColumns = new Set(
        (sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((c) => c.name)
      );

      for (const row of rows) {
        const columns = Object.keys(row).filter((c) => liveColumns.has(c));
        if (!columns.length) continue;

        const values = columns.map((c) => {
          const value = row[c];
          if (typeof value === "string" && (c === "video_path" || c === "content")) {
            return c === "video_path" ? remapMediaPath(value, mediaDir) : remapNoteImages(value, mediaDir);
          }
          return value === undefined ? null : (value as string | number | null);
        });

        sqlite
          .prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`)
          .run(...values);
      }
    }
  });

  run();

  const missingMedia = (backup.mediaFiles ?? []).filter((name) => !fs.existsSync(path.join(mediaDir, name)));
  return { restored, totalRows: Object.values(restored).reduce((a, b) => a + b, 0), missingMedia };
}

function remapNoteImages(content: string, mediaDir: string): string {
  return content.replace(/(!\[[^\]]*\]\()([^)]+)(\))/g, (_full, open: string, src: string, close: string) =>
    `${open}${remapMediaPath(src, mediaDir)}${close}`
  );
}

export function registerBackupHandlers(): void {
  ipcMain.handle("backup:export", async (event): Promise<string | null> => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const defaultPath = `praxisos-backup-${new Date().toISOString().slice(0, 10)}.praxisos.json`;
    const options: Electron.SaveDialogOptions = {
      title: "Export PraxisOS backup",
      defaultPath,
      filters: [{ name: "PraxisOS backup", extensions: ["json"] }]
    };
    const result = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options);
    if (result.canceled || !result.filePath) return null;

    fs.writeFileSync(result.filePath, JSON.stringify(buildBackup(), null, 2), "utf8");
    return result.filePath;
  });

  ipcMain.handle("backup:import", async (event): Promise<ImportSummary | null> => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const options: Electron.OpenDialogOptions = {
      title: "Restore PraxisOS backup",
      properties: ["openFile"],
      filters: [{ name: "PraxisOS backup", extensions: ["json"] }]
    };
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    if (result.canceled || !result.filePaths.length) return null;

    const parsed = JSON.parse(fs.readFileSync(result.filePaths[0], "utf8"));
    return restoreBackup(parsed);
  });
}
