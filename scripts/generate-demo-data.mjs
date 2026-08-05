// Builds demo/praxisos-demo-backup.json — a full, plausible dataset for
// screenshots and demos.
//
// Generated rather than hand-written so every date is relative to the day it's
// produced: a fixture with hardcoded dates shows an empty dashboard a month
// later, which is exactly when you want to take screenshots.
//
//   node scripts/generate-demo-data.mjs
//
// Restore the result through Settings > Restore from backup. It REPLACES all
// data, so export your own first.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "demo", "praxisos-demo-backup.json");

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const pad = (n) => String(n).padStart(2, "0");
const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayOffset = (days) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d;
};
const day = (offset) => dateStr(dayOffset(offset));
const at = (offset, clock) => `${day(offset)} ${clock}:00`;
const stamp = (offset, clock = "09:00") => at(offset, clock);

/** Deterministic PRNG so regenerating gives the same shape, not new noise. */
let seed = 20260805;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

let nextId = 0;
const id = () => ++nextId;

// ---------------------------------------------------------------- settings

const settings = [
  ["theme", "dark"],
  ["font", "sans"],
  ["waterGoalMl", "3000"],
  ["calorieGoal", "2600"],
  ["proteinGoal", "170"],
  ["carbsGoal", "290"],
  ["dailyBudgetLimit", "45"],
  ["currencySymbol", "€"],
  ["defaultRestSeconds", "75"],
  ["defaultFocusCategory", "deep_work"],
  ["weekStartsOn", "1"],
  ["confirmBeforeEndingWorkout", "true"],
  ["habitRemindersEnabled", "true"],
  ["habitReminderTime", "20:30"],
  ["workoutDays", JSON.stringify(["Push", "Pull", "Legs"])],
  ["workoutSchedule", JSON.stringify({ 1: "Push", 3: "Pull", 5: "Legs" })],
  ["lastSeenVersion", "0.1.0"]
].map(([key, value]) => ({ key, value }));

// ------------------------------------------------------------ theme presets

const theme_presets = [
  {
    id: id(),
    name: "Light Amber",
    base_theme: "light",
    background: null,
    accent: "#d98324",
    foreground: null,
    created_at: stamp(-21, "10:12")
  },
  {
    id: id(),
    name: "Deep Teal",
    base_theme: "midnight",
    background: "#0a1418",
    accent: "#2fb8a6",
    foreground: null,
    created_at: stamp(-9, "22:04")
  }
];

// ------------------------------------------------------------------- tasks

const TASK_SEED = [
  ["Ship the release build to GitHub", "urgent_important", "in_progress", 1],
  ["Write the migration for exercise photos", "urgent_important", "completed", -1],
  ["Review AWS specialization module 3", "not_urgent_important", "todo", 4],
  ["Draft Q3 budget rework", "not_urgent_important", "in_progress", 6],
  ["Reply to the recruiter thread", "urgent_not_important", "todo", 0],
  ["Renew the domain", "urgent_not_important", "completed", -3],
  ["Sort out the desk cable mess", "not_urgent_not_important", "todo", null],
  ["Back up the photo archive", "not_urgent_important", "todo", 12],
  ["Finish the Algorithms week 2 problem set", "not_urgent_important", "completed", -2],
  ["Book the dentist", "urgent_not_important", "todo", 2],
  ["Refactor the focus timer elapsed logic", "not_urgent_important", "completed", -5],
  ["Plan next month's training block", "not_urgent_important", "in_progress", 8]
];

const tasks = TASK_SEED.map(([text, priority, status, due], i) => {
  const created = stamp(-14 + i, "08:30");
  const started = status === "todo" ? null : stamp(-10 + i, "09:15");
  const finished = status === "completed" ? stamp(-8 + i, "16:40") : null;
  return {
    id: id(),
    text,
    priority,
    status,
    due_date: due === null ? null : day(due),
    started_at: started,
    finished_at: finished,
    created_at: created,
    completed_at: finished
  };
});

