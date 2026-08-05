import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  priority: text("priority").notNull().default("not_urgent_not_important"),
  status: text("status").notNull().default("todo"),
  dueDate: text("due_date"),
  /** Stamped when the task first moves to in_progress; cleared on return to todo. */
  startedAt: text("started_at"),
  /** Stamped when the task moves to completed; cleared on return to todo/in_progress. */
  finishedAt: text("finished_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  completedAt: text("completed_at")
});

export const foods = sqliteTable("foods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  /** Meal this food is usually eaten at, or "Any" so it shows for every meal. */
  category: text("category").notNull().default("Any"),
  calories: real("calories").notNull().default(0),
  proteinG: real("protein_g").notNull().default(0),
  carbsG: real("carbs_g").notNull().default(0),
  servingLabel: text("serving_label").notNull().default("1 serving"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`)
});

export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  provider: text("provider"),
  category: text("category"),
  phase: integer("phase").notNull().default(1),
  url: text("url"),
  status: text("status").notNull().default("planned"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`)
});

export const workoutExercises = sqliteTable("workout_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  day: text("day").notNull(),
  name: text("name").notNull(),
  sets: integer("sets"),
  repsRange: text("reps_range"),
  exerciseType: text("exercise_type").notNull().default("reps"),
  durationSeconds: integer("duration_seconds"),
  progression: text("progression"),
  tips: text("tips"),
  orderIndex: integer("order_index").notNull().default(0),
  supersetGroup: text("superset_group"),
  supersetColor: text("superset_color"),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  videoPath: text("video_path")
});

export const workoutLogs = sqliteTable("workout_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => workoutExercises.id, { onDelete: "cascade" }),
  date: text("date").notNull().default(sql`(date('now'))`),
  setNumber: integer("set_number"),
  reps: integer("reps"),
  weightKg: real("weight_kg"),
  notes: text("notes")
});

export const nutritionLogs = sqliteTable("nutrition_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().default(sql`(date('now'))`),
  meal: text("meal"),
  food: text("food").notNull(),
  calories: real("calories").notNull().default(0),
  proteinG: real("protein_g").notNull().default(0),
  carbsG: real("carbs_g").notNull().default(0),
  time: text("time").notNull().default(sql`(time('now'))`)
});

export const hydrationLogs = sqliteTable("hydration_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().default(sql`(date('now'))`),
  amountMl: integer("amount_ml").notNull(),
  time: text("time").notNull().default(sql`(time('now'))`)
});

export const focusSessions = sqliteTable("focus_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull(),
  label: text("label"),
  date: text("date").notNull().default(sql`(date('now'))`),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  durationSeconds: integer("duration_seconds"),
  status: text("status").notNull().default("running"),
  accumulatedSeconds: integer("accumulated_seconds").notNull().default(0),
  lastStartedAt: text("last_started_at")
});

export const budgetCategories = sqliteTable("budget_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull()
});

export const budgetTransactions = sqliteTable("budget_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  categoryId: integer("category_id").references(() => budgetCategories.id, { onDelete: "set null" }),
  description: text("description"),
  date: text("date").notNull().default(sql`(date('now'))`)
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull()
});

export const themePresets = sqliteTable("theme_presets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  baseTheme: text("base_theme").notNull().default("dark"),
  /** Null means "inherit the base theme" — the common case is changing only the accent. */
  background: text("background"),
  accent: text("accent").notNull(),
  foreground: text("foreground"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`)
});

export const habits = sqliteTable("habits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  cadence: text("cadence").notNull().default("daily"),
  /** JSON array of weekday numbers (0=Sun..6=Sat). Used by "weekly" (one day) and "custom" (several). */
  weekdays: text("weekdays"),
  color: text("color").notNull().default("primary"),
  orderIndex: integer("order_index").notNull().default(0),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  /** Set when this habit is auto-managed by the Settings workout schedule. */
  managedBy: text("managed_by"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`)
});

export const habitLogs = sqliteTable("habit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  habitId: integer("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  date: text("date").notNull().default(sql`(date('now'))`),
  completedAt: text("completed_at").notNull().default(sql`(datetime('now'))`)
});

export const journalEntries = sqliteTable("journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(),
  morningIntentions: text("morning_intentions").notNull().default(""),
  eveningReflection: text("evening_reflection").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`)
});

export const brainDumps = sqliteTable("brain_dumps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().default(sql`(date('now'))`),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`)
});

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  tags: text("tags").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`)
});
