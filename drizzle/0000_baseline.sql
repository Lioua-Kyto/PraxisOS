-- Baseline. Hand-edited to CREATE ... IF NOT EXISTS so it is a no-op on
-- databases that predate migrations and already carry these tables.
-- Regenerated migrations after this one are used as drizzle-kit writes them.
CREATE TABLE IF NOT EXISTS `brain_dumps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text DEFAULT (date('now')) NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `budget_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `budget_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`category_id` integer,
	`description` text,
	`date` text DEFAULT (date('now')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `budget_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`provider` text,
	`category` text,
	`phase` integer DEFAULT 1 NOT NULL,
	`url` text,
	`status` text DEFAULT 'planned' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `focus_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`label` text,
	`date` text DEFAULT (date('now')) NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text,
	`duration_seconds` integer,
	`status` text DEFAULT 'running' NOT NULL,
	`accumulated_seconds` integer DEFAULT 0 NOT NULL,
	`last_started_at` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'Any' NOT NULL,
	`calories` real DEFAULT 0 NOT NULL,
	`protein_g` real DEFAULT 0 NOT NULL,
	`carbs_g` real DEFAULT 0 NOT NULL,
	`serving_label` text DEFAULT '1 serving' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `habit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`habit_id` integer NOT NULL,
	`date` text DEFAULT (date('now')) NOT NULL,
	`completed_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `habits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`cadence` text DEFAULT 'daily' NOT NULL,
	`weekdays` text,
	`color` text DEFAULT 'primary' NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`managed_by` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `hydration_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text DEFAULT (date('now')) NOT NULL,
	`amount_ml` integer NOT NULL,
	`time` text DEFAULT (time('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `journal_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`morning_intentions` text DEFAULT '' NOT NULL,
	`evening_reflection` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `journal_entries_date_unique` ON `journal_entries` (`date`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `nutrition_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text DEFAULT (date('now')) NOT NULL,
	`meal` text,
	`food` text NOT NULL,
	`calories` real DEFAULT 0 NOT NULL,
	`protein_g` real DEFAULT 0 NOT NULL,
	`carbs_g` real DEFAULT 0 NOT NULL,
	`time` text DEFAULT (time('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text` text NOT NULL,
	`priority` text DEFAULT 'not_urgent_not_important' NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`due_date` text,
	`started_at` text,
	`finished_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `theme_presets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`base_theme` text DEFAULT 'dark' NOT NULL,
	`background` text,
	`accent` text NOT NULL,
	`foreground` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workout_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day` text NOT NULL,
	`name` text NOT NULL,
	`sets` integer,
	`reps_range` text,
	`exercise_type` text DEFAULT 'reps' NOT NULL,
	`duration_seconds` integer,
	`progression` text,
	`tips` text,
	`order_index` integer DEFAULT 0 NOT NULL,
	`superset_group` text,
	`superset_color` text,
	`archived` integer DEFAULT false NOT NULL,
	`video_path` text,
	`image_path` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workout_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exercise_id` integer NOT NULL,
	`date` text DEFAULT (date('now')) NOT NULL,
	`set_number` integer,
	`reps` integer,
	`weight_kg` real,
	`notes` text,
	FOREIGN KEY (`exercise_id`) REFERENCES `workout_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