// ----------------------------------------------------------------- courses

const courses = [
  ["AWS Cloud Technical Essentials", "AWS / Coursera", "Cloud & DevOps", 1, "completed"],
  ["AWS Cloud Engineering, Architecture & DevOps", "AWS / Coursera", "Cloud & DevOps", 1, "in_progress"],
  ["IBM DevOps and Software Engineering", "IBM / Coursera", "Cloud & DevOps", 1, "planned"],
  ["Algorithms Specialization", "Stanford / Coursera", "System Design & DSA", 2, "in_progress"],
  ["Software Design and Architecture", "UAlberta / Coursera", "System Design & DSA", 2, "planned"],
  ["Meta Front-End Developer", "Meta / Coursera", "Frontend Depth", 3, "completed"],
  ["Software Testing and Automation", "Coursera", "Frontend Depth", 3, "planned"],
  ["IBM Full Stack Software Developer", "IBM / Coursera", "Full Software Engineering", 4, "planned"],
  ["IBM AI Engineering", "IBM / Coursera", "AI Engineering", 5, "planned"]
].map(([title, provider, category, phase, status], i) => ({
  id: id(),
  title,
  provider,
  category,
  phase,
  url: null,
  status,
  notes: "",
  created_at: stamp(-60 + i * 3, "11:00")
}));

// ---------------------------------------------------------------- workouts

const EXERCISES = [
  ["Push", "Dips (Wall-Mount Machine)", 4, "8–12", "reps", null, "ss-push-a"],
  ["Push", "Push-ups", 3, "12–20", "reps", null, "ss-push-a"],
  ["Push", "30kg Bag Floor Press", 4, "10–15", "reps", null, null],
  ["Push", "Pike Push-ups", 3, "8–12", "reps", null, null],
  ["Push", "Hollow Body Hold", 3, null, "time", 45, null],
  ["Pull", "Wide Grip Pull-ups", 4, "6–10", "reps", null, null],
  ["Pull", "30kg Bag Bent-Over Rows", 4, "8–15", "reps", null, null],
  ["Pull", "Chin-ups", 3, "6–10", "reps", null, null],
  ["Pull", "Towel Inverted Rows", 3, "10–15", "reps", null, null],
  ["Pull", "Dead Hang", 3, null, "time", 40, null],
  ["Legs", "30kg Bear Hug Squats", 4, "10–20", "reps", null, null],
  ["Legs", "Romanian Deadlifts", 4, "10–15", "reps", null, null],
  ["Legs", "Bulgarian Split Squats", 3, "8–15", "reps", null, null],
  ["Legs", "Wall Sit", 3, null, "time", 60, null],
  ["Legs", "Calf Raises", 3, "15–25", "reps", null, null]
];

const SUPERSET_COLOR = "hsl(var(--primary))";

const workout_exercises = EXERCISES.map(
  ([dayName, name, sets, reps, type, duration, group], i) => ({
    id: id(),
    day: dayName,
    name,
    sets,
    reps_range: reps ?? "",
    exercise_type: type,
    duration_seconds: duration,
    progression: type === "time" ? "Add 5 seconds once the last set feels controlled." : "Add reps, then load.",
    tips: "Brace the core. Control the lowering phase.",
    order_index: i,
    superset_group: group,
    superset_color: group ? SUPERSET_COLOR : null,
    archived: 0,
    video_path: null,
    image_path: null
  })
);

// Six weeks of logged sets on the scheduled days, trending upward.
const workout_logs = [];
for (let back = 42; back >= 0; back--) {
  const date = dayOffset(-back);
  const weekday = date.getDay();
  const dayName = weekday === 1 ? "Push" : weekday === 3 ? "Pull" : weekday === 5 ? "Legs" : null;
  if (!dayName) continue;

  const progress = (42 - back) / 42;
  for (const ex of workout_exercises.filter((e) => e.day === dayName)) {
    for (let setNumber = 1; setNumber <= (ex.sets ?? 3); setNumber++) {
      workout_logs.push({
        id: id(),
        exercise_id: ex.id,
        date: dateStr(date),
        set_number: setNumber,
        reps: ex.exercise_type === "time" ? null : between(8, 12) + Math.round(progress * 4),
        weight_kg: ex.name.includes("30kg") ? 30 : ex.name.includes("Dips") ? Math.round(progress * 10) : null,
        notes: ""
      });
    }
  }
}

