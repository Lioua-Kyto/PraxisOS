const path = require("path");
const fs = require("fs");
const initSqlJs = require("sql.js");
const { app } = require("electron");

let db = null;
let dbFilePath = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  importance TEXT NOT NULL DEFAULT 'not_urgent_not_important',
  done INTEGER NOT NULL DEFAULT 0,
  due_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  provider TEXT,
  category TEXT,
  phase INTEGER DEFAULT 1,
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
  order_index INTEGER DEFAULT 0,
  superset_group TEXT,
  archived INTEGER NOT NULL DEFAULT 0
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
  food TEXT,
  calories REAL NOT NULL DEFAULT 0,
  protein_g REAL,
  time TEXT
);

CREATE TABLE IF NOT EXISTS water_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL DEFAULT (date('now')),
  amount_ml INTEGER NOT NULL,
  time TEXT NOT NULL DEFAULT (time('now'))
);

CREATE TABLE IF NOT EXISTS time_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  label TEXT,
  date TEXT NOT NULL DEFAULT (date('now')),
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_seconds INTEGER
);

CREATE TABLE IF NOT EXISTS budget_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT,
  description TEXT,
  date TEXT NOT NULL DEFAULT (date('now')),
  debt_status TEXT
);
`;

function persist() {
  const data = db.export();
  fs.writeFileSync(dbFilePath, Buffer.from(data));
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  const changes = db.getRowsModified();
  let lastInsertRowid = null;
  if (/^\s*insert/i.test(sql)) {
    const r = all("SELECT last_insert_rowid() AS id");
    lastInsertRowid = r[0] ? r[0].id : null;
  }
  persist();
  return { changes, lastInsertRowid };
}

function migrateSchema() {
  const cols = all("PRAGMA table_info(workout_exercises)").map((c) => c.name);
  if (!cols.includes("video_path")) {
    db.run("ALTER TABLE workout_exercises ADD COLUMN video_path TEXT");
  }
}

function seedCourses() {
  const seed = [
      ["AWS Cloud Technical Essentials", "AWS / Coursera", "Cloud & DevOps", 1, "https://www.coursera.org/learn/aws-cloud-technical-essentials", "planned", "Start here before the specialization below — core AWS services, IAM, VPC, compute, storage."],
      ["AWS Cloud Engineering, Architecture & DevOps Specialization", "AWS / Coursera", "Cloud & DevOps", 1, "https://www.coursera.org/specializations/aws-cloud-engineering-architecture-devops-specialization", "planned", "~20 weeks. Direct answer to 'no cloud cert' gap on your resume — architecture, IaC, CI/CD automation on AWS."],
      ["IBM DevOps and Software Engineering Professional Certificate", "IBM / Coursera", "Cloud & DevOps", 1, "https://www.coursera.org/professional-certificates/devops-and-software-engineering", "planned", "Containers, Kubernetes, CI/CD, Agile/Scrum — pairs with your existing Docker/Nginx experience."],
      ["Foundations of Data Structures and Algorithms Specialization", "CU Boulder / Coursera", "System Design & DSA", 2, "https://www.coursera.org/specializations/boulder-data-structures-algorithms", "planned", "MasterTrack: counts as credit toward CU Boulder's MS-DS if you ever want to ladder into a real Master's."],
      ["Algorithms Specialization", "Stanford / Coursera", "System Design & DSA", 2, "https://www.coursera.org/specializations/algorithms", "planned", "Gold-standard interview prep for US/EU technical interviews — Sedgewick/Roughgarden-style rigor."],
      ["Software Design and Architecture Specialization", "University of Alberta / Coursera", "System Design & DSA", 2, "https://www.coursera.org/specializations/software-design-architecture", "planned", "Design patterns, SOLID, architecture trade-offs — directly strengthens system design interviews."],
      ["Meta Front-End Developer Professional Certificate", "Meta / Coursera", "Frontend Depth (TS/Next.js)", 3, "https://www.coursera.org/professional-certificates/meta-front-end-developer", "planned", "Advanced React patterns + adjacent modules; use to fill in Next.js/testing gaps not in your current stack."],
      ["Software Testing and Automation Specialization", "Coursera", "Frontend Depth (TS/Next.js)", 3, "https://www.coursera.org/specializations/software-testing-automation", "planned", "You list PyTest/Jest — this formalizes it into a certification a foreign recruiter can filter on."],
      ["IBM Full Stack Software Developer Professional Certificate", "IBM / Coursera", "Full Software Engineering", 4, "https://www.coursera.org/professional-certificates/ibm-full-stack-cloud-developer", "planned", "Broad end-to-end validation: cloud-native, containers, microservices, Kubernetes deployment of full apps."],
      ["Software Development Lifecycle MasterTrack Certificate", "CU Boulder / Coursera", "Full Software Engineering", 4, "https://www.coursera.org/mastertrack/software-development-lifecycle-boulder", "planned", "Credit-bearing toward an actual CU Boulder Master's — highest-leverage 'weighs more than my diploma' credential."],
      ["IBM AI Engineering Professional Certificate", "IBM / Coursera", "AI Engineering (future)", 5, "https://www.coursera.org/professional-certificates/ai-engineer", "planned", "13-course series: ML, deep learning, transformers, RAG, agentic workflows with Keras/PyTorch/TensorFlow."],
      ["Generative AI for Software Development Specialization", "DeepLearning.AI / Coursera", "AI Engineering (future)", 5, "https://www.coursera.org/specializations/generative-ai-for-software-developers", "planned", "Applies GenAI directly to your dev workflow — complements the AI Engineering cert with practical tooling."]
  ];
  for (const r of seed) {
    run(
      `INSERT INTO courses (title, provider, category, phase, url, status, notes) VALUES (?,?,?,?,?,?,?)`,
      r
    );
  }
}

function seedWorkoutExercises() {
  const seed = [
      ["Push", "Dips (Wall-Mount Machine)", 4, "8–12", "Add weight via loaded backpack. Once you hit 12 reps, add more books/bottles.", "Lean your torso forward to target the chest. Keep your shoulders pushed down and away from your ears.", "https://www.muscleandstrength.com/exercises/dips", 1],
      ["Push", "30kg Bag Floor Press", 4, "10–15", "Increase reps. Once hitting 15, add a 3-second pause at the bottom of every rep.", "Lie flat, rest the bag across your chest, grab the sides and press up. Squeeze your chest hard at the top.", "https://fitbod.me/exercises/dumbbell-floor-press", 2],
      ["Push", "Pike Push-ups", 3, "8–12", "Elevate feet on a chair to put more bodyweight onto your shoulders.", 'Keep your legs straight and hips high in an inverted "V" shape. Lower the top of your head toward the floor.', "https://www.muscleandstrength.com/exercises/pike-push-up", 3],
      ["Push", "Push-ups", 3, "10–20", "Elevate feet (decline) or add the loaded backpack.", "Keep your core braced. Do not let your lower back sag.", "https://www.muscleandstrength.com/exercises/push-up", 4],
      ["Push", "Bodyweight Triceps Extensions", 3, "10–15", "Walk your feet further back to decrease your leverage, making it heavier.", "Use the dip handles. Keep your elbows tucked in tightly; don't let them flare out.", "https://www.muscleandstrength.com/exercises/bodyweight-tricep-extension", 5],
      ["Pull", "Wide Grip Pull-ups (Machine)", 4, "6–10", "Add loaded backpack when 10 reps are easy.", 'STRUGGLING? Do "Negatives": Jump up so your chin is over the bar, then fight gravity to lower yourself as slowly as possible (5–8 seconds).', "https://www.muscleandstrength.com/exercises/pull-up", 1],
      ["Pull", "30kg Bag Bent-Over Rows", 4, "8–15", "Increase reps. Once hitting 15, slow the lowering phase down to 3 seconds per rep.", "Hinge forward at the hips, keeping your back perfectly flat. Pull the bag directly into your belly button.", "https://www.muscleandstrength.com/exercises/bent-over-row", 2],
      ["Pull", "Chin-ups (Underhand Grip)", 3, "6–10", "Add loaded backpack.", 'STRUGGLING? Try "Isometric Holds": Jump to the top and hold your chin over the bar as long as possible.', "https://www.muscleandstrength.com/exercises/chin-up", 3],
      ["Pull", "Towel Inverted Rows", 3, "10–15", "Walk your feet further forward so your body is closer to parallel with the floor.", "Drape a towel over the high bar. Squeeze your shoulder blades together at the top of the pull.", "https://www.muscleandstrength.com/exercises/inverted-row", 4],
      ["Pull", "30kg Bag Zercher Carries", 3, "45–60s", "Walk further distances or purposefully walk slower to increase time under tension.", "Bear hug the bag or cradle it in your elbows. Walk with perfect, upright posture.", "https://www.muscleandstrength.com/exercises/zercher-carry", 5],
      ["Legs", "30kg Bear Hug Squats", 4, "10–20", "Once hitting 20 reps, add a deep 3-second pause at the very bottom of the squat.", "Squeeze the vertical bag tightly against your chest. Keep your chest up and drive through your heels.", "https://www.muscleandstrength.com/exercises/goblet-squat", 1],
      ["Legs", "30kg Bag Romanian Deadlifts", 4, "10–15", "Slow the descent down to 4 seconds, feeling a deep stretch in the hamstrings.", "Hold the bag horizontally. Keep legs mostly straight. Push your hips as far backward as they can go.", "https://www.muscleandstrength.com/exercises/romanian-deadlift", 2],
      ["Legs", "30kg Bag Bulgarian Split Squats", 3, "8–15", "Add a 2-second pause at the bottom of the movement.", "Hold the bag across your shoulders or in a bear hug. Rest your back foot on a chair.", "https://www.muscleandstrength.com/exercises/bulgarian-split-squat", 3],
      ["Legs", "Captain's Chair Leg Raises", 3, "10–20", "Keep legs perfectly straight. Add a 1-second hold at the top.", "Use the backrest and arm pads on your machine. Do not use momentum; use your core to lift your legs.", "https://www.muscleandstrength.com/exercises/hanging-leg-raise", 4]
  ];
  for (const r of seed) {
    run(
      `INSERT INTO workout_exercises (day, name, sets, reps_range, progression, tips, link, order_index) VALUES (?,?,?,?,?,?,?,?)`,
      r
    );
  }
}

function seedIfEmpty() {
  const courseCount = all("SELECT COUNT(*) c FROM courses")[0].c;
  if (courseCount === 0) seedCourses();
  const exCount = all("SELECT COUNT(*) c FROM workout_exercises")[0].c;
  if (exCount === 0) seedWorkoutExercises();
}

function reseedCourses() {
  run("DELETE FROM courses");
  seedCourses();
  return all("SELECT * FROM courses ORDER BY phase ASC, id ASC");
}

function reseedWorkout() {
  run("DELETE FROM workout_logs");
  run("DELETE FROM workout_exercises");
  seedWorkoutExercises();
  return all("SELECT * FROM workout_exercises ORDER BY day ASC, order_index ASC");
}

function getMediaDir() {
  const dir = path.join(path.dirname(dbFilePath), "media");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function initDb() {
  const userDataDir = app.getPath("userData");
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });
  dbFilePath = path.join(userDataDir, "life-os.sqlite3");

  const SQL = await initSqlJs({
    // sql.js ships its .wasm file next to dist/sql-wasm.js; resolve it from node_modules
    // so this works both in dev (running from source) and packaged builds.
    locateFile: (file) => path.join(path.dirname(require.resolve("sql.js")), file)
  });

  const fileBuffer = fs.existsSync(dbFilePath) ? fs.readFileSync(dbFilePath) : undefined;
  db = new SQL.Database(fileBuffer);
  db.run(SCHEMA_SQL);
  migrateSchema();
  seedIfEmpty();
  persist();
}

module.exports = { initDb, all, run, reseedCourses, reseedWorkout, getMediaDir, persist };
