// Thin wrapper around window.api (exposed by electron/preload.js).
// Every function below returns a Promise.

const api = window.api;

export const Todos = {
  list: () => api.all("SELECT * FROM todos ORDER BY done ASC, created_at DESC"),
  add: (text, importance, due_date) =>
    api.run(
      "INSERT INTO todos (text, importance, due_date) VALUES (?,?,?)",
      [text, importance, due_date || null]
    ),
  toggle: (id, done) =>
    api.run(
      "UPDATE todos SET done=?, completed_at=? WHERE id=?",
      [done ? 1 : 0, done ? new Date().toISOString() : null, id]
    ),
  update: (id, fields) => {
    const keys = Object.keys(fields);
    const set = keys.map((k) => `${k}=?`).join(", ");
    return api.run(`UPDATE todos SET ${set} WHERE id=?`, [...keys.map((k) => fields[k]), id]);
  },
  remove: (id) => api.run("DELETE FROM todos WHERE id=?", [id])
};

export const Courses = {
  list: () => api.all("SELECT * FROM courses ORDER BY phase ASC, id ASC"),
  add: (course) =>
    api.run(
      "INSERT INTO courses (title, provider, category, phase, url, status, notes) VALUES (?,?,?,?,?,?,?)",
      [course.title, course.provider || "", course.category || "", course.phase || 1, course.url || "", course.status || "planned", course.notes || ""]
    ),
  update: (id, fields) => {
    const keys = Object.keys(fields);
    const set = keys.map((k) => `${k}=?`).join(", ");
    return api.run(`UPDATE courses SET ${set} WHERE id=?`, [...keys.map((k) => fields[k]), id]);
  },
  remove: (id) => api.run("DELETE FROM courses WHERE id=?", [id])
};

export const Workout = {
  listExercises: () =>
    api.all("SELECT * FROM workout_exercises WHERE archived=0 ORDER BY day ASC, order_index ASC"),
  addExercise: (ex) =>
    api.run(
      "INSERT INTO workout_exercises (day, name, sets, reps_range, progression, tips, link, order_index, superset_group) VALUES (?,?,?,?,?,?,?,?,?)",
      [ex.day, ex.name, ex.sets || 3, ex.reps_range || "", ex.progression || "", ex.tips || "", ex.link || "", ex.order_index || 0, ex.superset_group || null]
    ),
  updateExercise: (id, fields) => {
    const keys = Object.keys(fields);
    const set = keys.map((k) => `${k}=?`).join(", ");
    return api.run(`UPDATE workout_exercises SET ${set} WHERE id=?`, [...keys.map((k) => fields[k]), id]);
  },
  archiveExercise: (id) => api.run("UPDATE workout_exercises SET archived=1 WHERE id=?", [id]),
  mergeToSuperset: (idA, idB) => {
    const group = `ss-${idA}-${idB}-${Date.now()}`;
    return Promise.all([
      api.run("UPDATE workout_exercises SET superset_group=? WHERE id=?", [group, idA]),
      api.run("UPDATE workout_exercises SET superset_group=? WHERE id=?", [group, idB])
    ]);
  },
  unlinkSuperset: (id) => api.run("UPDATE workout_exercises SET superset_group=NULL WHERE id=?", [id]),
  attachVideo: (id) => window.api.pickVideo(id),
  removeVideo: (id) => Workout.updateExercise(id, { video_path: null }),
  volumeByExercise: (exercise_id, days = 14) =>
    api.all(
      `SELECT date, SUM(reps * COALESCE(weight_kg,1)) vol FROM workout_logs
       WHERE exercise_id=? AND date >= date('now', ?) GROUP BY date ORDER BY date ASC`,
      [exercise_id, `-${days} days`]
    ),
  logSet: (exercise_id, set_number, reps, weight_kg, notes) =>
    api.run(
      "INSERT INTO workout_logs (exercise_id, set_number, reps, weight_kg, notes) VALUES (?,?,?,?,?)",
      [exercise_id, set_number, reps, weight_kg, notes || ""]
    ),
  logsForExercise: (exercise_id, limit = 30) =>
    api.all(
      "SELECT * FROM workout_logs WHERE exercise_id=? ORDER BY date DESC, id DESC LIMIT ?",
      [exercise_id, limit]
    ),
  logsToday: () => api.all("SELECT * FROM workout_logs WHERE date = date('now')"),
  removeLog: (id) => api.run("DELETE FROM workout_logs WHERE id=?", [id])
};

export const Nutrition = {
  listToday: () => api.all("SELECT * FROM nutrition_logs WHERE date = date('now') ORDER BY id DESC"),
  listByDate: (date) => api.all("SELECT * FROM nutrition_logs WHERE date = ? ORDER BY id DESC", [date]),
  add: (entry) =>
    api.run(
      "INSERT INTO nutrition_logs (meal, food, calories, protein_g, time) VALUES (?,?,?,?, time('now'))",
      [entry.meal || "", entry.food || "", entry.calories || 0, entry.protein_g || 0]
    ),
  remove: (id) => api.run("DELETE FROM nutrition_logs WHERE id=?", [id]),
  weeklyTotals: () =>
    api.all(
      "SELECT date, SUM(calories) calories, SUM(protein_g) protein FROM nutrition_logs WHERE date >= date('now','-6 days') GROUP BY date ORDER BY date ASC"
    )
};