// --------------------------------------------------------------- nutrition

const MEALS = [
  ["Breakfast", "Oats with whey and banana", 520, 38, 72, "08:10"],
  ["Lunch", "Grilled chicken, rice, salad", 720, 52, 78, "13:05"],
  ["Snack", "Greek yogurt and almonds", 310, 24, 18, "16:40"],
  ["Dinner", "Salmon fillet with potatoes", 690, 44, 55, "20:15"],
  ["Snack", "Cottage cheese", 180, 22, 6, "22:00"]
];

const nutrition_logs = [];
const hydration_logs = [];
for (let back = 27; back >= 0; back--) {
  const date = day(-back);
  for (const [meal, food, kcal, protein, carbs, time] of MEALS) {
    // Skip the odd snack so the day-to-day totals aren't suspiciously identical.
    if (meal === "Snack" && rand() < 0.3) continue;
    nutrition_logs.push({
      id: id(),
      date,
      meal,
      food,
      calories: kcal + between(-60, 60),
      protein_g: protein + between(-5, 5),
      carbs_g: carbs + between(-8, 8),
      time: `${time}:00`
    });
  }
  for (const [time, ml] of [["08:00", 500], ["11:30", 500], ["14:00", 750], ["17:30", 500], ["21:00", 500]]) {
    if (rand() < 0.15) continue;
    hydration_logs.push({ id: id(), date, amount_ml: ml, time: `${time}:00` });
  }
}

// ------------------------------------------------------------ focus timer

const FOCUS_PLAN = [
  ["deep_work", "Migration work", "09:00", "11:30"],
  ["learning", "Algorithms lectures", "12:00", "13:00"],
  ["deep_work", "Feature build", "14:00", "16:15"],
  ["reading", "Architecture papers", "17:00", "17:45"],
  ["training", "Session", "18:30", "19:35"],
  ["writing", "Release notes", "20:00", "20:40"],
  ["entertainment", "Series", "21:30", "22:45"],
  ["planning", "Weekly review", "08:15", "08:55"],
  ["admin", "Inbox and invoices", "16:30", "17:00"],
  ["side_project", "Portfolio site", "21:00", "22:30"]
];

const clockToSeconds = (clock) => {
  const [h, m] = clock.split(":").map(Number);
  return h * 3600 + m * 60;
};

const focus_sessions = [];
for (let back = 20; back >= 0; back--) {
  const count = back === 0 ? 4 : between(2, 5);
  const chosen = [...FOCUS_PLAN].sort(() => rand() - 0.5).slice(0, count);
  for (const [category, label, start, end] of chosen) {
    const duration = clockToSeconds(end) - clockToSeconds(start);
    focus_sessions.push({
      id: id(),
      category,
      label,
      date: day(-back),
      start_time: at(-back, start),
      end_time: at(-back, end),
      duration_seconds: duration,
      status: "completed",
      accumulated_seconds: duration,
      last_started_at: null
    });
  }
}

// ------------------------------------------------------------------ budget

const BUDGET_CATEGORIES = [
  ["Salary", "income"],
  ["Freelance", "income"],
  ["Groceries", "expense"],
  ["Rent", "expense"],
  ["Utilities", "expense"],
  ["Transport", "expense"],
  ["Dining Out", "expense"],
  ["Coffee", "expense"],
  ["Subscriptions", "expense"],
  ["Fitness", "expense"],
  ["Education", "expense"],
  ["Entertainment", "expense"],
  ["Other Expense", "expense"],
  ["Savings", "transfer"],
  ["Credit Card", "debt"]
];

