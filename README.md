# PraxisOS

A local-first personal command center (Electron + React + TypeScript + SQLite) bundling: an Overview dashboard, Tasks (Kanban), Courses roadmap, Workout tracker, Nutrition & Hydration, a background-persistent Focus Timer, and Budget.

All data is stored locally in a SQLite database under your OS's app-data folder (`app.getPath('userData')/praxisos.sqlite3`) — nothing leaves your machine.

## Stack

- **TypeScript** end to end — main process, preload bridge, and renderer.
- **Electron + electron-vite** for the desktop shell and build tooling.
- **Tailwind CSS + shadcn/ui (Radix primitives) + lucide-react + Framer Motion** for the UI.
- **better-sqlite3 + Drizzle ORM** for local storage, wrapped in typed IPC channels.
- **TanStack Query** for data fetching/caching over IPC.
- **React Hook Form + Zod** for form state and validation.
- **Recharts** for the analytics visualizations (budget spend, focus hours, macro trend).

## Run it (development)

```bash
npm install
npm run dev
```

This starts `electron-vite` in dev mode — the renderer hot-reloads and the Electron window auto-reloads on main/preload changes.

## Build a Windows installer

```bash
npm install
npm run dist
```

This produces an installer in the `release/` folder (NSIS `.exe` on Windows, `.dmg` on Mac, `.AppImage` on Linux — whichever OS you build on).

> `better-sqlite3` is a native module. `npm install` triggers `electron-builder install-app-deps` via `postinstall`, which rebuilds it against Electron's ABI automatically. On Windows this needs either a prebuilt binary for your Electron version (the default) or, if none exists, the "Desktop development with C++" workload for Visual Studio Build Tools.

## What's inside

- **Overview** — active focus timer widget, next high-priority tasks, today's budget spend against your daily limit, hydration/calorie rings, and a weekly focus-hours chart.
- **Tasks** — a Kanban board (To Do / In Progress / Completed) with animated drag-and-drop between columns; each card carries an Eisenhower-quadrant priority badge.
- **Courses** — your Coursera roadmap, grouped by phase. Fully editable: add courses, change status.
- **Workout** — a 3-day Push/Pull/Legs routine. Log sets, edit exercises, merge two into a superset, attach a form-check video, and see a 14-day volume sparkline.
- **Nutrition** — log meals against a daily calorie goal, with hydration quick-add and a weekly macro trend chart folded into the same panel.
- **Focus Timer** — clock in/out, pause/resume. The active session lives in SQLite, not component state, so switching tabs never resets or duplicates it.
- **Budget** — income/expense/transfer transactions with a category dropdown that's always in sync with the selected type, plus a spend-by-category chart.
- **Settings** — theme (Light, Dark, Solarized, Midnight, Cyberpunk), typography, daily goals, data export, and reseed-to-defaults.

## Editing the seeded data

Everything seeded (courses, exercises, budget categories) is just rows in SQLite — edit or delete freely from the UI. For a clean slate, close the app and delete `praxisos.sqlite3` from the userData folder; it will be recreated and reseeded on next launch.
