import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed";
import { localDateString, localDateTimeString, parseStoredDateTime } from "../../shared/datetime";


let sqlite: Database.Database | null = null;
let dbFilePath = "";

export const db = () => {
  if (!sqlite) throw new Error("Database not initialized — call initDb() first");
  return drizzle(sqlite, { schema });
};

export type AppDb = ReturnType<typeof db>;

/** Raw handle for whole-table operations (backup export/restore) that are
 *  simpler and safer to express in plain SQL than through the query builder. */
export function getRawDb(): Database.Database {
  if (!sqlite) throw new Error("Database not initialized — call initDb() first");
  return sqlite;
}

export function getMediaDir(): string {
  const dir = path.join(path.dirname(dbFilePath), "media");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Where the generated `.sql` migrations live. In dev they sit at the project
 * root; packaged builds get them via electron-builder's extraResources.
 */
function migrationsFolder(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "drizzle")
    : path.join(__dirname, "../../drizzle");
}

/**
 * Applies pending migrations.
 *
 * The pragma dance around `migrate()` is not optional. Drizzle rebuilds a table
 * (create new → copy → drop old → rename) for any change SQLite can't express
 * as an ALTER, and it runs that inside its own transaction. `PRAGMA
 * foreign_keys` is a no-op inside a transaction, so Drizzle cannot turn the
 * constraint off itself — and the `DROP TABLE` step therefore cascades, silently
 * deleting every child row (workout_logs, habit_logs). Toggling it on the raw
 * better-sqlite3 handle, outside any transaction, is the documented workaround.
 */
function runMigrations(handle: Database.Database): void {
  handle.pragma("foreign_keys = OFF");
  try {
    migrate(drizzle(handle), { migrationsFolder: migrationsFolder() });
  } finally {
    // In a finally block on purpose: leaving foreign keys off after a failed
    // migration would let later writes corrupt referential integrity.
    handle.pragma("foreign_keys = ON");
  }
}

export function initDb(): void {
  const userDataDir = app.getPath("userData");
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });
  dbFilePath = path.join(userDataDir, "praxisos.sqlite3");

  sqlite = new Database(dbFilePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // Ad-hoc column additions from before migrations existed. They run first so
  // a database created by an older build reaches the shape the baseline
  // migration describes, which then applies as a no-op. On a fresh file there
  // is nothing to alter, and the tables don't exist yet, so skip entirely.
  if (hasExistingTables(sqlite)) migrateLegacyColumns(sqlite);
  runMigrations(sqlite);

  // After migrations: the triggers reference the notes table.
  ensureNotesFtsIndex(sqlite);

  seedIfEmpty(db());
}

/** True for a database an earlier build already created tables in. */
function hasExistingTables(handle: Database.Database): boolean {
  const row = handle
    .prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type = 'table' AND name = 'tasks'")
    .get() as { c: number };
  return row.c > 0;
}