const budget_categories = BUDGET_CATEGORIES.map(([name, type]) => ({ id: id(), name, type }));
const categoryId = (name) => budget_categories.find((c) => c.name === name).id;

const SPEND = [
  ["Groceries", 18, 62, "Weekly shop"],
  ["Coffee", 2.4, 4.8, "Flat white"],
  ["Transport", 2, 14, "Metro"],
  ["Dining Out", 12, 38, "Dinner out"],
  ["Entertainment", 8, 25, "Cinema"],
  ["Fitness", 9, 9, "Climbing session"]
];

const budget_transactions = [];
for (let back = 44; back >= 0; back--) {
  const date = day(-back);
  const d = dayOffset(-back);

  if (d.getDate() === 1) {
    budget_transactions.push(
      { id: id(), type: "income", amount: 2850, category_id: categoryId("Salary"), description: "Monthly salary", date },
      { id: id(), type: "expense", amount: 780, category_id: categoryId("Rent"), description: "Rent", date },
      { id: id(), type: "transfer", amount: 400, category_id: categoryId("Savings"), description: "To savings", date },
      { id: id(), type: "expense", amount: 42.9, category_id: categoryId("Subscriptions"), description: "Subscriptions", date }
    );
  }
  if (d.getDate() === 12) {
    budget_transactions.push({
      id: id(),
      type: "income",
      amount: between(300, 900),
      category_id: categoryId("Freelance"),
      description: "Freelance invoice",
      date
    });
  }

  for (let i = 0; i < between(1, 3); i++) {
    const [name, lo, hi, description] = pick(SPEND);
    budget_transactions.push({
      id: id(),
      type: "expense",
      amount: Number((lo + rand() * (hi - lo)).toFixed(2)),
      category_id: categoryId(name),
      description,
      date
    });
  }
}

// ------------------------------------------------------------------ habits

const HABITS = [
  ["Workout", "custom", [1, 3, 5], "primary", "workout-schedule", 0.86],
  ["Read 20 pages", "daily", [], "success", null, 0.78],
  ["No screens after 22:30", "daily", [], "warning", null, 0.55],
  ["Deep work block", "custom", [1, 2, 3, 4, 5], "destructive", null, 0.82],
  ["Weekly review", "weekly", [0], "secondary", null, 0.9],
  ["Stretch", "daily", [], "success", null, 0.64]
];

const habits = HABITS.map(([name, cadence, weekdays, color, managedBy], i) => ({
  id: id(),
  name,
  cadence,
  weekdays: JSON.stringify(weekdays),
  color,
  order_index: i,
  archived: 0,
  managed_by: managedBy,
  created_at: stamp(-70, "07:00")
}));

const habit_logs = [];
habits.forEach((habit, index) => {
  const rate = HABITS[index][5];
  const weekdays = JSON.parse(habit.weekdays);
  for (let back = 55; back >= 0; back--) {
    const d = dayOffset(-back);
    const scheduled = habit.cadence === "daily" || !weekdays.length || weekdays.includes(d.getDay());
    // A handful of off-schedule check-ins: training taken outside still counts.
    const bonus = !scheduled && habit.name === "Workout" && rand() < 0.08;
    if (!scheduled && !bonus) continue;
    if (!bonus && rand() > rate) continue;
    habit_logs.push({
      id: id(),
      habit_id: habit.id,
      date: dateStr(d),
      completed_at: `${dateStr(d)} ${pad(between(7, 21))}:${pad(between(0, 59))}:00`
    });
  }
});

// ----------------------------------------------------------------- journal

const MORNINGS = [
  "Finish the migration path and get the release build out. One thing at a time.",
  "Two deep work blocks before noon. No inbox until the first one is done.",
  "Training day. Push session, then the architecture reading I keep deferring.",
  "Light day on purpose — plan next month's block and tidy the backlog.",
  "Ship the changelog, then start on the analytics panel."
];

