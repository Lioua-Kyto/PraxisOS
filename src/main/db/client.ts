import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'not_urgent_not_important',
  status TEXT NOT NULL DEFAULT 'todo',
  due_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  provider TEXT,
  category TEXT,
  phase INTEGER NOT NULL DEFAULT 1,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  sets INTEGER,
  reps_range TEXT,
  progression TEXT,
  tips TEXT,
  link TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  superset_group TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  video_path TEXT
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  date TEXT NOT NULL DEFAULT (date('now')),
  set_number INTEGER,
  reps INTEGER,
  weight_kg REAL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL DEFAULT (date('now')),
  meal TEXT,
  food TEXT NOT NULL,
  calories REAL NOT NULL DEFAULT 0,
  protein_g REAL NOT NULL DEFAULT 0,
  time TEXT NOT NULL DEFAULT (time('now'))
);

CREATE TABLE IF NOT EXISTS hydration_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL DEFAULT (date('now')),
  amount_ml INTEGER NOT NULL,
  time TEXT NOT NULL DEFAULT (time('now'))
);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  label TEXT,
  date TEXT NOT NULL DEFAULT (date('now')),
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'running',
  accumulated_seconds INTEGER NOT NULL DEFAULT 0,
  last_started_at TEXT
);

CREATE TABLE IF NOT EXISTS budget_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS budget_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  category_id INTEGER REFERENCES budget_categories(id) ON DELETE SET NULL,
  description TEXT,
  date TEXT NOT NULL DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

let sqlite: Database.Database | null = null;
let dbFilePath = "";

export const db = () => {
  if (!sqlite) throw new Error("Database not initialized — call initDb() first");
  return drizzle(sqlite, { schema });
};

export type AppDb = ReturnType<typeof db>;

export function getMediaDir(): string {
  const dir = path.join(path.dirname(dbFilePath), "media");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function initDb(): void {
  const userDataDir = app.getPath("userData");
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });
  dbFilePath = path.join(userDataDir, "praxisos.sqlite3");

  sqlite = new Database(dbFilePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(SCHEMA_SQL);
  migrateLegacyColumns(sqlite);

  seedIfEmpty(db());
}

// Best-effort forward migration for columns added after the initial schema
// shipped, so upgrading users don't need to delete their database.
function migrateLegacyColumns(sqlite: Database.Database): void {
  const workoutCols = sqlite.prepare("PRAGMA table_info(workout_exercises)").all() as Array<{ name: string }>;
  if (!workoutCols.some((c) => c.name === "video_path")) {
    sqlite.exec("ALTER TABLE workout_exercises ADD COLUMN video_path TEXT");
  }
}

export function closeDb(): void {
  sqlite?.close();
  sqlite = null;
}
