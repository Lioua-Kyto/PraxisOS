import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  priority: text("priority").notNull().default("not_urgent_not_important"),
  status: text("status").notNull().default("todo"),
  dueDate: text("due_date"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  completedAt: text("completed_at")
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
  progression: text("progression"),
  tips: text("tips"),
  link: text("link"),
  orderIndex: integer("order_index").notNull().default(0),
  supersetGroup: text("superset_group"),
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
