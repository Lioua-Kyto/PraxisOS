# Changelog

All notable changes to PraxisOS are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The section for the running version is shown in-app the first time you open a
new release, so entries here are written for users, not for the commit log.

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
  colour, highlight, and images you can drag to move, drag an edge to resize,
  and drag a corner to rotate.
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

### Known limitations

- Early access: expect edge-case defects. Export a backup regularly.
- Updates are checked but not installed automatically — the release page opens
  in your browser.
