# Demo data

`praxisos-demo-backup.json` is a full, plausible dataset for screenshots and
demos — six weeks of workout logs, a month of meals and hydration, three weeks
of focus sessions, budget history, habit streaks, journal entries and notes.

## Use it

**This replaces everything in the app.** Export your own data first
(*Settings → Export backup*), then:

*Settings → Restore from backup* → pick `praxisos-demo-backup.json`.

## Regenerate it

```bash
npm run demo:generate
```

Dates are generated relative to the day you run it, so the dashboard, streaks
and charts are always populated around "today". Re-run it before a screenshot
session rather than relying on a file generated weeks ago.

The generator is seeded, so re-running on the same day produces the same data.