const EVENINGS = [
  "Got the migration working. The foreign-key pragma was the whole problem — good to have it written down.",
  "Two solid blocks, then the afternoon fell apart on admin. Worth defending the calendar better.",
  "Strong session, added reps across the board. Read half the paper.",
  "Slower day than planned but the backlog is honest now, which was the point.",
  "Shipped. Rough edges left, but it's out and that matters more than polish right now."
];

const journal_entries = [];
for (let back = 13; back >= 0; back--) {
  if (rand() < 0.2) continue;
  journal_entries.push({
    id: id(),
    date: day(-back),
    morning_intentions: `<p>${pick(MORNINGS)}</p>`,
    evening_reflection: back === 0 ? "" : `<p>${pick(EVENINGS)}</p>`,
    updated_at: stamp(-back, "22:10")
  });
}

const brain_dumps = [
  "Check whether the widget should remember its position between launches",
  "Superset colours could follow the theme accent instead of a fixed palette",
  "Idea: weekly email-style summary, rendered locally, never sent",
  "Ask about keyboard shortcuts for clock in/out",
  "The nutrition search should probably fuzzy-match"
].map((content, i) => ({
  id: id(),
  date: day(-i),
  content,
  created_at: stamp(-i, "19:20")
}));

// ------------------------------------------------------------------- notes

const notes = [
  {
    title: "Electron media loading",
    tags: "electron,debugging",
    content:
      "<h2>The black video player</h2><p>Chromium refuses <code>file://</code> subresources from an <code>http://</code> document. The dev renderer is served over http://localhost, so attached videos rendered as a black player with dead controls.</p><p>Fix: a custom <strong>praxis-media://</strong> scheme registered as <em>standard</em>, <em>secure</em> and <em>stream</em>, so range requests work for seeking.</p>"
  },
  {
    title: "SQLite migration traps",
    tags: "sqlite,drizzle",
    content:
      "<h2>Foreign keys during migrations</h2><p>Drizzle rebuilds tables inside its own transaction. <code>PRAGMA foreign_keys</code> is a <mark>no-op inside a transaction</mark>, so the DROP step cascades and wipes child rows.</p><ul><li><p>Toggle the pragma on the raw handle, outside any transaction</p></li><li><p>Restore it in a <code>finally</code></p></li><li><p>SQLite cannot drop a NOT NULL constraint — rebuild the table</p></li></ul>"
  },
  {
    title: "Training block — next 6 weeks",
    tags: "training,planning",
    content:
      "<h2>Structure</h2><p>Push/Pull/Legs, Monday–Wednesday–Friday. Progress reps first, then load.</p><ol><li><p>Weeks 1–2: rebuild volume, leave two reps in reserve</p></li><li><p>Weeks 3–4: push to near failure on the last set</p></li><li><p>Weeks 5–6: add load, drop the rep range</p></li></ol><blockquote><p>Deload the week after, regardless of how it feels.</p></blockquote>"
  },
  {
    title: "Reading list",
    tags: "reading",
    content:
      "<ul><li><p>Designing Data-Intensive Applications — chapters 5–7</p></li><li><p>A Philosophy of Software Design</p></li><li><p>The Rust Book, for the parts that map onto TypeScript generics</p></li></ul>"
  },
  {
    title: "Budget rework",
    tags: "budget,planning",
    content:
      "<p>Categories are close to right, but <span style=\"color:#d98324\">Dining Out</span> and Coffee should probably merge into one discretionary line — separately they're too small to act on.</p><p>Target: keep discretionary under €250/month.</p>"
  }
];

const notesRows = notes.map((note, i) => ({
  id: id(),
  title: note.title,
  content: note.content,
  tags: note.tags,
  created_at: stamp(-20 + i * 3, "15:30"),
  updated_at: stamp(-4 + i, "18:45")
}));

// ------------------------------------------------------------------- foods

