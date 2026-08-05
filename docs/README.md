# PraxisOS documentation

| Document | What it covers |
| --- | --- |
| [Architecture.md](Architecture.md) | Process model, the layers a feature crosses, media handling, theming, why there is no migration tool |
| [ERD.md](ERD.md) | Every table, the three foreign keys, and the reasoning behind the less obvious columns |
| [UseCases.md](UseCases.md) | What the app is for, walked through one flow at a time, with the rules each flow enforces |
| [RELEASING.md](RELEASING.md) | Publishing a new version: one-time GitHub setup, the four commands, and what to do when a build fails |
| [Flowcharts.md](Flowcharts.md) | Diagrams for the non-obvious flows: startup, focus session lifecycle, the workout engine, theme resolution, backup/restore, search indexing |

## Getting oriented in the code

```
src/
  main/          Electron main process — owns the database and the filesystem
    db/          Drizzle schema + connection, DDL, seeding
    ipc/         One file per feature; all SQL lives here
    workout/     Session engine (pure logic, no Electron imports)
    habits/      Reminder scheduling
  preload/       The contextIsolation bridge — the only thing the renderer sees
  renderer/src/  React application
    queries/     TanStack Query hooks, one file per feature
    components/  One folder per panel
    theme/       Theme provider and built-in palettes
    lib/         Pure helpers (colour maths, money, markdown formatting)
  shared/        Types and datetime helpers used by both processes
```

Start with `src/shared/types.ts`. It is the contract both sides compile
against, so it is the fastest way to see what the app can actually do.

## Running it

```bash
npm install
npm run dev
```

`npm run typecheck` runs both TypeScript projects (main/preload and renderer).
`npm run build` produces a distributable.

`better-sqlite3` is a native module and is pinned to a version with prebuilt
binaries matching this Electron release's ABI. Bumping either one without
checking the other will break the build on machines without a C++ toolchain.
