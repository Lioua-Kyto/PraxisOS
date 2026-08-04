# PraxisOS — Task Board

Working list for the current round of tweaks and features. Items are in the
order they were requested.

## 1. Workout panel

- [x] 1.1 Redesign the session (Start Workout) layout for better item display;
      fix the form-check video rendering as a black box; make rest time
      editable from the preview screen instead of only once rest starts.
- [x] 1.2 Fix the misaligned "Progression" input in the edit-exercise form.

## 2. Settings panel

- [x] 2.1 Theme presets: show a validation error when the name is empty
      instead of the button silently doing nothing; allow editing a preset's
      colors (not just its name); make the selected base theme actually
      affect the resulting preset.
- [x] 2.2 Add a Workout Plan schedule: assign workout days (from the Workout
      panel's plan, e.g. PPL/ULPPL) to days of the week, rest for the others,
      and auto-link it into the Habit Matrix.
- [x] 2.3 Add further settings that are useful for the app.

## 3. Budget panel

- [x] 3.1 Add "debt" as a transaction type with its own summary card; debt
      must affect the balance accordingly.
- [x] 3.2 Add more category options.

## 4. Focus Timer panel

- [x] 4.1 Fix sessions not capturing start/end time — affects both
      workout-started sessions and manual clock in/out.
- [x] 4.2 Fix the broken inner layout of the date/start/end inputs in the
      session edit row.
- [x] 4.3 Add more category options.

## 5. Knowledge Base panel

- [x] 5.1 Support pasting/inserting multiple images into a note, with resize
      and rotate controls.

## 6. Nutrition panel

- [x] 6.1 Food input suggests matching foods from a food database as you
      type, filtered by the selected meal category.
- [x] 6.2 Ship a seeded food list, and add a food-icon button at the top-right
      of the panel that opens a modal to add/remove foods in that list.
- [x] 6.3 Add hydration to the analytics chart alongside calories/protein.

## 7. Habit Matrix panel

- [x] 7.1 Rework to a daily check-in: user adds a habit, then checks in for
      the current day, lighting up that day's box.
- [x] 7.2 Show only the current month's boxes; for weekly habits show only
      that weekday's occurrences in the month (e.g. Fridays → 4/5 boxes).
- [x] 7.3 Make the check squares span the full card width (left to right)
      instead of stopping at the middle.
- [x] 7.4 Add color options in the add-habit form.
- [x] 7.5 Add a "custom" cadence below weekly where the user picks which days
      the habit is performed; only those days get boxes, and checking in on
      any other day is rejected with an error.

## 8. Tasks panel

- [x] 8.1 Allow editing existing tasks.
- [x] 8.2 Tasks get start/finish dates: moving to In Progress sets the start
      date, moving to Completed sets the finish date, moving back to To Do
      resets both.

## 9. Overview panel

- [x] 9.1 Make the Focus Timer card deep-link to the Focus Timer panel like
      the other cards do.

## 10. Sidebar

- [x] 10.1 Add the logo to the left of the title and make the sidebar
      expand/collapse — collapsed hides the app title and panel labels,
      leaving only the logo and panel icons.

## 11. Suggestions — all applied

- [x] **(bug-risk / data)** Backfill migration converting legacy UTC-ISO focus
      sessions to local wall-clock, including their `date` column, so old rows
      group correctly in the daily/weekly rollups. Idempotent — detects the
      "T" separator only the legacy format has.
- [x] **(performance)** Route-level `React.lazy` on the panels plus manual
      chunks for Recharts / markdown / framer-motion. Entry bundle went from
      **2.65 MB → 258 kB**; Recharts (1.17 MB) now loads only when a chart is
      shown, and the Overview chart is deferred behind its own Suspense
      boundary so the dashboard paints first.
- [x] **(feature)** Single dependable backup format covering every table,
      with restore. See "Backup format" below.
- [x] **(feature)** Inline set logging during a live workout — reps/weight are
      entered on the "Finish set" control and feed the volume history
      directly. Logging is optional and never blocks advancing.
- [x] **(feature)** Habit reminders via Electron's native notifications, with
      an enable toggle and time picker in Settings. Polls once a minute so it
      still fires if the machine slept through the target time, and notifies
      at most once per day.
- [x] **(a11y)** `aria-label`s on icon-only controls across Tasks, Habits,
      Settings, Notes, Journal, Nutrition and Workout; habit squares gained
      `aria-pressed`, descriptive labels and a visible focus ring.
- [x] **(feature)** SQLite FTS5 full-text search over notes (title/content/
      tags), relevance-ranked with bm25 and kept in sync by triggers. Prefix
      matching means results narrow as you type. Falls back to a LIKE scan if
      the FTS extension is ever unavailable.
- [x] **(tech-debt)** `npm audit` is now **0 vulnerabilities**, via Vite 5→7 +
      electron-vite 2→5, and removing `drizzle-kit` (see note below).

## Backup format

`Settings → Backup & restore` writes a single `.praxisos.json` file that is
the one supported format for both directions.

- Covers all 17 tables, including settings and theme presets.
- Rows are exported raw (snake_case, exactly as stored) rather than as the
  camelCase view models, so a restore is a faithful copy and doesn't depend
  on UI-layer mapping.
- Carries `formatVersion`; a backup from a newer app version is refused with
  a clear message instead of importing partially.
- Restores inside a transaction — parents before children, children deleted
  first — so a failure can't leave the database half-written.
- Import only writes columns the running build actually has, so a backup from
  a slightly different version still restores instead of hard-failing.
- Media (videos, note images) stay in the media folder rather than being
  inlined as base64. The file records which media it references, restore
  repoints paths at the local media folder by filename, and anything missing
  is reported after the restore.

---

## Notes & remarks

- **Video black box (1.1)** — the cause was URL construction, not the player:
  `file://${path}` produced `file://C:\Users\...`, where Windows' drive letter
  is parsed as the URL *host* and backslashes are invalid. All media now goes
  through `toFileUrl()`, which normalises separators and percent-encodes each
  segment.
- **Focus timer blank start/end (4.1)** — sessions were stored as UTC ISO
  (`2026-08-04T13:45:00Z`) while the table rendered `startTime.split(" ")[1]`,
  expecting a space separator, so every cell resolved to `undefined`. Storage
  is now consistently local wall-clock `YYYY-MM-DD HH:MM:SS`
  (`src/shared/datetime.ts`), and the daily/weekly rollups compare against a
  local date instead of SQLite's UTC `date('now')`.
- **Timer edit row (4.2)** — native date/time inputs were squeezed into narrow
  table columns, pushing their picker indicators outside the field. Editing
  now expands to a full-width panel below the row, and the indicators are
  inverted for dark themes so they stay visible.
- **Budget categories on existing installs (3.2)** — category seeding only ran
  when the table was completely empty, so an existing database would never
  have received the new `debt` categories and that dropdown would have come up
  empty. Seeding now tops up missing name+type pairs and leaves user-created
  categories alone.
- **Base theme in presets (2.1)** — the base theme genuinely did almost
  nothing, because a preset overrode nearly every surface token. Choosing a
  base theme now seeds the background/accent pickers from that theme, and the
  dialog shows a live preview of the derived palette. The base theme still
  supplies status colors and corner radius.
- **Managed workout habit (2.2)** — the schedule in Settings owns a habit
  flagged `managed_by = "workout-schedule"`. It's shown with a lock icon in
  the Habit Matrix and can't be deleted there; clearing every day in the
  schedule archives it.
- **`drizzle-kit` removed** — it was the last source of audit advisories (it
  pulls a deprecated `@esbuild-kit` chain) and wasn't referenced by any npm
  script: the app creates its schema idempotently at launch in
  `src/main/db/client.ts`, so no migration tooling runs at build or runtime.
  `drizzle-orm` itself is untouched. If you ever want the schema explorer
  back, `npx drizzle-kit studio` still works without it being a project
  dependency — it just needs a `drizzle.config.ts` recreated.
- **Verification of this round** — beyond typecheck/build/launch, the two
  riskiest pieces were exercised directly against SQLite: the FTS index was
  confirmed to create its triggers, match on prefixes, and drop entries on
  delete; and the backup export→wipe→restore cycle was run on a *copy* of the
  real database, confirming every table's row count matched, values survived
  intact, and `PRAGMA foreign_key_check` came back empty.
