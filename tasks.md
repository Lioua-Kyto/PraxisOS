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

## 11. Suggestions

Recommendations noted while working through the above. None are implemented.

- **(bug-risk / data)** Legacy focus sessions written before the datetime fix
  are stored as UTC ISO strings, and their `date` column came from SQLite's
  UTC `date('now')`. Display now tolerates both formats, but a one-off
  backfill migration would make old rows group correctly in the daily/weekly
  rollups near midnight.
- **(performance)** The renderer bundle is ~2.6 MB in one chunk. Route-level
  `React.lazy` on the ten panels, plus a manual chunk for Recharts, would cut
  the initial parse noticeably.
- **(feature)** Export is JSON-only and there's no import. A restore-from-
  backup path (and CSV export for budget/nutrition) would make the data
  genuinely portable.
- **(feature)** Workout logging during a live session: the session view is
  read-only, so reps/weight still have to be logged afterwards from the
  exercise detail view. Logging a set inline at "Finish set" would close that
  loop and feed the volume sparkline automatically.
- **(feature)** Habit reminders/notifications for days a habit is scheduled
  but not yet checked in — Electron has a native notification API already.
- **(a11y)** Several icon-only controls rely on `title` alone; adding
  `aria-label` throughout and a visible focus ring on the habit squares would
  make keyboard navigation viable.
- **(feature)** Knowledge Base notes have no backlinks or full-text index.
  SQLite FTS5 over `notes.content` would scale search past a few hundred
  notes.
- **(tech-debt)** `npm audit` still reports moderate advisories from
  dev-only tooling (esbuild via vite/electron-vite/drizzle-kit). Clearing
  them needs vite 8, which electron-vite 2.x isn't validated against yet.

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
