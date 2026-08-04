# Life OS

A personal desktop app (Electron + React + SQLite) bundling: Dashboard, Todo (mother panel), Courses roadmap, Workout tracker (your bodyweight/30kg-bag PPL routine), Nutrition, Water, Focus Timer, and Budget.

All data is stored locally in a SQLite file under your OS's app-data folder (`app.getPath('userData')/life-os.sqlite3`) — nothing leaves your machine.

## Run it (development)

```bash
npm install
npm run dev
```

This starts Vite (the React UI) and Electron together, with hot reload.

## Build a Windows installer

```bash
npm install
npm run dist
```

This produces an installer in the `release/` folder (NSIS `.exe` on Windows, `.dmg` on Mac, `.AppImage` on Linux — whichever OS you build on).

> The SQLite engine (`sql.js`) is a pure JavaScript/WebAssembly build — no native compiler, no Visual Studio Build Tools, no `node-gyp` required. `npm install` should always work out of the box regardless of your Node version.

## What's inside

- **Dashboard** — top-level view: tasks done, focus time today, course progress, sets logged, calories, water, budget balance. Click any card to jump to that panel.
- **Todo (mother panel)** — Eisenhower-style quadrants (urgent/important). This is the panel the dashboard is built around.
- **Courses** — your Coursera roadmap, pre-seeded with a prioritized plan (Cloud & DevOps → System Design & DSA → Frontend depth → Full software engineering → AI engineering). Fully editable: add courses, change status (planned / in progress / completed).
- **Workout** — your 3-day bodyweight + 30kg-bag Push/Pull/Legs routine, pre-loaded from your spreadsheet. Log sets (reps/weight/notes) per exercise, edit any exercise, add new ones, or select two exercises and merge them into a superset.
- **Nutrition** — log meals with calories/protein against a daily goal.
- **Water** — quick-add buttons + custom amounts against a daily goal.
- **Focus Timer** — clock in/out per category (Deep Work, Training, Learning, Other); today's totals roll up into the Dashboard.
- **Budget** — income, expenses, and debts, with running balance and open-debt total.

## Editing the seeded data

Everything seeded (courses, exercises) is just rows in SQLite — edit or delete freely from the UI. If you ever want a clean slate, close the app and delete `life-os.sqlite3` from the userData folder; it will be recreated and reseeded on next launch.
