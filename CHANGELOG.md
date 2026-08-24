# Changelog

All notable changes to PraxisOS are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The section for the running version is shown in-app the first time you open a
new release, so entries here are written for users, not for the commit log.

## 0.1.5 — 2026-08-24

### Fixed

- The suggestion list in Mastery sat on the Title field; it belongs on Skill
  area, which is what decides how items are grouped. Clicking Skill area now
  shows the areas you already use, with how many items each holds.
- That list was drawn by Windows rather than by the app, so it ignored the
  theme and appeared as a black box. It is the app's own list now, matching the
  food picker in Nutrition — click to see everything, type to filter, arrow
  keys and Enter to pick.

## 0.1.4 — 2026-08-24

### Added

- Mastery items can be edited. Open an entry to change its title, type, skill
  area, source, link or notes instead of deleting it and adding it again.
- The Title field on a Mastery item now offers the titles you already use, so
  related entries stay spelled the same way.

### Fixed

- The focus category picker drew two outlines at once — the category's colour
  and a second one in the accent colour. It now draws one.
- Nexus's "Focus hours this week" chart kept its own copy of the category
  colours, so Entertainment still looked like Deep Work there. Every chart now
  reads the same list.
- The dashboard's focus card showed a raw name like `side_project` for most
  categories instead of "Side Project".
- One slice of the budget spend chart was drawn in a surface colour that was
  nearly invisible against the card behind it.
- Chart colours are tuned for the light theme instead of staying at the
  brightness picked for the dark ones.

## 0.1.3 — 2026-08-12

### Changed

- Entertainment now has its own colour instead of one close to Deep Work, so
  every focus category is distinct on the charts and timeline.
- The category picker's outline takes the colour of the selected category, so
  you can see which colour it'll be before clocking in.

### Fixed

- Today's timeline now fills in live as a session runs, instead of only
  updating when you clock out.

## 0.1.2 — 2026-08-08

### Added

- A setting for what closing the window does: keep running in the tray (the
  default) or quit. When quit is chosen, PraxisOS warns first if a focus timer
  is still running.
- Automatic in-app updates: PraxisOS now downloads and installs updates itself
  and restarts into the new version, instead of opening the download in a
  browser.

### Changed

- Custom window controls and menu replace the native title bar, so the
  minimise / maximise / close buttons and the menu follow the app's theme
  instead of a fixed dark style.
- Mastery is no longer only about finishing courses — track books, projects and
  deliberate practice too, grouped by the skill area you choose.

### Fixed

- The line under the top bar now runs the full width of the window.
- Hovering a window control no longer shows two overlapping tooltips.

## 0.1.1 — 2026-08-07

### Changed

- New hexagon logo, shown in the window, taskbar and system tray.
- Redesigned the top bar: it now takes the current theme's colour, drops the
  duplicated app name and logo (they stay in the sidebar), and puts the
  File / Edit / View / Help menu behind a single button, with the sidebar
  collapse toggle beside it.

### Fixed

- The system tray icon rendered with muddy, dark colours; it is now a crisp,
  purpose-sized icon.

## 0.1.0 — 2026-08-05

First public early-access release.

### Added

- Minimise to the system tray instead of quitting, so a running focus session
  and the habit reminders survive closing the window.
- A pinned mini timer — a small always-on-top window showing the running focus
  session, with pause and clock-out.
- A running indicator on the Focus Timer sidebar link, visible from any panel.
- Update checking against GitHub releases, with these notes shown after an
  update lands.
- Rich text notes and journal entries in a single editing mode: formatting,
  colour, highlight, and images that sit in the text flow — drag the block to
  move it between paragraphs, drag a handle to resize it.
- Reference photos on exercises as an alternative to a form-check video.
- Carbohydrate tracking alongside calories and protein.
- An About section in Settings with the privacy policy, terms, licence and
  version.
- Database migrations, so schema changes on update no longer risk your data.
- Versioned backups: an older backup is upgraded to the current format on
  import instead of being rejected.

### Fixed

- Attached videos played as a black player with dead controls. Media now loads
  over a dedicated protocol rather than `file://`.
- Editing a running session's start time only took effect once; later
  corrections silently did nothing.
- Habit reminders never appeared on Windows.
- Habits can now be checked in on any past day, so training outside or at a gym
  counts even when the schedule didn't ask for it.
- Custom theme presets changed the background as a side effect of changing the
  accent. A preset now inherits its base theme unless you override it.
- The font setting applies across the whole app, including headings and
  numerals.
- The weekly focus chart renders a full seven-day axis, so bars keep a constant
  width.
- Note list previews show readable text instead of raw markdown.
- A panel that hits an error no longer blanks the whole window and forces a
  restart — it shows the error and the rest of the app keeps working.

### Known limitations

- Early access: expect edge-case defects. Export a backup regularly.
- Updates are checked but not installed automatically — the release page opens
  in your browser.
- The installer is not code-signed, so Windows SmartScreen will warn on first
  run. Choose More info, then Run anyway. Only download the installer from the
  project's GitHub Releases page.
