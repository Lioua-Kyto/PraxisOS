# PraxisOS

A local-first personal command center (Electron + React + TypeScript + SQLite) bundling: a dashboard, Kanban tasks, habit tracking, a learning roadmap, a workout tracker, nutrition & hydration, a background-persistent focus timer, a budget ledger, a daily journal and a searchable notes codex.

All data is stored locally in a SQLite database under your OS's app-data folder (`app.getPath('userData')/praxisos.sqlite3`) — nothing leaves your machine.

> **Early access.** PraxisOS is pre-1.0. Expect edge-case bugs and features that change between releases. Export a backup regularly from *Settings → Export backup*.

## Legal

- [Privacy Policy](PRIVACY.md) — what is stored, where, and the two situations in which the app touches the network.
- [Terms of Use](TERMS.md) — licence, early-access warning, and the limits of liability.
- [End User Licence Agreement](build/license.txt) — shown by the installer; you must accept it before installation proceeds.
- [Changelog](CHANGELOG.md) — what changed in each release.

## Stack

- **TypeScript** end to end — main process, preload bridge, and renderer.
- **Electron + electron-vite** for the desktop shell and build tooling.
- **Tailwind CSS + shadcn/ui (Radix primitives) + lucide-react + Framer Motion** for the UI.
- **better-sqlite3 + Drizzle ORM** for local storage, wrapped in typed IPC channels, with generated SQL migrations applied at launch.
- **Tiptap (ProseMirror)** for the single-mode rich text editor behind notes and journal entries.
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
npm run dist
```

This produces an installer in the `release/` folder (NSIS `.exe` on Windows, `.dmg` on Mac, `.AppImage` on Linux — whichever OS you build on). The Windows installer presents the EULA and requires the user to accept it before continuing.

> `better-sqlite3` is a native module. `npm install` triggers `electron-builder install-app-deps` via `postinstall`, which rebuilds it against Electron's ABI automatically. On Windows this needs either a prebuilt binary for your Electron version (the default) or, if none exists, the "Desktop development with C++" workload for Visual Studio Build Tools.

## Changing the database schema

The schema lives in `src/main/db/schema.ts`. After editing it:

```bash
npm run db:generate
```

This writes a new `.sql` file to `drizzle/`. The app applies pending migrations on launch, so an existing install is upgraded in place rather than being left with missing columns. Commit the generated migration alongside the schema change.

## What's inside

- **Nexus** (Overview) — clickable counters that deep-link into each panel, today's agenda, a 14-day consistency strip, hydration/calorie rings, and a weekly focus-hours chart.
- **Tasks** — a Kanban board (To Do / In Progress / Completed) with animated drag-and-drop; each card carries an Eisenhower-quadrant priority badge and start/finish stamps.
- **Discipline** (Habits) — daily, weekly or custom cadences with streaks. Any past day can be checked in, so training outside or at a gym still counts.
- **Mastery** (Courses) — the courses and certifications you are working through, grouped into phases.
- **Workout** — a 3-day Push/Pull/Legs routine. Log sets, merge exercises into supersets, attach a form-check video *or* a reference photo, and see a 14-day volume sparkline. A guided session walks preview → work → rest per set.
- **Nutrition** — log meals against daily calorie, protein and carbohydrate goals, with hydration quick-add and a weekly macro trend chart.
- **Flow** (Focus Timer) — clock in/out, pause/resume, correct a running session's times after the fact. The active session lives in SQLite, not component state, so switching tabs never resets or duplicates it. It can be popped out into a pinned mini window.
- **Ledger** (Budget) — income/expense/transfer/debt transactions with editable entries and a spend-by-category chart.
- **Journal** — morning intentions, evening reflection and a brain-dump list.
- **Codex** (Knowledge Base) — rich text notes with images, backed by SQLite full-text search.
- **Settings** — eight themes plus custom presets, app-wide typography, daily goals, backup/restore, and an About section with version and legal documents.

## Documentation

Architecture, entity relationship diagram, use cases and flowcharts live in [`docs/`](docs/README.md).

## Editing the seeded data

Everything seeded (courses, exercises, budget categories, foods) is just rows in SQLite — edit or delete freely from the UI. For a clean slate, quit the app from the tray and delete `praxisos.sqlite3` from the userData folder; it will be recreated and reseeded on next launch.