// Best-effort forward migration for columns added after the initial schema
// shipped, so upgrading users don't need to delete their database.
function migrateLegacyColumns(sqlite: Database.Database): void {
  const workoutCols = sqlite.prepare("PRAGMA table_info(workout_exercises)").all() as Array<{ name: string }>;
  if (!workoutCols.some((c) => c.name === "video_path")) {
    sqlite.exec("ALTER TABLE workout_exercises ADD COLUMN video_path TEXT");
  }
  if (!workoutCols.some((c) => c.name === "image_path")) {
    sqlite.exec("ALTER TABLE workout_exercises ADD COLUMN image_path TEXT");
  }
  if (!workoutCols.some((c) => c.name === "superset_color")) {
    sqlite.exec("ALTER TABLE workout_exercises ADD COLUMN superset_color TEXT");
  }
  if (workoutCols.some((c) => c.name === "link")) {
    sqlite.exec("ALTER TABLE workout_exercises DROP COLUMN link");
  }
  if (!workoutCols.some((c) => c.name === "exercise_type")) {
    sqlite.exec("ALTER TABLE workout_exercises ADD COLUMN exercise_type TEXT NOT NULL DEFAULT 'reps'");
  }
  if (!workoutCols.some((c) => c.name === "duration_seconds")) {
    sqlite.exec("ALTER TABLE workout_exercises ADD COLUMN duration_seconds INTEGER");
  }

  const presetCols = sqlite
    .prepare("PRAGMA table_info(theme_presets)")
    .all() as Array<{ name: string; notnull: number }>;
  if (presetCols.length && !presetCols.some((c) => c.name === "foreground")) {
    sqlite.exec("ALTER TABLE theme_presets ADD COLUMN foreground TEXT");
  }
  // A preset that inherits its base theme's surfaces stores a null background,
  // but installs created before that change still carry NOT NULL on the column.
  // SQLite cannot drop a constraint in place, so rebuild the table.
  if (presetCols.find((c) => c.name === "background")?.notnull) {
    sqlite.exec(`
      CREATE TABLE theme_presets_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        base_theme TEXT NOT NULL DEFAULT 'dark',
        background TEXT,
        accent TEXT NOT NULL,
        foreground TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO theme_presets_new (id, name, base_theme, background, accent, foreground, created_at)
        SELECT id, name, base_theme, background, accent, foreground, created_at FROM theme_presets;
      DROP TABLE theme_presets;
      ALTER TABLE theme_presets_new RENAME TO theme_presets;
    `);
  }

  const habitCols = sqlite.prepare("PRAGMA table_info(habits)").all() as Array<{ name: string }>;
  if (habitCols.length && !habitCols.some((c) => c.name === "weekdays")) {
    sqlite.exec("ALTER TABLE habits ADD COLUMN weekdays TEXT");
  }
  if (habitCols.length && !habitCols.some((c) => c.name === "managed_by")) {
    sqlite.exec("ALTER TABLE habits ADD COLUMN managed_by TEXT");
  }

  const taskCols = sqlite.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
  if (taskCols.length && !taskCols.some((c) => c.name === "started_at")) {
    sqlite.exec("ALTER TABLE tasks ADD COLUMN started_at TEXT");
  }
  if (taskCols.length && !taskCols.some((c) => c.name === "finished_at")) {
    sqlite.exec("ALTER TABLE tasks ADD COLUMN finished_at TEXT");
  }

  for (const table of ["nutrition_logs", "foods"]) {
    const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (cols.length && !cols.some((c) => c.name === "carbs_g")) {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN carbs_g REAL NOT NULL DEFAULT 0`);
    }
  }

  backfillLegacyUtcDatetimes(sqlite);
}

/**
 * Full-text index over notes, kept in sync by triggers so searches stay
 * correct without the app having to remember to reindex. Uses an external-
 * content table (content='notes') so the text isn't stored twice.
 *
 * FTS5 is compiled into the better-sqlite3 build we ship, but this is
 * wrapped defensively: if the extension is ever unavailable the app still
 * starts and search silently falls back to a LIKE scan.
 */
function ensureNotesFtsIndex(sqlite: Database.Database): void {
  try {
    sqlite.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
        title, content, tags, content='notes', content_rowid='id', tokenize='porter unicode61'
      );

      CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes BEGIN
        INSERT INTO notes_fts(rowid, title, content, tags) VALUES (new.id, new.title, new.content, new.tags);
      END;

      CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes BEGIN
        INSERT INTO notes_fts(notes_fts, rowid, title, content, tags)
          VALUES ('delete', old.id, old.title, old.content, old.tags);
      END;

      CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE ON notes BEGIN
        INSERT INTO notes_fts(notes_fts, rowid, title, content, tags)
          VALUES ('delete', old.id, old.title, old.content, old.tags);
        INSERT INTO notes_fts(rowid, title, content, tags) VALUES (new.id, new.title, new.content, new.tags);
      END;
    `);

    // Backfill on first creation (or if the index was emptied).
    const indexed = sqlite.prepare("SELECT COUNT(*) AS c FROM notes_fts").get() as { c: number };
    const total = sqlite.prepare("SELECT COUNT(*) AS c FROM notes").get() as { c: number };
    if (indexed.c === 0 && total.c > 0) {
      sqlite.exec("INSERT INTO notes_fts(notes_fts) VALUES('rebuild')");
    }
    notesFtsAvailable = true;
  } catch {
    notesFtsAvailable = false;
  }
}

let notesFtsAvailable = false;

export function isNotesFtsAvailable(): boolean {
  return notesFtsAvailable;
}

/**
 * Rewrites focus sessions written before the local-time change, which stored
 * UTC ISO strings ("2026-08-04T13:45:00.000Z") and derived `date` from
 * SQLite's UTC date('now'). Both are converted to local wall-clock so old
 * rows group correctly in the daily/weekly rollups instead of landing on the
 * wrong side of midnight.
 *
 * Detection is the "T" separator, which only the legacy format has, so this
 * is idempotent — already-migrated rows are skipped on subsequent launches.
 */
function backfillLegacyUtcDatetimes(sqlite: Database.Database): void {
  const legacy = sqlite
    .prepare("SELECT id, start_time, end_time FROM focus_sessions WHERE start_time LIKE '%T%' OR end_time LIKE '%T%'")
    .all() as Array<{ id: number; start_time: string | null; end_time: string | null }>;
  if (!legacy.length) return;

  const update = sqlite.prepare("UPDATE focus_sessions SET start_time = ?, end_time = ?, date = ? WHERE id = ?");
  const run = sqlite.transaction((rows: typeof legacy) => {
    for (const row of rows) {
      const start = row.start_time ? localDateTimeString(parseStoredDateTime(row.start_time)) : row.start_time;
      const end = row.end_time ? localDateTimeString(parseStoredDateTime(row.end_time)) : row.end_time;
      const date = start ? start.slice(0, 10) : localDateString();
      update.run(start, end, date, row.id);
    }
  });
  run(legacy);
}

export function closeDb(): void {
  sqlite?.close();
  sqlite = null;
}