export const Water = {
  listToday: () => api.all("SELECT * FROM water_logs WHERE date = date('now') ORDER BY id DESC"),
  add: (amount_ml) => api.run("INSERT INTO water_logs (amount_ml, time) VALUES (?, time('now'))", [amount_ml]),
  remove: (id) => api.run("DELETE FROM water_logs WHERE id=?", [id]),
  totalToday: async () => {
    const rows = await api.all("SELECT COALESCE(SUM(amount_ml),0) total FROM water_logs WHERE date = date('now')");
    return rows[0]?.total || 0;
  }
};

export const Timer = {
  start: (category, label) =>
    api.run(
      "INSERT INTO time_sessions (category, label, start_time) VALUES (?,?, datetime('now'))",
      [category, label || ""]
    ),
  stop: (id) =>
    api.run(
      `UPDATE time_sessions
       SET end_time = datetime('now'),
           duration_seconds = CAST((julianday(datetime('now')) - julianday(start_time)) * 86400 AS INTEGER)
       WHERE id=?`,
      [id]
    ),
  addManual: (entry) =>
    api.run(
      `INSERT INTO time_sessions (category, label, date, start_time, end_time, duration_seconds)
       VALUES (?,?,?,?,?, CAST((julianday(?) - julianday(?)) * 86400 AS INTEGER))`,
      [entry.category, entry.label || "", entry.date, entry.start_time, entry.end_time, entry.end_time, entry.start_time]
    ),
  update: (id, fields) => {
    const keys = Object.keys(fields);
    const set = keys.map((k) => `${k}=?`).join(", ");
    return api.run(`UPDATE time_sessions SET ${set} WHERE id=?`, [...keys.map((k) => fields[k]), id]).then(async (res) => {
      // recompute duration if both start and end are present
      const rows = await api.all("SELECT * FROM time_sessions WHERE id=?", [id]);
      const row = rows[0];
      if (row && row.start_time && row.end_time) {
        await api.run(
          `UPDATE time_sessions SET duration_seconds = CAST((julianday(?) - julianday(?)) * 86400 AS INTEGER) WHERE id=?`,
          [row.end_time, row.start_time, id]
        );
      }
      return res;
    });
  },
  remove: (id) => api.run("DELETE FROM time_sessions WHERE id=?", [id]),
  recent: (limit = 20) => api.all("SELECT * FROM time_sessions ORDER BY id DESC LIMIT ?", [limit]),
  listByDate: (date) => api.all("SELECT * FROM time_sessions WHERE date=? ORDER BY start_time ASC", [date]),
  todayTotals: () =>
    api.all(
      "SELECT category, SUM(COALESCE(duration_seconds,0)) seconds FROM time_sessions WHERE date=date('now') GROUP BY category"
    ),
  weeklyTotals: () =>
    api.all(
      "SELECT date, category, SUM(COALESCE(duration_seconds,0)) seconds FROM time_sessions WHERE date >= date('now','-6 days') GROUP BY date, category ORDER BY date ASC"
    )
};

export const Budget = {
  list: () => api.all("SELECT * FROM budget_transactions ORDER BY date DESC, id DESC"),
  add: (tx) =>
    api.run(
      "INSERT INTO budget_transactions (type, amount, category, description, date, debt_status) VALUES (?,?,?,?,?,?)",
      [tx.type, tx.amount, tx.category || "", tx.description || "", tx.date || new Date().toISOString().slice(0, 10), tx.type === "debt" ? tx.debt_status || "open" : null]
    ),
  update: (id, fields) => {
    const keys = Object.keys(fields);
    const set = keys.map((k) => `${k}=?`).join(", ");
    return api.run(`UPDATE budget_transactions SET ${set} WHERE id=?`, [...keys.map((k) => fields[k]), id]);
  },
  remove: (id) => api.run("DELETE FROM budget_transactions WHERE id=?", [id]),
  summary: async () => {
    const rows = await api.all(
      `SELECT type, SUM(amount) total FROM budget_transactions WHERE type IN ('income','expense') GROUP BY type`
    );
    const income = rows.find((r) => r.type === "income")?.total || 0;
    const expense = rows.find((r) => r.type === "expense")?.total || 0;
    const debtRows = await api.all(
      `SELECT COALESCE(SUM(amount),0) total FROM budget_transactions WHERE type='debt' AND debt_status='open'`
    );
    return { income, expense, balance: income - expense, openDebt: debtRows[0]?.total || 0 };
  }
};

export const System = {
  exportAll: async () => {
    const tables = ["todos", "courses", "workout_exercises", "workout_logs", "nutrition_logs", "water_logs", "time_sessions", "budget_transactions"];
    const dump = {};
    for (const t of tables) dump[t] = await api.all(`SELECT * FROM ${t}`);
    return dump;
  },
  restoreDefaultCourses: () => window.api.reseedCourses(),
  restoreDefaultWorkout: () => window.api.reseedWorkout()
};

export default { Todos, Courses, Workout, Nutrition, Water, Timer, Budget, System };