const FOODS = [
  ["Grilled Chicken Breast", "Lunch", 165, 31, 0, "100 g"],
  ["Salmon Fillet", "Dinner", 230, 25, 0, "100 g"],
  ["Beef Steak", "Dinner", 270, 26, 0, "100 g"],
  ["Whole Eggs", "Breakfast", 155, 13, 1.1, "2 eggs"],
  ["Greek Yogurt", "Snack", 120, 17, 6, "170 g"],
  ["Cottage Cheese", "Snack", 98, 11, 3.4, "100 g"],
  ["Whey Protein", "Any", 120, 24, 3, "1 scoop"],
  ["Rolled Oats", "Breakfast", 190, 7, 33, "50 g"],
  ["White Rice", "Any", 205, 4.3, 45, "1 cup cooked"],
  ["Brown Rice", "Any", 216, 5, 45, "1 cup cooked"],
  ["Sweet Potato", "Any", 112, 2, 26, "1 medium"],
  ["Potatoes", "Any", 161, 4.3, 37, "1 medium"],
  ["Whole Wheat Bread", "Breakfast", 82, 4, 14, "1 slice"],
  ["Pasta", "Any", 221, 8, 43, "1 cup cooked"],
  ["Banana", "Snack", 105, 1.3, 27, "1 medium"],
  ["Apple", "Snack", 95, 0.5, 25, "1 medium"],
  ["Blueberries", "Snack", 85, 1.1, 21, "1 cup"],
  ["Almonds", "Snack", 164, 6, 6, "28 g"],
  ["Peanut Butter", "Any", 190, 8, 6, "2 tbsp"],
  ["Olive Oil", "Any", 120, 0, 0, "1 tbsp"],
  ["Avocado", "Any", 234, 2.9, 12, "1 medium"],
  ["Broccoli", "Any", 55, 3.7, 11, "1 cup"],
  ["Spinach", "Any", 23, 2.9, 3.6, "100 g"],
  ["Mixed Salad", "Any", 45, 2, 8, "1 bowl"],
  ["Lentils", "Any", 230, 18, 40, "1 cup cooked"],
  ["Chickpeas", "Any", 269, 15, 45, "1 cup cooked"],
  ["Tuna (canned)", "Lunch", 116, 26, 0, "1 can"],
  ["Turkey Breast", "Lunch", 135, 30, 0, "100 g"],
  ["Milk", "Any", 103, 8, 12, "1 cup"],
  ["Cheddar Cheese", "Any", 113, 7, 0.4, "28 g"],
  ["Dark Chocolate", "Snack", 170, 2, 13, "30 g"],
  ["Protein Bar", "Snack", 210, 20, 22, "1 bar"],
  ["Orange Juice", "Breakfast", 112, 1.7, 26, "1 cup"],
  ["Honey", "Any", 64, 0.1, 17, "1 tbsp"]
];

const foods = FOODS.map(([name, category, calories, protein, carbs, serving], i) => ({
  id: id(),
  name,
  category,
  calories,
  protein_g: protein,
  carbs_g: carbs,
  serving_label: serving,
  created_at: stamp(-90 + i, "12:00")
}));

// ------------------------------------------------------------------ output

const backup = {
  format: "praxisos-backup",
  formatVersion: 2,
  appVersion: "0.1.0",
  exportedAt: new Date().toISOString(),
  tables: {
    settings,
    theme_presets,
    courses,
    tasks,
    workout_exercises,
    workout_logs,
    budget_categories,
    budget_transactions,
    nutrition_logs,
    hydration_logs,
    focus_sessions,
    habits,
    habit_logs,
    journal_entries,
    brain_dumps,
    notes: notesRows,
    foods
  },
  mediaFiles: []
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(backup, null, 2), "utf8");

const counts = Object.entries(backup.tables)
  .map(([table, rows]) => `${table}=${rows.length}`)
  .join(" ");
console.log(`Wrote ${path.relative(ROOT, OUT)}`);
console.log(counts);
console.log(`Total rows: ${Object.values(backup.tables).reduce((a, r) => a + r.length, 0)}`);
